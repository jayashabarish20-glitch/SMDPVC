from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.content import AcademicInformation
from app.schemas.content import AcademicInformationCreate, AcademicInformationRead, AcademicInformationUpdate
from app.services import academic_information_service as service

router = APIRouter(prefix="/academic-information", tags=["admin-academic-information"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
AdminAccess = Annotated[None, Depends(require_admin)]


@router.get("", response_model=list[AcademicInformationRead])
async def list_academic_information(
    _: AdminAccess,
    session: DatabaseSession,
) -> list:
    """List all academic information records."""
    return await service.list_academic_information(session)


@router.post("", response_model=AcademicInformationRead, status_code=status.HTTP_201_CREATED)
async def create_academic_information(
    data: AcademicInformationCreate,
    _: AdminAccess,
    session: DatabaseSession,
) -> AcademicInformation:
    """Create a new academic information record."""
    return await service.create_academic_information(
        session,
        title=data.title,
        description=data.description or "",
        display_order=data.display_order or 0,
        is_active=data.is_active,
        media_id=data.media_id,
    )


@router.get("/{info_id}", response_model=AcademicInformationRead)
async def get_academic_information(
    info_id: UUID,
    _: AdminAccess,
    session: DatabaseSession,
) -> AcademicInformation:
    """Get a specific academic information record."""
    info = await service.get_academic_information(session, info_id)
    if not info:
        raise HTTPException(status_code=404, detail="Academic information not found")
    return info


@router.patch("/{info_id}", response_model=AcademicInformationRead)
async def update_academic_information(
    info_id: UUID,
    data: AcademicInformationUpdate,
    _: AdminAccess,
    session: DatabaseSession,
) -> AcademicInformation:
    """Update an academic information record."""
    updates = data.model_dump(exclude_unset=True)
    info = await service.update_academic_information(session, info_id, **updates)
    if not info:
        raise HTTPException(status_code=404, detail="Academic information not found")
    return info


@router.delete("/{info_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_academic_information(
    info_id: UUID,
    _: AdminAccess,
    session: DatabaseSession,
) -> Response:
    """Delete an academic information record."""
    success = await service.delete_academic_information(session, info_id)
    if not success:
        raise HTTPException(status_code=404, detail="Academic information not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/reorder", response_model=list[AcademicInformationRead])
async def reorder_academic_information(
    data: dict,
    _: AdminAccess,
    session: DatabaseSession,
) -> list:
    """Reorder academic information records."""
    ids = data.get("ids", [])
    if not ids:
        raise HTTPException(status_code=422, detail="ids are required")
    return await service.reorder_academic_information(session, ids)
