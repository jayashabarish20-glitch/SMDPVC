from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.content import Topper
from app.schemas.content import (
    TopperCreate,
    TopperRead,
    TopperReorder,
    TopperUpdate,
)
from app.services import topper_service as service

router = APIRouter(prefix="/toppers", tags=["admin-toppers"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
AdminAccess = Annotated[None, Depends(require_admin)]


def _http_error(exc: service.TopperError) -> HTTPException:
    if isinstance(exc, service.TopperNotFoundError):
        return HTTPException(status_code=404, detail=str(exc))
    if isinstance(exc, service.TopperPersistenceError):
        return HTTPException(status_code=500, detail=str(exc))
    return HTTPException(status_code=422, detail=str(exc))


@router.get("", response_model=list[TopperRead])
async def list_toppers(
    _: AdminAccess,
    session: DatabaseSession,
    grade_level: Annotated[str | None, Query(max_length=32)] = None,
) -> list:
    return await service.list_toppers(session, grade_level=grade_level)


@router.post(
    "",
    response_model=TopperRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_topper(
    data: TopperCreate,
    _: AdminAccess,
    session: DatabaseSession,
) -> Topper:
    try:
        return await service.create_topper(
            session,
            student_name=data.student_name,
            grade_level=data.grade_level,
            score=data.score,
            academic_year=data.academic_year,
            stream=data.stream,
            centums_scored=data.centums_scored,
            centum_subjects=data.centum_subjects,
            display_order=data.display_order,
            is_published=data.is_published,
            media_id=data.media_id,
        )
    except service.TopperError as exc:
        raise _http_error(exc) from exc


@router.post("/reorder", response_model=list[TopperRead])
async def reorder_toppers(
    data: TopperReorder,
    _: AdminAccess,
    session: DatabaseSession,
) -> list:
    try:
        return await service.reorder_toppers(
            session, data.grade_level, data.ids
        )
    except service.TopperError as exc:
        raise _http_error(exc) from exc


@router.patch("/{topper_id}", response_model=TopperRead)
async def update_topper(
    topper_id: UUID,
    data: TopperUpdate,
    _: AdminAccess,
    session: DatabaseSession,
) -> Topper:
    try:
        return await service.update_topper(
            session, topper_id, data.model_dump(exclude_unset=True)
        )
    except service.TopperError as exc:
        raise _http_error(exc) from exc


@router.delete(
    "/{topper_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def delete_topper(
    topper_id: UUID,
    _: AdminAccess,
    session: DatabaseSession,
) -> Response:
    try:
        await service.delete_topper(session, topper_id)
    except service.TopperError as exc:
        raise _http_error(exc) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)
