"""Test admin leadership profile endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.main import app
from app.models.admin import AdminUser
from app.models.content import LeadershipProfile
from app.services.auth_service import create_access_token, hash_password


@pytest.fixture
async def admin_user(session: AsyncSession) -> AdminUser:
    """Create a test admin user."""
    user = AdminUser(
        email="admin@example.com",
        password_hash=hash_password("admin_pass"),
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@pytest.fixture
async def leadership_profile(session: AsyncSession) -> LeadershipProfile:
    """Create a test leadership profile."""
    profile = LeadershipProfile(
        profile_key="test-leader",
        name="Test Leader",
        designation="Principal",
        category="management",
        display_order=1,
    )
    session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile


@pytest.mark.asyncio
async def test_update_leadership_profile_returns_updated_at(
    session: AsyncSession,
    admin_user: AdminUser,
    leadership_profile: LeadershipProfile,
) -> None:
    """Test that PUT returns HTTP 200 with updated_at field (regression for MissingGreenlet)."""
    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db

    try:
        token = create_access_token(data={"sub": str(admin_user.id)})
        client = TestClient(app)

        response = client.put(
            f"/api/admin/leadership-profiles/{leadership_profile.profile_key}",
            json={
                "profile_key": "test-leader",
                "name": "Updated Leader",
                "designation": "Principal",
                "category": "management",
                "short_bio": "Updated bio",
                "message": "Updated message",
                "display_order": 1,
                "is_active": True,
                "media_id": None,
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Leader"
        assert data["short_bio"] == "Updated bio"
        assert data["message"] == "Updated message"
        # Verify timestamps are present and not null
        assert "created_at" in data
        assert "updated_at" in data
        assert data["created_at"] is not None
        assert data["updated_at"] is not None
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_create_leadership_profile_returns_updated_at(
    session: AsyncSession,
    admin_user: AdminUser,
) -> None:
    """Test that POST returns HTTP 201 with updated_at field."""
    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db

    try:
        token = create_access_token(data={"sub": str(admin_user.id)})
        client = TestClient(app)

        response = client.post(
            "/api/admin/leadership-profiles",
            json={
                "name": "New Leader",
                "designation": "Vice Principal",
                "category": "management",
                "short_bio": "New bio",
                "message": "New message",
                "is_active": True,
                "media_id": None,
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Leader"
        assert "profile_key" in data
        # Verify timestamps are present and not null
        assert "created_at" in data
        assert "updated_at" in data
        assert data["created_at"] is not None
        assert data["updated_at"] is not None
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_updated_profile_after_update(
    session: AsyncSession,
    admin_user: AdminUser,
    leadership_profile: LeadershipProfile,
) -> None:
    """Test that an updated profile can be fetched again via GET."""
    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db

    try:
        token = create_access_token(data={"sub": str(admin_user.id)})
        client = TestClient(app)

        # Update the profile
        update_response = client.put(
            f"/api/admin/leadership-profiles/{leadership_profile.profile_key}",
            json={
                "profile_key": "test-leader",
                "name": "Fetched Leader",
                "designation": "Director",
                "category": "management",
                "short_bio": "Fetched bio",
                "message": "Fetched message",
                "display_order": 1,
                "is_active": True,
                "media_id": None,
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert update_response.status_code == 200

        # Fetch all profiles to verify the update persisted
        list_response = client.get(
            "/api/admin/leadership-profiles",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert list_response.status_code == 200
        profiles = list_response.json()
        updated = next(
            (p for p in profiles if p["profile_key"] == "test-leader"), None
        )
        assert updated is not None
        assert updated["name"] == "Fetched Leader"
        assert updated["designation"] == "Director"
    finally:
        app.dependency_overrides.clear()
