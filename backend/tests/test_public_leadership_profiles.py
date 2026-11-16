import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content import LeadershipProfile
from app.models.media import Media
from app.main import app
from app.routers.admin_leadership import save_leadership_profile
from app.routers.public import list_public_leadership_profiles
from app.schemas.content import LeadershipProfileCreate


def test_public_leadership_route_is_registered() -> None:
    assert "/api/public/leadership-profiles" in app.openapi()["paths"]


@pytest.mark.asyncio
async def test_public_leadership_profiles_return_active_profiles_with_media(
    session: AsyncSession,
) -> None:
    media = Media(
        cloudinary_public_id="school/leader",
        image_url="https://res.cloudinary.com/demo/image/upload/school/leader.jpg",
        original_filename="leader.jpg",
        file_format="jpg",
        file_size=128,
        width=16,
        height=8,
        alt_text="School leader",
    )
    session.add(media)
    await session.flush()
    session.add_all(
        [
            LeadershipProfile(
                profile_key="trustee",
                name="Trustee",
                category="Trustee",
                display_order=1,
                is_active=True,
                media_id=media.id,
            ),
            LeadershipProfile(
                profile_key="inactive",
                name="Inactive",
                category="Management",
                display_order=0,
                is_active=False,
            ),
        ]
    )
    await session.commit()

    result = await list_public_leadership_profiles(session)

    assert [profile.profile_key for profile in result] == ["trustee"]
    assert result[0].media is not None
    assert result[0].media.image_url == media.image_url


@pytest.mark.asyncio
async def test_admin_can_create_and_update_leadership_profile(
    session: AsyncSession,
) -> None:
    profile_data = LeadershipProfileCreate(
        profile_key="management",
        name="School Management",
        designation="Administrator",
        category="Management",
        short_bio="A short introduction.",
        message="A welcome message.",
        display_order=0,
        is_active=True,
    )

    created = await save_leadership_profile(
        "management",
        profile_data,
        None,
        session,
    )
    updated = await save_leadership_profile(
        "management",
        profile_data.model_copy(update={"name": "Updated Management"}),
        None,
        session,
    )

    assert created.id == updated.id
    assert updated.name == "Updated Management"
