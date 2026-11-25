from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.content import Club
from app.schemas.content import ClubCreate, ClubRead, ClubUpdate
from app.services import clubs_service as service

router = APIRouter(prefix="/clubs", tags=["admin-clubs"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
AdminAccess = Annotated[None, Depends(require_admin)]


@router.get("", response_model=list[ClubRead])
async def list_clubs(
    _: AdminAccess,
    session: DatabaseSession,
) -> list:
    """List all clubs."""
    return await service.list_clubs(session)


@router.post("", response_model=ClubRead, status_code=status.HTTP_201_CREATED)
async def create_club(
    data: ClubCreate,
    _: AdminAccess,
    session: DatabaseSession,
) -> Club:
    """Create a new club."""
    return await service.create_club(
        session,
        name=data.name,
        description=data.description or "",
        display_order=data.display_order or 0,
        is_active=data.is_active,
        media_id=data.media_id,
    )


@router.get("/{club_id}", response_model=ClubRead)
async def get_club(
    club_id: UUID,
    _: AdminAccess,
    session: DatabaseSession,
) -> Club:
    """Get a specific club."""
    club = await service.get_club(session, club_id)
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    return club


@router.patch("/{club_id}", response_model=ClubRead)
async def update_club(
    club_id: UUID,
    data: ClubUpdate,
    _: AdminAccess,
    session: DatabaseSession,
) -> Club:
    """Update a club."""
    updates = data.model_dump(exclude_unset=True)
    club = await service.update_club(session, club_id, **updates)
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    return club


@router.delete("/{club_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_club(
    club_id: UUID,
    _: AdminAccess,
    session: DatabaseSession,
) -> Response:
    """Delete a club."""
    success = await service.delete_club(session, club_id)
    if not success:
        raise HTTPException(status_code=404, detail="Club not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/reorder", response_model=list[ClubRead])
async def reorder_clubs(
    data: dict,
    _: AdminAccess,
    session: DatabaseSession,
) -> list:
    """Reorder clubs."""
    ids = data.get("ids", [])
    if not ids:
        raise HTTPException(status_code=422, detail="ids are required")
    return await service.reorder_clubs(session, ids)
