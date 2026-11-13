from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models.content import ContentItem, LeadershipProfile
from app.models.media import Media, PhotoConfiguration
from app.schemas.content import ContentItemRead, LeadershipProfileRead
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
    return await content_item_service.list_items(
        session, page, section, active_only=True
    )
