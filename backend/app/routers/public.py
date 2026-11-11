from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models.media import Media, PhotoConfiguration
from app.schemas.media import PhotoConfigurationRead

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
