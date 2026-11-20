import json
import logging

from sqlalchemy import delete, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.content_record import ContentRecord, ContentRecordMedia
from app.models.media import Media
from app.schemas.content_record import ContentRecordUpsert

logger = logging.getLogger(__name__)


class ContentRecordError(Exception):
    """Base error for content record operations."""


class ContentRecordNotFoundError(ContentRecordError):
    pass


class ContentRecordValidationError(ContentRecordError):
    pass


class ContentRecordPersistenceError(ContentRecordError):
    pass


def _record_query():
    # populate_existing forces a reload, so links removed by a bulk delete in
    # the same session are not served from the identity map.
    return (
        select(ContentRecord)
        .options(
            selectinload(ContentRecord.media_links).selectinload(ContentRecordMedia.media)
        )
        .execution_options(populate_existing=True)
    )


async def get_record(
    session: AsyncSession,
    record_key: str,
    *,
    public: bool = False,
) -> ContentRecord | None:
    """Return one record. Public reads hide media that is pending deletion."""
    record = await session.scalar(
        _record_query().where(ContentRecord.record_key == record_key)
    )
    if record is not None and public:
        record.media_links = [
            link for link in record.media_links if not link.media.deletion_pending
        ]
    return record


async def upsert_record(
    session: AsyncSession,
    record_key: str,
    data: ContentRecordUpsert,
) -> ContentRecord:
    """Create or replace a record's payload and media links in one transaction."""
    media_ids = {link.media_id for link in data.media}
    if len(media_ids) != len(data.media):
        raise ContentRecordValidationError("The same media item appears more than once")

    if media_ids:
        found = (
            await session.scalars(select(Media.id).where(Media.id.in_(media_ids)))
        ).all()
        if len(found) != len(media_ids):
            raise ContentRecordValidationError("One or more media items do not exist")
        pending = (
            await session.scalars(
                select(Media.id).where(
                    Media.id.in_(media_ids), Media.deletion_pending.is_(True)
                )
            )
        ).all()
        if pending:
            raise ContentRecordValidationError("A referenced media item is being deleted")

    try:
        record = await session.scalar(
            select(ContentRecord).where(ContentRecord.record_key == record_key)
        )
        if record is None:
            record = ContentRecord(record_key=record_key)
            session.add(record)
            await session.flush()

        record.payload = json.dumps(data.payload, ensure_ascii=False)
        await session.execute(
            delete(ContentRecordMedia).where(ContentRecordMedia.record_id == record.id)
        )
        for link in data.media:
            session.add(
                ContentRecordMedia(
                    record_id=record.id,
                    media_id=link.media_id,
                    role=link.role,
                    position=link.position,
                )
            )
        await session.commit()
    except SQLAlchemyError as exc:
        await session.rollback()
        logger.exception("Could not save content record %s", record_key)
        raise ContentRecordPersistenceError("Could not save content record") from exc

    refreshed = await get_record(session, record_key)
    if refreshed is None:
        raise ContentRecordPersistenceError("Could not load saved content record")
    return refreshed


async def delete_record(session: AsyncSession, record_key: str) -> None:
    record = await session.scalar(
        select(ContentRecord).where(ContentRecord.record_key == record_key)
    )
    if record is None:
        raise ContentRecordNotFoundError(f"Content record '{record_key}' not found")
    try:
        await session.delete(record)
        await session.commit()
    except SQLAlchemyError as exc:
        await session.rollback()
        raise ContentRecordPersistenceError("Could not delete content record") from exc
