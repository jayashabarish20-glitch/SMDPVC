from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.content import Achievement
from app.schemas.content import AchievementCreate, AchievementUpdate
from uuid import UUID


async def list_achievements(
    session: AsyncSession,
    category: str | None = None,
    is_published_only: bool = False,
) -> list[Achievement]:
    """List achievements, optionally filtered by category and publish status."""
    query = select(Achievement)
    
    if category:
        query = query.where(Achievement.category == category)
    
    if is_published_only:
        query = query.where(Achievement.is_published == True)
    
    query = query.order_by(Achievement.display_order.asc(), Achievement.created_at.desc())
    
    result = await session.execute(query)
    return result.scalars().all()


async def get_achievement(session: AsyncSession, achievement_id: UUID) -> Achievement | None:
    """Get a single achievement by ID."""
    query = select(Achievement).where(Achievement.id == achievement_id)
    result = await session.execute(query)
    return result.scalar_one_or_none()


async def create_achievement(
    session: AsyncSession,
    category: str,
    title: str,
    description: str = "",
    sport: str | None = None,
    level: str | None = None,
    academic_year: str | None = None,
    display_order: int = 0,
    is_published: bool = False,
) -> Achievement:
    """Create a new achievement."""
    achievement = Achievement(
        category=category,
        title=title,
        description=description,
        sport=sport,
        level=level,
        academic_year=academic_year,
        display_order=display_order,
        is_published=is_published,
    )
    session.add(achievement)
    await session.flush()
    await session.refresh(achievement)
    return achievement


async def update_achievement(
    session: AsyncSession,
    achievement_id: UUID,
    **updates
) -> Achievement | None:
    """Update an achievement."""
    achievement = await get_achievement(session, achievement_id)
    if not achievement:
        return None
    
    for key, value in updates.items():
        if value is not None and hasattr(achievement, key):
            setattr(achievement, key, value)
    
    await session.flush()
    await session.refresh(achievement)
    return achievement


async def delete_achievement(session: AsyncSession, achievement_id: UUID) -> bool:
    """Delete an achievement."""
    achievement = await get_achievement(session, achievement_id)
    if not achievement:
        return False
    
    await session.delete(achievement)
    await session.flush()
    return True


async def reorder_achievements(
    session: AsyncSession,
    category: str,
    ids: list[UUID],
) -> list[Achievement]:
    """Reorder achievements within a category."""
    for order, achievement_id in enumerate(ids):
        achievement = await get_achievement(session, achievement_id)
        if achievement and achievement.category == category:
            achievement.display_order = order
    
    await session.flush()
    
    # Return reordered list
    return await list_achievements(session, category=category)
