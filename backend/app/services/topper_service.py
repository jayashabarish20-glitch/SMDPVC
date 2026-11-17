import logging
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.content import Topper
from app.models.media import Media
from app.services.cloudinary_service import CloudinaryStorageError
from app.services.media_service import MediaError, delete_media

logger = logging.getLogger(__name__)


class TopperError(Exception):
    pass


class TopperNotFoundError(TopperError):
    pass


class TopperPersistenceError(TopperError):
    pass


async def _ensure_media(session: AsyncSession, media_id: UUID | None) -> None:
    if media_id is None:
        return
    media = await session.scalar(select(Media).where(Media.id == media_id))
    if media is None:
        raise TopperError("Referenced image was not found")


async def _discard_media(session: AsyncSession, media_id: UUID | None) -> None:
    """Best-effort removal of an image no longer used by any topper."""
    if media_id is None:
        return
    try:
        await delete_media(session, media_id)
    except (MediaError, CloudinaryStorageError):
        logger.exception("Could not remove unused media %s", media_id)


async def list_toppers(
    session: AsyncSession,
    grade_level: str | None = None,
    published_only: bool = False,
) -> list[Topper]:
    query = select(Topper).options(joinedload(Topper.media))
    if grade_level:
        query = query.where(Topper.grade_level == grade_level)
    if published_only:
        query = query.where(Topper.is_published.is_(True))
    query = query.order_by(
        Topper.grade_level,
        Topper.display_order,
        Topper.created_at,
    )
    toppers = list((await session.scalars(query)).unique().all())
    if published_only:
        for topper in toppers:
            if topper.media is not None and topper.media.deletion_pending:
                topper.media = None
                topper.media_id = None
        session.expunge_all()
    return toppers


async def create_topper(
    session: AsyncSession,
    student_name: str,
    grade_level: str,
    score: str,
    academic_year: str | None,
    stream: str,
    centums_scored: int,
    centum_subjects: list[str],
    display_order: int,
    is_published: bool,
    media_id: UUID | None,
) -> Topper:
    await _ensure_media(session, media_id)

    # Validate centum subjects
    if centum_subjects and len(centum_subjects) != centums_scored:
        raise TopperError(
            f"Number of centum subjects ({len(centum_subjects)}) must match centums_scored ({centums_scored})"
        )

    # Remove duplicates and validate subjects
    unique_subjects = list(dict.fromkeys(centum_subjects))
    if len(unique_subjects) != len(centum_subjects):
        raise TopperError("Duplicate subjects are not allowed")

    try:
        next_order = await session.scalar(
            select(func.coalesce(func.max(Topper.display_order), -1) + 1)
            .where(Topper.grade_level == grade_level)
        )
        topper = Topper(
            student_name=student_name,
            grade_level=grade_level,
            academic_year=academic_year,
            score=score,
            stream=stream,
            subject=None,
            rank=None,
            achievement=None,
            centums_scored=centums_scored,
            centum_subjects=unique_subjects,
            display_order=next_order or 0,
            is_published=is_published,
            media_id=media_id,
        )
        session.add(topper)
        await session.commit()
        await session.refresh(topper, ["media"])
        return topper
    except SQLAlchemyError as exc:
        await session.rollback()
        raise TopperPersistenceError(f"Failed to create topper: {exc}") from exc


async def get_topper(session: AsyncSession, topper_id: UUID) -> Topper:
    topper = await session.scalar(
        select(Topper).where(Topper.id == topper_id).options(joinedload(Topper.media))
    )
    if topper is None:
        raise TopperNotFoundError(f"Topper {topper_id} not found")
    return topper


async def update_topper(
    session: AsyncSession,
    topper_id: UUID,
    updates: dict,
) -> Topper:
    try:
        topper = await get_topper(session, topper_id)

        # Validate centum subjects if provided
        if "centum_subjects" in updates and "centums_scored" in updates:
            subjects = updates["centum_subjects"]
            score = updates["centums_scored"]
            if subjects and len(subjects) != score:
                raise TopperError(
                    f"Number of centum subjects ({len(subjects)}) must match centums_scored ({score})"
                )
            # Remove duplicates
            unique_subjects = list(dict.fromkeys(subjects))
            if len(unique_subjects) != len(subjects):
                raise TopperError("Duplicate subjects are not allowed")
            updates["centum_subjects"] = unique_subjects
        elif "centum_subjects" in updates:
            subjects = updates["centum_subjects"]
            if subjects and len(subjects) != topper.centums_scored:
                raise TopperError(
                    f"Number of centum subjects ({len(subjects)}) must match centums_scored ({topper.centums_scored})"
                )
            # Remove duplicates
            unique_subjects = list(dict.fromkeys(subjects))
            if len(unique_subjects) != len(subjects):
                raise TopperError("Duplicate subjects are not allowed")
            updates["centum_subjects"] = unique_subjects

        # Handle media changes
        if "media_id" in updates:
            new_media_id = updates["media_id"]
            if new_media_id != topper.media_id:
                await _ensure_media(session, new_media_id)
                old_media_id = topper.media_id
                topper.media_id = new_media_id
                await session.flush()
                await _discard_media(session, old_media_id)
            del updates["media_id"]

        for key, value in updates.items():
            if hasattr(topper, key):
                setattr(topper, key, value)

        session.add(topper)
        await session.commit()
        await session.refresh(topper, ["media"])
        return topper
    except TopperNotFoundError:
        raise
    except SQLAlchemyError as exc:
        await session.rollback()
        raise TopperPersistenceError(f"Failed to update topper: {exc}") from exc


async def delete_topper(session: AsyncSession, topper_id: UUID) -> None:
    try:
        topper = await get_topper(session, topper_id)
        media_id = topper.media_id
        await session.delete(topper)
        await session.commit()
        await _discard_media(session, media_id)
    except TopperNotFoundError:
        raise
    except SQLAlchemyError as exc:
        await session.rollback()
        raise TopperPersistenceError(f"Failed to delete topper: {exc}") from exc


async def reorder_toppers(
    session: AsyncSession,
    grade_level: str,
    topper_ids: list[UUID],
) -> list[Topper]:
    try:
        for index, topper_id in enumerate(topper_ids):
            topper = await get_topper(session, topper_id)
            if topper.grade_level != grade_level:
                raise TopperError(
                    f"Topper {topper_id} does not belong to grade {grade_level}"
                )
            topper.display_order = index
            session.add(topper)

        await session.commit()
        return await list_toppers(session, grade_level=grade_level)
    except TopperNotFoundError:
        await session.rollback()
        raise
    except SQLAlchemyError as exc:
        await session.rollback()
        raise TopperPersistenceError(f"Failed to reorder toppers: {exc}") from exc
