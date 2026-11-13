from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.content import ContentItem
from app.schemas.content import (
    ContentItemCreate,
    ContentItemRead,
    ContentItemReorder,
    ContentItemUpdate,
)
from app.services import content_item_service as service

router = APIRouter(prefix="/content-items", tags=["admin-content-items"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
AdminAccess = Annotated[None, Depends(require_admin)]


def _http_error(exc: service.ContentItemError) -> HTTPException:
    if isinstance(exc, service.ContentItemNotFoundError):
        return HTTPException(status_code=404, detail=str(exc))
    if isinstance(exc, service.ContentItemPersistenceError):
        return HTTPException(status_code=500, detail=str(exc))
    return HTTPException(status_code=422, detail=str(exc))


@router.get("", response_model=list[ContentItemRead])
async def list_content_items(
    _: AdminAccess,
    session: DatabaseSession,
    page: Annotated[str | None, Query(max_length=80)] = None,
    section: Annotated[str | None, Query(max_length=80)] = None,
) -> list[ContentItem]:
    return await service.list_items(session, page, section)


@router.post(
    "",
    response_model=ContentItemRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_content_item(
    data: ContentItemCreate,
    _: AdminAccess,
    session: DatabaseSession,
) -> ContentItem:
    try:
        return await service.create_item(session, **data.model_dump())
    except service.ContentItemError as exc:
        raise _http_error(exc) from exc


@router.post("/reorder", response_model=list[ContentItemRead])
async def reorder_content_items(
    data: ContentItemReorder,
    _: AdminAccess,
    session: DatabaseSession,
) -> list[ContentItem]:
    try:
        return await service.reorder_items(
            session, data.page_slug, data.section_key, data.ids
        )
    except service.ContentItemError as exc:
        raise _http_error(exc) from exc


@router.patch("/{item_id}", response_model=ContentItemRead)
async def update_content_item(
    item_id: UUID,
    data: ContentItemUpdate,
    _: AdminAccess,
    session: DatabaseSession,
) -> ContentItem:
    try:
        return await service.update_item(
            session, item_id, data.model_dump(exclude_unset=True)
        )
    except service.ContentItemError as exc:
        raise _http_error(exc) from exc


@router.delete(
    "/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def delete_content_item(
    item_id: UUID,
    _: AdminAccess,
    session: DatabaseSession,
) -> Response:
    try:
        await service.delete_item(session, item_id)
    except service.ContentItemError as exc:
        raise _http_error(exc) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)
