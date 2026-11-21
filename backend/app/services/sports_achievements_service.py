from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.content import SportsAchievementPhoto
from uuid import UUID


async def list_sports_achievements(
    session: AsyncSession,
    is_active_only: bool = False,
) -> list[SportsAchievementPhoto]:
    """List sports achievement photos, optionally filtered by active status."""
    query = select(SportsAchievementPhoto).options(selectinload(SportsAchievementPhoto.media))

    if is_active_only:
        query = query.where(SportsAchievementPhoto.is_active == True)

    query = query.order_by(SportsAchievementPhoto.display_order.asc(), SportsAchievementPhoto.created_at.desc())

    result = await session.execute(query)
    return result.scalars().all()


async def get_sports_achievement(session: AsyncSession, achievement_id: UUID) -> SportsAchievementPhoto | None:
    """Get a single sports achievement record by ID."""
    query = select(SportsAchievementPhoto).options(selectinload(SportsAchievementPhoto.media)).where(SportsAchievementPhoto.id == achievement_id)
    result = await session.execute(query)
    return result.scalar_one_or_none()


async def create_sports_achievement(
    session: AsyncSession,
    description: str = "",
    display_order: int = 0,
    is_active: bool = True,
    media_id: UUID | None = None,
) -> SportsAchievementPhoto:
    """Create a new sports achievement record."""
    achievement = SportsAchievementPhoto(
        description=description,
        display_order=display_order,
        is_active=is_active,
        media_id=media_id,
    )
    session.add(achievement)
    await session.commit()
    achievement_id = achievement.id
    achievement = await get_sports_achievement(session, achievement_id)
    return achievement or achievement


async def update_sports_achievement(
    session: AsyncSession,
    achievement_id: UUID,
    **updates
) -> SportsAchievementPhoto | None:
    """Update a sports achievement record."""
    achievement = await get_sports_achievement(session, achievement_id)
    if not achievement:
        return None

    for key, value in updates.items():
        if value is not None and hasattr(achievement, key):
            setattr(achievement, key, value)

    await session.commit()
    achievement = await get_sports_achievement(session, achievement_id)
    return achievement


async def delete_sports_achievement(session: AsyncSession, achievement_id: UUID) -> bool:
    """Delete a sports achievement record."""
    achievement = await get_sports_achievement(session, achievement_id)
    if not achievement:
        return False

    await session.delete(achievement)
    await session.commit()
    return True


async def reorder_sports_achievements(
    session: AsyncSession,
    ids: list[UUID],
) -> list[SportsAchievementPhoto]:
    """Reorder sports achievements records."""
    for order, achievement_id in enumerate(ids):
        achievement = await get_sports_achievement(session, achievement_id)
        if achievement:
            achievement.display_order = order

    await session.commit()
    return await list_sports_achievements(session)
