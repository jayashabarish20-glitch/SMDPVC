from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.content import Club
from uuid import UUID


async def list_clubs(
    session: AsyncSession,
    is_active_only: bool = False,
) -> list[Club]:
    """List club records, optionally filtered by active status."""
    query = select(Club).options(selectinload(Club.media))

    if is_active_only:
        query = query.where(Club.is_active == True)

    query = query.order_by(Club.display_order.asc(), Club.created_at.desc())

    result = await session.execute(query)
    return result.scalars().all()


async def get_club(session: AsyncSession, club_id: UUID) -> Club | None:
    """Get a single club record by ID."""
    query = select(Club).options(selectinload(Club.media)).where(Club.id == club_id)
    result = await session.execute(query)
    return result.scalar_one_or_none()


async def create_club(
    session: AsyncSession,
    name: str,
    description: str = "",
    display_order: int = 0,
    is_active: bool = True,
    media_id: UUID | None = None,
) -> Club:
    """Create a new club record."""
    club = Club(
        name=name,
        description=description,
        display_order=display_order,
        is_active=is_active,
        media_id=media_id,
    )
    session.add(club)
    await session.commit()
    club_id = club.id
    club = await get_club(session, club_id)
    return club or club


async def update_club(
    session: AsyncSession,
    club_id: UUID,
    **updates
) -> Club | None:
    """Update a club record."""
    club = await get_club(session, club_id)
    if not club:
        return None

    for key, value in updates.items():
        if value is not None and hasattr(club, key):
            setattr(club, key, value)

    await session.commit()
    club = await get_club(session, club_id)
    return club


async def delete_club(session: AsyncSession, club_id: UUID) -> bool:
    """Delete a club record."""
    club = await get_club(session, club_id)
    if not club:
        return False

    await session.delete(club)
    await session.commit()
    return True


async def reorder_clubs(
    session: AsyncSession,
    ids: list[UUID],
) -> list[Club]:
    """Reorder club records."""
    for order, club_id in enumerate(ids):
        club = await get_club(session, club_id)
        if club:
            club.display_order = order

    await session.commit()
    return await list_clubs(session)
