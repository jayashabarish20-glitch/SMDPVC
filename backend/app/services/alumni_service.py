from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.content import Alumni
from uuid import UUID


async def list_alumni(
    session: AsyncSession,
    is_published_only: bool = False,
) -> list[Alumni]:
    """List alumni records, optionally filtered by publish status."""
    query = select(Alumni)
    
    if is_published_only:
        query = query.where(Alumni.is_published == True)
    
    query = query.order_by(Alumni.display_order.asc(), Alumni.created_at.desc())
    
    result = await session.execute(query)
    return result.scalars().all()


async def get_alumni(session: AsyncSession, alumni_id: UUID) -> Alumni | None:
    """Get a single alumni record by ID."""
    query = select(Alumni).where(Alumni.id == alumni_id)
    result = await session.execute(query)
    return result.scalar_one_or_none()


async def create_alumni(
    session: AsyncSession,
    name: str,
    batch_year: str,
    description: str = "",
    display_order: int = 0,
    is_published: bool = False,
    media_id: UUID | None = None,
) -> Alumni:
    """Create a new alumni record."""
    alumni = Alumni(
        name=name,
        batch_year=batch_year,
        description=description,
        display_order=display_order,
        is_published=is_published,
        media_id=media_id,
    )
    session.add(alumni)
    await session.flush()
    await session.refresh(alumni)
    return alumni


async def update_alumni(
    session: AsyncSession,
    alumni_id: UUID,
    **updates
) -> Alumni | None:
    """Update an alumni record."""
    alumni = await get_alumni(session, alumni_id)
    if not alumni:
        return None
    
    for key, value in updates.items():
        if value is not None and hasattr(alumni, key):
            setattr(alumni, key, value)
    
    await session.flush()
    await session.refresh(alumni)
    return alumni


async def delete_alumni(session: AsyncSession, alumni_id: UUID) -> bool:
    """Delete an alumni record."""
    alumni = await get_alumni(session, alumni_id)
    if not alumni:
        return False
    
    await session.delete(alumni)
    await session.flush()
    return True


async def reorder_alumni(
    session: AsyncSession,
    ids: list[UUID],
) -> list[Alumni]:
    """Reorder alumni records."""
    for order, alumni_id in enumerate(ids):
        alumni = await get_alumni(session, alumni_id)
        if alumni:
            alumni.display_order = order
    
    await session.flush()
    
    # Return reordered list
    return await list_alumni(session)
