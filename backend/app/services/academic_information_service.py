from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.content import AcademicInformation
from uuid import UUID


async def list_academic_information(
    session: AsyncSession,
    is_active_only: bool = False,
) -> list[AcademicInformation]:
    """List academic information records, optionally filtered by active status."""
    query = select(AcademicInformation).options(selectinload(AcademicInformation.media))

    if is_active_only:
        query = query.where(AcademicInformation.is_active == True)

    query = query.order_by(AcademicInformation.display_order.asc(), AcademicInformation.created_at.desc())

    result = await session.execute(query)
    return result.scalars().all()


async def get_academic_information(session: AsyncSession, info_id: UUID) -> AcademicInformation | None:
    """Get a single academic information record by ID."""
    query = select(AcademicInformation).options(selectinload(AcademicInformation.media)).where(AcademicInformation.id == info_id)
    result = await session.execute(query)
    return result.scalar_one_or_none()


async def create_academic_information(
    session: AsyncSession,
    title: str,
    description: str = "",
    display_order: int = 0,
    is_active: bool = True,
    media_id: UUID | None = None,
) -> AcademicInformation:
    """Create a new academic information record."""
    info = AcademicInformation(
        title=title,
        description=description,
        display_order=display_order,
        is_active=is_active,
        media_id=media_id,
    )
    session.add(info)
    await session.commit()
    info_id = info.id
    info = await get_academic_information(session, info_id)
    return info or info


async def update_academic_information(
    session: AsyncSession,
    info_id: UUID,
    **updates
) -> AcademicInformation | None:
    """Update an academic information record."""
    info = await get_academic_information(session, info_id)
    if not info:
        return None

    for key, value in updates.items():
        if value is not None and hasattr(info, key):
            setattr(info, key, value)

    await session.commit()
    info = await get_academic_information(session, info_id)
    return info


async def delete_academic_information(session: AsyncSession, info_id: UUID) -> bool:
    """Delete an academic information record."""
    info = await get_academic_information(session, info_id)
    if not info:
        return False

    await session.delete(info)
    await session.commit()
    return True


async def reorder_academic_information(
    session: AsyncSession,
    ids: list[UUID],
) -> list[AcademicInformation]:
    """Reorder academic information records."""
    for order, info_id in enumerate(ids):
        info = await get_academic_information(session, info_id)
        if info:
            info.display_order = order

    await session.commit()
    return await list_academic_information(session)
