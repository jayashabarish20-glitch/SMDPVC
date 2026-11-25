"""Contract tests for the Higher Secondary Principal photo replacement flow.

The frontend (src/services/singlePhotoSlot.ts) relies on exactly this behaviour:
assign to an occupied (config_key, display_order) -> conflict, unknown config id
-> not found, and assign-at-free-slot -> unlink old -> reorder to 0 succeeds.
"""
import re
import uuid

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.media import Media, PhotoConfiguration
from app.schemas.content_record import RECORD_KEY_PATTERN
from app.services import photo_config_service as svc

KEY = "principal.higherSecondary"


def make_media(name: str) -> Media:
    return Media(
        cloudinary_public_id=f"school/{name}",
        image_url=f"https://res.cloudinary.com/demo/image/upload/school/{name}.jpg",
        original_filename=f"{name}.jpg",
        file_format="jpg",
        file_size=10,
        width=4,
        height=3,
        alt_text=name,
    )


async def _seed(session: AsyncSession, *names: str) -> list[Media]:
    items = [make_media(n) for n in names]
    session.add_all(items)
    await session.commit()
    return items


async def _configs(session: AsyncSession) -> list[PhotoConfiguration]:
    result = await session.scalars(
        select(PhotoConfiguration).where(PhotoConfiguration.config_key == KEY)
    )
    return list(result.all())


@pytest.mark.asyncio
async def test_first_time_assignment_at_slot_zero(session: AsyncSession) -> None:
    (new,) = await _seed(session, "new")
    config = await svc.assign_photo_to_config(session, new.id, KEY, 0)
    assert config.display_order == 0
    assert len(await _configs(session)) == 1


@pytest.mark.asyncio
async def test_assigning_to_occupied_slot_conflicts_and_keeps_old(session: AsyncSession) -> None:
    old, new = await _seed(session, "old", "new")
    old_id, new_id = old.id, new.id  # rollback expires ORM objects
    await svc.assign_photo_to_config(session, old_id, KEY, 0)
    with pytest.raises(svc.PhotoConfigConflictError, match="already exists at principal.higherSecondary"):
        await svc.assign_photo_to_config(session, new_id, KEY, 0)
    configs = await _configs(session)
    assert [c.media_id for c in configs] == [old_id]


@pytest.mark.asyncio
async def test_deleting_unknown_config_id_is_not_found(session: AsyncSession) -> None:
    with pytest.raises(svc.PhotoConfigNotFoundError):
        await svc.remove_photo_from_config(session, uuid.uuid4())


@pytest.mark.asyncio
async def test_replacement_sequence_leaves_single_photo_at_slot_zero(session: AsyncSession) -> None:
    old, new = await _seed(session, "old", "new")
    old_config = await svc.assign_photo_to_config(session, old.id, KEY, 0)

    # assign at free slot -> old stays linked meanwhile
    new_config = await svc.assign_photo_to_config(session, new.id, KEY, 1)
    assert len(await _configs(session)) == 2
    await svc.remove_photo_from_config(session, old_config.id)
    moved = await svc.update_display_order(session, new_config.id, 0)

    assert moved.display_order == 0
    configs = await _configs(session)
    assert [(c.media_id, c.display_order) for c in configs] == [(new.id, 0)]


def test_record_key_pattern_rejects_camel_case_and_accepts_lowercase() -> None:
    """Root cause of PUT /api/admin/content-records/principal.higherSecondary -> 422."""
    assert re.fullmatch(RECORD_KEY_PATTERN, "principal.higherSecondary") is None
    assert re.fullmatch(RECORD_KEY_PATTERN, "principal.highersecondary")
    assert re.fullmatch(RECORD_KEY_PATTERN, "principal.primary")
    assert re.fullmatch(RECORD_KEY_PATTERN, "principal.nursery")
