from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.content_record import ContentRecord
from app.schemas.content_record import (
    RECORD_KEY_PATTERN,
    ContentRecordRead,
    ContentRecordUpsert,
)
from app.services import content_record_service as service

router = APIRouter(prefix="/content-records", tags=["admin-content-records"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
AdminAccess = Annotated[None, Depends(require_admin)]
RecordKey = Annotated[str, Path(pattern=RECORD_KEY_PATTERN)]


def _http_error(exc: service.ContentRecordError) -> HTTPException:
    if isinstance(exc, service.ContentRecordNotFoundError):
        return HTTPException(status_code=404, detail=str(exc))
    if isinstance(exc, service.ContentRecordPersistenceError):
        return HTTPException(status_code=500, detail=str(exc))
    return HTTPException(status_code=422, detail=str(exc))


@router.get("/{record_key}", response_model=ContentRecordRead | None)
async def get_content_record(
    record_key: RecordKey,
    _: AdminAccess,
    session: DatabaseSession,
) -> ContentRecord | None:
    return await service.get_record(session, record_key)


@router.put("/{record_key}", response_model=ContentRecordRead)
async def upsert_content_record(
    record_key: RecordKey,
    data: ContentRecordUpsert,
    _: AdminAccess,
    session: DatabaseSession,
) -> ContentRecord:
    try:
        return await service.upsert_record(session, record_key, data)
    except service.ContentRecordError as exc:
        raise _http_error(exc) from exc


@router.delete("/{record_key}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content_record(
    record_key: RecordKey,
    _: AdminAccess,
    session: DatabaseSession,
) -> None:
    try:
        await service.delete_record(session, record_key)
    except service.ContentRecordError as exc:
        raise _http_error(exc) from exc
