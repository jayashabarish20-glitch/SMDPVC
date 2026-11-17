from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models.content import ContentItem, LeadershipProfile, AboutSection, Topper, Achievement, Alumni
from app.models.media import Media, PhotoConfiguration
from app.schemas.content import ContentItemRead, LeadershipProfileRead, AboutSectionRead, TopperRead, AchievementRead, AlumniRead
from app.schemas.media import PhotoConfigurationRead
from app.services import content_item_service

router = APIRouter(prefix="/public", tags=["public"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/photos", response_model=list[PhotoConfigurationRead])
async def list_public_photos(session: DatabaseSession) -> list[PhotoConfiguration]:
    result = await session.scalars(
        select(PhotoConfiguration)
        .join(PhotoConfiguration.media)
        .options(joinedload(PhotoConfiguration.media))
        .where(Media.deletion_pending.is_(False))
        .order_by(
            PhotoConfiguration.config_key,
            PhotoConfiguration.display_order,
        )
    )
    return list(result.all())


@router.get(
    "/leadership-profiles",
    response_model=list[LeadershipProfileRead],
)
async def list_public_leadership_profiles(
    session: DatabaseSession,
) -> list[LeadershipProfile]:
    result = await session.scalars(
        select(LeadershipProfile)
        .options(joinedload(LeadershipProfile.media))
        .where(LeadershipProfile.is_active.is_(True))
        .order_by(
            LeadershipProfile.display_order,
            LeadershipProfile.profile_key,
        )
    )
    return list(result.unique().all())


@router.get("/content-items", response_model=list[ContentItemRead])
async def list_public_content_items(
    session: DatabaseSession,
    page: Annotated[str | None, Query(max_length=80)] = None,
    section: Annotated[str | None, Query(max_length=80)] = None,
) -> list[ContentItem]:
    try:
        return await content_item_service.list_items(
            session, page, section, active_only=True
        )
    except Exception:
        return []


@router.get("/about-sections", response_model=list[AboutSectionRead])
async def list_public_about_sections(
    session: DatabaseSession,
) -> list[AboutSection]:
    result = await session.scalars(
        select(AboutSection)
        .options(joinedload(AboutSection.media))
    )
    return list(result.unique().all())


@router.get("/about-sections/{section_key}", response_model=AboutSectionRead | None)
async def get_public_about_section(
    section_key: str,
    session: DatabaseSession,
) -> AboutSection | None:
    result = await session.scalar(
        select(AboutSection)
        .where(AboutSection.section_key == section_key)
        .options(joinedload(AboutSection.media))
    )
    return result


@router.get("/toppers", response_model=list[TopperRead])
async def list_public_toppers(
    session: DatabaseSession,
    grade_level: Annotated[str | None, Query(max_length=32)] = None,
) -> list[Topper]:
    query = select(Topper).options(joinedload(Topper.media)).where(Topper.is_published.is_(True))
    if grade_level:
        query = query.where(Topper.grade_level == grade_level)
    query = query.order_by(
        Topper.grade_level,
        Topper.display_order,
        Topper.created_at,
    )
    result = await session.scalars(query)
    toppers = list(result.unique().all())
    for topper in toppers:
        if topper.media is not None and topper.media.deletion_pending:
            topper.media = None
            topper.media_id = None
    session.expunge_all()
    return toppers


@router.get("/achievements", response_model=list[AchievementRead])
async def list_public_achievements(
    session: DatabaseSession,
    category: Annotated[str | None, Query(max_length=20)] = None,
) -> list[Achievement]:
    """List published achievements, optionally filtered by category (academic, sports)."""
    query = select(Achievement).where(Achievement.is_published.is_(True))
    if category:
        query = query.where(Achievement.category == category)
    query = query.order_by(
        Achievement.display_order,
        Achievement.created_at.desc(),
    )
    result = await session.scalars(query)
    return list(result.all())


@router.get("/alumni", response_model=list[AlumniRead])
async def list_public_alumni(
    session: DatabaseSession,
) -> list[Alumni]:
    """List published alumni profiles."""
    query = select(Alumni).options(joinedload(Alumni.media)).where(Alumni.is_published.is_(True))
    query = query.order_by(
        Alumni.display_order,
        Alumni.created_at.desc(),
    )
    result = await session.scalars(query)
    alumni_list = list(result.unique().all())
    # Clean up deletion pending media
    for alum in alumni_list:
        if alum.media is not None and alum.media.deletion_pending:
            alum.media = None
            alum.media_id = None
    session.expunge_all()
    return alumni_list
