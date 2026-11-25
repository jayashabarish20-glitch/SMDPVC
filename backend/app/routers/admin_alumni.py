from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.content import Alumni
from app.schemas.content import AlumniCreate, AlumniRead, AlumniUpdate
from app.services import alumni_service as service

router = APIRouter(prefix="/alumni", tags=["admin-alumni"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
AdminAccess = Annotated[None, Depends(require_admin)]


@router.get("", response_model=list[AlumniRead])
async def list_alumni(
    _: AdminAccess,
    session: DatabaseSession,
) -> list:
    """List all alumni records."""
    return await service.list_alumni(session)


@router.post(
    "",
    response_model=AlumniRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_alumni(
    data: AlumniCreate,
    _: AdminAccess,
    session: DatabaseSession,
) -> Alumni:
    """Create a new alumni record."""
    return await service.create_alumni(
        session,
        name=data.name,
        batch_year=data.batch_year,
        description=data.description or "",
        display_order=data.display_order or 0,
        is_published=data.is_published or False,
        media_id=data.media_id,
    )


@router.get("/{alumni_id}", response_model=AlumniRead)
async def get_alumni(
    alumni_id: UUID,
    _: AdminAccess,
    session: DatabaseSession,
) -> Alumni:
    """Get a specific alumni record."""
    alumni = await service.get_alumni(session, alumni_id)
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumni not found")
    return alumni


@router.patch("/{alumni_id}", response_model=AlumniRead)
async def update_alumni(
    alumni_id: UUID,
    data: AlumniUpdate,
    _: AdminAccess,
    session: DatabaseSession,
) -> Alumni:
    """Update an alumni record."""
    updates = data.model_dump(exclude_unset=True)
    alumni = await service.update_alumni(session, alumni_id, **updates)
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumni not found")
    return alumni


@router.delete(
    "/{alumni_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def delete_alumni(
    alumni_id: UUID,
    _: AdminAccess,
    session: DatabaseSession,
) -> Response:
    """Delete an alumni record."""
    success = await service.delete_alumni(session, alumni_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alumni not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/reorder", response_model=list[AlumniRead])
async def reorder_alumni(
    data: dict,
    _: AdminAccess,
    session: DatabaseSession,
) -> list:
    """Reorder alumni records."""
    ids = data.get("ids", [])
    
    if not ids:
        raise HTTPException(status_code=422, detail="ids are required")
    
    return await service.reorder_alumni(session, ids)
