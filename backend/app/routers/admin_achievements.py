from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.content import Achievement
from app.schemas.content import AchievementCreate, AchievementRead, AchievementUpdate
from app.services import achievement_service as service

router = APIRouter(prefix="/achievements", tags=["admin-achievements"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
AdminAccess = Annotated[None, Depends(require_admin)]


@router.get("", response_model=list[AchievementRead])
async def list_achievements(
    _: AdminAccess,
    session: DatabaseSession,
    category: Annotated[str | None, Query(max_length=20)] = None,
) -> list:
    """List all achievements, optionally filtered by category."""
    return await service.list_achievements(session, category=category)


@router.post(
    "",
    response_model=AchievementRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_achievement(
    data: AchievementCreate,
    _: AdminAccess,
    session: DatabaseSession,
) -> Achievement:
    """Create a new achievement."""
    return await service.create_achievement(
        session,
        category=data.category,
        title=data.title,
        description=data.description or "",
        sport=data.sport,
        level=data.level,
        academic_year=data.academic_year,
        display_order=data.display_order or 0,
        is_published=data.is_published or False,
    )


@router.get("/{achievement_id}", response_model=AchievementRead)
async def get_achievement(
    achievement_id: UUID,
    _: AdminAccess,
    session: DatabaseSession,
) -> Achievement:
    """Get a specific achievement."""
    achievement = await service.get_achievement(session, achievement_id)
    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    return achievement


@router.patch("/{achievement_id}", response_model=AchievementRead)
async def update_achievement(
    achievement_id: UUID,
    data: AchievementUpdate,
    _: AdminAccess,
    session: DatabaseSession,
) -> Achievement:
    """Update an achievement."""
    updates = data.model_dump(exclude_unset=True)
    achievement = await service.update_achievement(session, achievement_id, **updates)
    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    return achievement


@router.delete(
    "/{achievement_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def delete_achievement(
    achievement_id: UUID,
    _: AdminAccess,
    session: DatabaseSession,
) -> Response:
    """Delete an achievement."""
    success = await service.delete_achievement(session, achievement_id)
    if not success:
        raise HTTPException(status_code=404, detail="Achievement not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/reorder", response_model=list[AchievementRead])
async def reorder_achievements(
    data: dict,
    _: AdminAccess,
    session: DatabaseSession,
) -> list:
    """Reorder achievements within a category."""
    category = data.get("category")
    ids = data.get("ids", [])
    
    if not category or not ids:
        raise HTTPException(status_code=422, detail="category and ids are required")
    
    return await service.reorder_achievements(session, category, ids)
