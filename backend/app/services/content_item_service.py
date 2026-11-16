import logging
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.content import ContentItem
from app.models.media import Media
from app.services.cloudinary_service import CloudinaryStorageError
from app.services.media_service import MediaError, delete_media

logger = logging.getLogger(__name__)

# page_slug -> allowed section_key values. Anything else is rejected.
ALLOWED_SECTIONS: dict[str, frozenset[str]] = {
    "nursery": frozenset({"classes", "learning", "extracurricular"}),
    "primary": frozenset({"classes", "learning", "extracurricular"}),
    "home": frozenset({"infrastructure"}),
}


class ContentItemError(Exception):
    pass


class InvalidSectionError(ContentItemError):
    pass


class ContentItemNotFoundError(ContentItemError):
    pass


class ContentItemPersistenceError(ContentItemError):
    pass


def validate_section(page_slug: str, section_key: str) -> None:
    if section_key not in ALLOWED_SECTIONS.get(page_slug, frozenset()):
        raise InvalidSectionError(
            f"Unknown content section: {page_slug}/{section_key}"
        )


async def _ensure_media(session: AsyncSession, media_id: UUID | None) -> None:
    if media_id is None:
        return
    media = await session.scalar(select(Media).where(Media.id == media_id))
    if media is None:
        raise ContentItemError("Referenced image was not found")


async def _discard_media(session: AsyncSession, media_id: UUID | None) -> None:
    """Best-effort removal of an image no longer used by any content."""
    if media_id is None:
        return
    try:
        await delete_media(session, media_id)
    except (MediaError, CloudinaryStorageError):
        logger.exception("Could not remove unused media %s", media_id)


async def list_items(
    session: AsyncSession,
    page_slug: str | None = None,
    section_key: str | None = None,
    active_only: bool = False,
) -> list[ContentItem]:
    query = select(ContentItem).options(joinedload(ContentItem.media))
    if page_slug:
        query = query.where(ContentItem.page_slug == page_slug)
    if section_key:
        query = query.where(ContentItem.section_key == section_key)
    if active_only:
        query = query.where(ContentItem.is_active.is_(True))
    query = query.order_by(
        ContentItem.page_slug,
        ContentItem.section_key,
        ContentItem.display_order,
        ContentItem.created_at,
    )
    items = list((await session.scalars(query)).unique().all())
    if active_only:
        # Never expose an image that is being deleted.
        for item in items:
            if item.media is not None and item.media.deletion_pending:
                item.media = None
                item.media_id = None
        session.expunge_all()
    return items


async def create_item(
    session: AsyncSession,
    page_slug: str,
    section_key: str,
    title: str,
    description: str,
    is_active: bool,
    media_id: UUID | None,
) -> ContentItem:
    validate_section(page_slug, section_key)
    await _ensure_media(session, media_id)
    try:
        next_order = await session.scalar(
            select(func.coalesce(func.max(ContentItem.display_order), -1) + 1)
            .where(ContentItem.page_slug == page_slug)
            .where(ContentItem.section_key == section_key)
        )
        item = ContentItem(
            page_slug=page_slug,
            section_key=section_key,
            title=title,
            description=description,
            is_active=is_active,
            media_id=media_id,
            display_order=next_order or 0,
        )
        session.add(item)
        await session.commit()
        await session.refresh(item, attribute_names=["media"])
        return item
    except SQLAlchemyError as exc:
        await session.rollback()
        raise ContentItemPersistenceError("Could not save content item") from exc


async def update_item(
    session: AsyncSession,
    item_id: UUID,
    values: dict,
) -> ContentItem:
    item = await session.scalar(select(ContentItem).where(ContentItem.id == item_id))
    if item is None:
        raise ContentItemNotFoundError("Content item not found")

    old_media_id = item.media_id
    if "media_id" in values:
        await _ensure_media(session, values["media_id"])
    try:
        for field, value in values.items():
            setattr(item, field, value)
        await session.commit()
        await session.refresh(item, attribute_names=["media"])
    except SQLAlchemyError as exc:
        await session.rollback()
        raise ContentItemPersistenceError("Could not save content item") from exc

    if "media_id" in values and old_media_id and old_media_id != item.media_id:
        await _discard_media(session, old_media_id)
    return item


async def delete_item(session: AsyncSession, item_id: UUID) -> None:
    item = await session.scalar(select(ContentItem).where(ContentItem.id == item_id))
    if item is None:
        raise ContentItemNotFoundError("Content item not found")
    media_id = item.media_id
    try:
        await session.delete(item)
        await session.commit()
    except SQLAlchemyError as exc:
        await session.rollback()
        raise ContentItemPersistenceError("Could not delete content item") from exc
    await _discard_media(session, media_id)


async def reorder_items(
    session: AsyncSession,
    page_slug: str,
    section_key: str,
    ids: list[UUID],
) -> list[ContentItem]:
    validate_section(page_slug, section_key)
    if len(set(ids)) != len(ids):
        raise ContentItemError("Duplicate ids in reorder request")
    try:
        existing = (
            await session.scalars(
                select(ContentItem)
                .where(ContentItem.page_slug == page_slug)
                .where(ContentItem.section_key == section_key)
            )
        ).all()
        by_id = {item.id: item for item in existing}
        if set(ids) != set(by_id):
            await session.rollback()
            raise ContentItemError(
                "Reorder request must list every item in the section exactly once"
            )
        for position, item_id in enumerate(ids):
            by_id[item_id].display_order = position
        await session.commit()
    except SQLAlchemyError as exc:
        await session.rollback()
        raise ContentItemPersistenceError("Could not reorder content items") from exc
    return await list_items(session, page_slug, section_key)
