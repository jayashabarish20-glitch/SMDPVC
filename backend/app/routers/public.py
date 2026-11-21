from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models.content import ContentItem, LeadershipProfile, AboutSection, Topper, Achievement, Alumni, Sport, SportsAchievementPhoto, AcademicInformation, Club
from app.models.content_record import ContentRecord
from app.models.media import Media, PhotoConfiguration
from app.schemas.content import ContentItemRead, LeadershipProfileRead, AboutSectionRead, TopperRead, AchievementRead, AlumniRead, SportRead, SportsAchievementPhotoRead, AcademicInformationRead, ClubRead
from app.schemas.content_record import ContentRecordRead
from app.schemas.media import PhotoConfigurationRead
from app.services import content_item_service, content_record_service

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


@router.get(
    "/content-records/{record_key}",
    response_model=ContentRecordRead | None,
)
async def get_public_content_record(
    record_key: str,
    session: DatabaseSession,
) -> ContentRecord | None:
    return await content_record_service.get_record(session, record_key, public=True)


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


@router.get("/sports", response_model=list[SportRead])
async def list_public_sports(
    session: DatabaseSession,
) -> list[Sport]:
    """List active sports."""
    query = select(Sport).options(joinedload(Sport.media)).where(Sport.is_active.is_(True))
    query = query.order_by(Sport.display_order, Sport.created_at.desc())
    result = await session.scalars(query)
    sports_list = list(result.unique().all())
    # Clean up deletion pending media
    for sport in sports_list:
        if sport.media is not None and sport.media.deletion_pending:
            sport.media = None
            sport.media_id = None
    session.expunge_all()
    return sports_list


@router.get("/sports-achievements", response_model=list[SportsAchievementPhotoRead])
async def list_public_sports_achievements(
    session: DatabaseSession,
) -> list[SportsAchievementPhoto]:
    """List active sports achievement photos."""
    query = select(SportsAchievementPhoto).options(joinedload(SportsAchievementPhoto.media)).where(SportsAchievementPhoto.is_active.is_(True))
    query = query.order_by(SportsAchievementPhoto.display_order, SportsAchievementPhoto.created_at.desc())
    result = await session.scalars(query)
    achievements_list = list(result.unique().all())
    # Clean up deletion pending media
    for achievement in achievements_list:
        if achievement.media is not None and achievement.media.deletion_pending:
            achievement.media = None
            achievement.media_id = None
    session.expunge_all()
    return achievements_list


@router.get("/academic-information", response_model=list[AcademicInformationRead])
async def list_public_academic_information(
    session: DatabaseSession,
) -> list[AcademicInformation]:
    """List active academic information records."""
    query = select(AcademicInformation).options(joinedload(AcademicInformation.media)).where(AcademicInformation.is_active.is_(True))
    query = query.order_by(AcademicInformation.display_order, AcademicInformation.created_at.desc())
    result = await session.scalars(query)
    info_list = list(result.unique().all())
    # Clean up deletion pending media
    for info in info_list:
        if info.media is not None and info.media.deletion_pending:
            info.media = None
            info.media_id = None
    session.expunge_all()
    return info_list


@router.get("/clubs", response_model=list[ClubRead])
async def list_public_clubs(
    session: DatabaseSession,
) -> list[Club]:
    """List active clubs."""
    query = select(Club).options(joinedload(Club.media)).where(Club.is_active.is_(True))
    query = query.order_by(Club.display_order, Club.created_at.desc())
    result = await session.scalars(query)
    clubs_list = list(result.unique().all())
    # Clean up deletion pending media
    for club in clubs_list:
        if club.media is not None and club.media.deletion_pending:
            club.media = None
            club.media_id = None
    session.expunge_all()
    return clubs_list
