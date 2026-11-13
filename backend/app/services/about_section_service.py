import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content import AboutSection
from app.models.media import Media

logger = logging.getLogger(__name__)


class AboutSectionError(Exception):
    """Base exception for about section service."""
    pass


class AboutSectionNotFoundError(AboutSectionError):
    """About section not found."""
    pass


class AboutSectionPersistenceError(AboutSectionError):
    """Error persisting about section to database."""
    pass


async def get_about_section(
    session: AsyncSession, section_key: str
) -> AboutSection | None:
    """Get an about section by key."""
    result = await session.execute(
        select(AboutSection)
        .where(AboutSection.section_key == section_key)
    )
    return result.scalar_one_or_none()


async def list_about_sections(session: AsyncSession) -> list[AboutSection]:
    """List all about sections."""
    result = await session.execute(select(AboutSection))
    return list(result.scalars().all())


async def create_or_update_about_section(
    session: AsyncSession,
    section_key: str,
    description: str = "",
    media_id: UUID | None = None,
) -> AboutSection:
    """Create or update an about section."""
    try:
        section = await get_about_section(session, section_key)

        if section:
            section.description = description
            section.media_id = media_id
            await session.flush()
            await session.refresh(section, ["media"])
        else:
            section = AboutSection(
                section_key=section_key,
                description=description,
                media_id=media_id,
            )
            session.add(section)
            await session.flush()
            await session.refresh(section, ["media"])

        return section
    except Exception as exc:
        await session.rollback()
        logger.error(f"Failed to create/update about section: {exc}")
        raise AboutSectionPersistenceError(
            f"Failed to create/update about section: {exc}"
        ) from exc


async def delete_about_section(
    session: AsyncSession, section_key: str
) -> bool:
    """Delete an about section."""
    try:
        section = await get_about_section(session, section_key)
        if not section:
            raise AboutSectionNotFoundError(
                f"About section '{section_key}' not found"
            )

        await session.delete(section)
        await session.flush()
        return True
    except Exception as exc:
        await session.rollback()
        logger.error(f"Failed to delete about section: {exc}")
        raise AboutSectionPersistenceError(
            f"Failed to delete about section: {exc}"
        ) from exc
