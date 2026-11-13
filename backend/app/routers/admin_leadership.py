import logging
import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.dependencies import require_admin
from app.models.content import LeadershipProfile
from app.schemas.content import (
    LeadershipProfileCreate,
    LeadershipProfileCreateNew,
    LeadershipProfileRead,
    ReorderRequest,
)
from app.services.cloudinary_service import CloudinaryStorageError
from app.services.media_service import MediaError, delete_media

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/leadership-profiles", tags=["admin-leadership"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
AdminAccess = Annotated[None, Depends(require_admin)]


@router.get("", response_model=list[LeadershipProfileRead])
async def list_leadership_profiles(
    _: AdminAccess,
    session: DatabaseSession,
) -> list[LeadershipProfile]:
    result = await session.scalars(
        select(LeadershipProfile)
        .options(joinedload(LeadershipProfile.media))
        .order_by(LeadershipProfile.display_order, LeadershipProfile.profile_key)
    )
    return list(result.unique().all())


@router.put(
    "/{profile_key}",
    response_model=LeadershipProfileRead,
)
async def save_leadership_profile(
    profile_key: str,
    profile_data: LeadershipProfileCreate,
    _: AdminAccess,
    session: DatabaseSession,
) -> LeadershipProfile:
    if profile_key != profile_data.profile_key:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Path profile_key must match the request profile_key",
        )

    profile = await session.scalar(
        select(LeadershipProfile).where(
            LeadershipProfile.profile_key == profile_key
        )
    )
    values = profile_data.model_dump(exclude={"profile_key"})

    if profile is None:
        profile = LeadershipProfile(profile_key=profile_key, **values)
        session.add(profile)
    else:
        for field, value in values.items():
            setattr(profile, field, value)

    await session.commit()
    await session.refresh(profile, attribute_names=["media"])
    return profile


@router.post(
    "",
    response_model=LeadershipProfileRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_leadership_profile(
    profile_data: LeadershipProfileCreateNew,
    _: AdminAccess,
    session: DatabaseSession,
) -> LeadershipProfile:
    try:
        next_order = await session.scalar(
            select(func.coalesce(func.max(LeadershipProfile.display_order), 0) + 1)
        )
        profile = LeadershipProfile(
            profile_key=f"leader-{secrets.token_hex(6)}",
            display_order=next_order or 1,
            **profile_data.model_dump(),
        )
        session.add(profile)
        await session.commit()
        await session.refresh(profile, attribute_names=["media"])
    except SQLAlchemyError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=500, detail="Could not create leadership profile"
        ) from exc
    return profile


@router.post("/reorder", response_model=list[LeadershipProfileRead])
async def reorder_leadership_profiles(
    data: ReorderRequest,
    _: AdminAccess,
    session: DatabaseSession,
) -> list[LeadershipProfile]:
    if len(set(data.ids)) != len(data.ids):
        raise HTTPException(status_code=422, detail="Duplicate ids in request")
    try:
        profiles = (await session.scalars(select(LeadershipProfile))).all()
        by_id = {profile.id: profile for profile in profiles}
        if set(data.ids) != set(by_id):
            raise HTTPException(
                status_code=422,
                detail="Reorder request must list every profile exactly once",
            )
        for position, profile_id in enumerate(data.ids, start=1):
            by_id[profile_id].display_order = position
        await session.commit()
    except SQLAlchemyError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=500, detail="Could not reorder leadership profiles"
        ) from exc
    return await list_leadership_profiles(None, session)


@router.delete(
    "/{profile_key}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def delete_leadership_profile(
    profile_key: str,
    _: AdminAccess,
    session: DatabaseSession,
) -> Response:
    profile = await session.scalar(
        select(LeadershipProfile).where(LeadershipProfile.profile_key == profile_key)
    )
    if profile is None:
        raise HTTPException(status_code=404, detail="Leadership profile not found")
    media_id = profile.media_id
    try:
        await session.delete(profile)
        await session.commit()
    except SQLAlchemyError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=500, detail="Could not delete leadership profile"
        ) from exc
    if media_id is not None:
        try:
            await delete_media(session, media_id)
        except (MediaError, CloudinaryStorageError):
            logger.exception("Could not remove photo of deleted profile")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
