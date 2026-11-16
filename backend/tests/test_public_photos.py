import uuid

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.media import Media, PhotoConfiguration
from app.routers.public import list_public_photos


def create_media(public_id: str, *, deletion_pending: bool = False) -> Media:
    return Media(
        cloudinary_public_id=public_id,
        image_url=f"https://res.cloudinary.com/demo/image/upload/{public_id}.jpg",
        original_filename=f"{public_id.rsplit('/', 1)[-1]}.jpg",
        file_format="jpg",
        file_size=128,
        width=16,
        height=8,
        alt_text="Shared school photo",
        deletion_pending=deletion_pending,
    )


@pytest.mark.asyncio
async def test_public_photo_list_returns_shared_configuration(
    session: AsyncSession,
) -> None:
    photo = create_media("school/hero")
    session.add(photo)
    await session.flush()
    session.add(
        PhotoConfiguration(
            config_key="campusImages.hero",
            media_id=photo.id,
            display_order=0,
        )
    )
    await session.commit()

    result = await list_public_photos(session)

    assert len(result) == 1
    assert result[0].config_key == "campusImages.hero"
    assert result[0].media.image_url == photo.image_url
    assert result[0].media.id == photo.id


@pytest.mark.asyncio
async def test_public_photo_list_hides_pending_deletions(
    session: AsyncSession,
) -> None:
    photo = create_media("school/pending", deletion_pending=True)
    session.add(photo)
    await session.flush()
    session.add(
        PhotoConfiguration(
            config_key="campusImages.hero",
            media_id=photo.id,
            display_order=0,
        )
    )
    await session.commit()

    result = await list_public_photos(session)

    assert result == []
    assert await session.scalar(select(Media.id)) == photo.id


@pytest.mark.asyncio
async def test_photo_configuration_contract_uses_media_uuid(
    session: AsyncSession,
) -> None:
    media = create_media(f"school/{uuid.uuid4()}")
    session.add(media)
    await session.flush()
    row = PhotoConfiguration(
        config_key="primaryClassesGallery.photos",
        media_id=media.id,
        display_order=2,
    )
    session.add(row)
    await session.commit()

    result = await list_public_photos(session)

    assert result[0].media.id == media.id
    assert result[0].display_order == 2
