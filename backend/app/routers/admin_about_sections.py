from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.content import AboutSection
from app.schemas.content import (
    AboutSectionCreate,
    AboutSectionRead,
    AboutSectionUpdate,
)
from app.services import about_section_service

router = APIRouter(prefix="/about-sections", tags=["admin-about-sections"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
AdminAccess = Annotated[None, Depends(require_admin)]


def _http_error(exc: about_section_service.AboutSectionError) -> HTTPException:
    if isinstance(exc, about_section_service.AboutSectionNotFoundError):
        return HTTPException(status_code=404, detail=str(exc))
    if isinstance(exc, about_section_service.AboutSectionPersistenceError):
        return HTTPException(status_code=500, detail=str(exc))
    return HTTPException(status_code=422, detail=str(exc))


@router.get("", response_model=list[AboutSectionRead])
async def list_about_sections(
    _: AdminAccess,
    session: DatabaseSession,
) -> list[AboutSection]:
    return await about_section_service.list_about_sections(session)


@router.get("/{section_key}", response_model=AboutSectionRead | None)
async def get_about_section(
    section_key: str,
    _: AdminAccess,
    session: DatabaseSession,
) -> AboutSection | None:
    return await about_section_service.get_about_section(session, section_key)


@router.post(
    "",
    response_model=AboutSectionRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_about_section(
    data: AboutSectionCreate,
    _: AdminAccess,
    session: DatabaseSession,
) -> AboutSection:
    try:
        return await about_section_service.create_or_update_about_section(
            session,
            section_key=data.section_key,
            description=data.description,
            media_id=data.media_id,
        )
    except about_section_service.AboutSectionError as exc:
        raise _http_error(exc) from exc


@router.patch("/{section_key}", response_model=AboutSectionRead)
async def update_about_section(
    section_key: str,
    data: AboutSectionUpdate,
    _: AdminAccess,
    session: DatabaseSession,
) -> AboutSection:
    try:
        section = await about_section_service.get_about_section(session, section_key)
        if not section:
            raise about_section_service.AboutSectionNotFoundError(
                f"About section '{section_key}' not found"
            )

        return await about_section_service.create_or_update_about_section(
            session,
            section_key=section_key,
            description=data.description if data.description is not None else section.description,
            media_id=data.media_id if data.media_id is not None else section.media_id,
        )
    except about_section_service.AboutSectionError as exc:
        raise _http_error(exc) from exc


@router.delete("/{section_key}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_about_section(
    section_key: str,
    _: AdminAccess,
    session: DatabaseSession,
) -> None:
    try:
        await about_section_service.delete_about_section(session, section_key)
    except about_section_service.AboutSectionError as exc:
        raise _http_error(exc) from exc
