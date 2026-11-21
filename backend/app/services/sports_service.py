from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.content import Sport
from uuid import UUID


async def list_sports(
    session: AsyncSession,
    is_active_only: bool = False,
) -> list[Sport]:
    """List sports records, optionally filtered by active status."""
    query = select(Sport).options(selectinload(Sport.media))

    if is_active_only:
        query = query.where(Sport.is_active == True)

    query = query.order_by(Sport.display_order.asc(), Sport.created_at.desc())

    result = await session.execute(query)
    return result.scalars().all()


async def get_sport(session: AsyncSession, sport_id: UUID) -> Sport | None:
    """Get a single sport record by ID."""
    query = select(Sport).options(selectinload(Sport.media)).where(Sport.id == sport_id)
    result = await session.execute(query)
    return result.scalar_one_or_none()


async def create_sport(
    session: AsyncSession,
    name: str,
    description: str = "",
    display_order: int = 0,
    is_active: bool = True,
    media_id: UUID | None = None,
) -> Sport:
    """Create a new sport record."""
    sport = Sport(
        name=name,
        description=description,
        display_order=display_order,
        is_active=is_active,
        media_id=media_id,
    )
    session.add(sport)
    await session.commit()
    sport_id = sport.id
    sport = await get_sport(session, sport_id)
    return sport or sport


async def update_sport(
    session: AsyncSession,
    sport_id: UUID,
    **updates
) -> Sport | None:
    """Update a sport record."""
    sport = await get_sport(session, sport_id)
    if not sport:
        return None

    for key, value in updates.items():
        if value is not None and hasattr(sport, key):
            setattr(sport, key, value)

    await session.commit()
    sport = await get_sport(session, sport_id)
    return sport


async def delete_sport(session: AsyncSession, sport_id: UUID) -> bool:
    """Delete a sport record."""
    sport = await get_sport(session, sport_id)
    if not sport:
        return False

    await session.delete(sport)
    await session.commit()
    return True


async def reorder_sports(
    session: AsyncSession,
    ids: list[UUID],
) -> list[Sport]:
    """Reorder sports records."""
    for order, sport_id in enumerate(ids):
        sport = await get_sport(session, sport_id)
        if sport:
            sport.display_order = order

    await session.commit()
    return await list_sports(session)
