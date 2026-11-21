from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.content import SportsAchievementPhoto
from app.schemas.content import SportsAchievementPhotoCreate, SportsAchievementPhotoRead, SportsAchievementPhotoUpdate
from app.services import sports_achievements_service as service

router = APIRouter(prefix="/sports-achievements", tags=["admin-sports-achievements"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
AdminAccess = Annotated[None, Depends(require_admin)]


@router.get("", response_model=list[SportsAchievementPhotoRead])
async def list_sports_achievements(
    _: AdminAccess,
    session: DatabaseSession,
) -> list:
    """List all sports achievement photos."""
    return await service.list_sports_achievements(session)


@router.post("", response_model=SportsAchievementPhotoRead, status_code=status.HTTP_201_CREATED)
async def create_sports_achievement(
    data: SportsAchievementPhotoCreate,
    _: AdminAccess,
    session: DatabaseSession,
) -> SportsAchievementPhoto:
    """Create a new sports achievement photo."""
    return await service.create_sports_achievement(
        session,
        description=data.description or "",
        display_order=data.display_order or 0,
        is_active=data.is_active,
        media_id=data.media_id,
    )


@router.get("/{achievement_id}", response_model=SportsAchievementPhotoRead)
async def get_sports_achievement(
    achievement_id: UUID,
    _: AdminAccess,
    session: DatabaseSession,
) -> SportsAchievementPhoto:
    """Get a specific sports achievement."""
    achievement = await service.get_sports_achievement(session, achievement_id)
    if not achievement:
        raise HTTPException(status_code=404, detail="Sports achievement not found")
    return achievement


@router.patch("/{achievement_id}", response_model=SportsAchievementPhotoRead)
async def update_sports_achievement(
    achievement_id: UUID,
    data: SportsAchievementPhotoUpdate,
    _: AdminAccess,
    session: DatabaseSession,
) -> SportsAchievementPhoto:
    """Update a sports achievement."""
    updates = data.model_dump(exclude_unset=True)
    achievement = await service.update_sports_achievement(session, achievement_id, **updates)
    if not achievement:
        raise HTTPException(status_code=404, detail="Sports achievement not found")
    return achievement


@router.delete("/{achievement_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_sports_achievement(
    achievement_id: UUID,
    _: AdminAccess,
    session: DatabaseSession,
) -> Response:
    """Delete a sports achievement."""
    success = await service.delete_sports_achievement(session, achievement_id)
    if not success:
        raise HTTPException(status_code=404, detail="Sports achievement not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/reorder", response_model=list[SportsAchievementPhotoRead])
async def reorder_sports_achievements(
    data: dict,
    _: AdminAccess,
    session: DatabaseSession,
) -> list:
    """Reorder sports achievements."""
    ids = data.get("ids", [])
    if not ids:
        raise HTTPException(status_code=422, detail="ids are required")
    return await service.reorder_sports_achievements(session, ids)
