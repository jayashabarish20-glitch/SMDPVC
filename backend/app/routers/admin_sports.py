from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.content import Sport
from app.schemas.content import SportCreate, SportRead, SportUpdate
from app.services import sports_service as service

router = APIRouter(prefix="/sports", tags=["admin-sports"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
AdminAccess = Annotated[None, Depends(require_admin)]


@router.get("", response_model=list[SportRead])
async def list_sports(
    _: AdminAccess,
    session: DatabaseSession,
) -> list:
    """List all sports."""
    return await service.list_sports(session)


@router.post("", response_model=SportRead, status_code=status.HTTP_201_CREATED)
async def create_sport(
    data: SportCreate,
    _: AdminAccess,
    session: DatabaseSession,
) -> Sport:
    """Create a new sport."""
    return await service.create_sport(
        session,
        name=data.name,
        description=data.description or "",
        display_order=data.display_order or 0,
        is_active=data.is_active,
        media_id=data.media_id,
    )


@router.get("/{sport_id}", response_model=SportRead)
async def get_sport(
    sport_id: UUID,
    _: AdminAccess,
    session: DatabaseSession,
) -> Sport:
    """Get a specific sport."""
    sport = await service.get_sport(session, sport_id)
    if not sport:
        raise HTTPException(status_code=404, detail="Sport not found")
    return sport


@router.patch("/{sport_id}", response_model=SportRead)
async def update_sport(
    sport_id: UUID,
    data: SportUpdate,
    _: AdminAccess,
    session: DatabaseSession,
) -> Sport:
    """Update a sport."""
    updates = data.model_dump(exclude_unset=True)
    sport = await service.update_sport(session, sport_id, **updates)
    if not sport:
        raise HTTPException(status_code=404, detail="Sport not found")
    return sport


@router.delete("/{sport_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_sport(
    sport_id: UUID,
    _: AdminAccess,
    session: DatabaseSession,
) -> Response:
    """Delete a sport."""
    success = await service.delete_sport(session, sport_id)
    if not success:
        raise HTTPException(status_code=404, detail="Sport not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/reorder", response_model=list[SportRead])
async def reorder_sports(
    data: dict,
    _: AdminAccess,
    session: DatabaseSession,
) -> list:
    """Reorder sports."""
    ids = data.get("ids", [])
    if not ids:
        raise HTTPException(status_code=422, detail="ids are required")
    return await service.reorder_sports(session, ids)
