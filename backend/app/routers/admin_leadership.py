from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.dependencies import require_admin
from app.models.content import LeadershipProfile
from app.schemas.content import LeadershipProfileCreate, LeadershipProfileRead

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
