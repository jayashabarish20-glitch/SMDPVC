"""Test admin alumni endpoints."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.database import get_db
from app.main import app
from app.models.admin import AdminUser
from app.models.content import Alumni
from app.models.media import Media
from app.services.auth_service import create_access_token, hash_password
from app.services import alumni_service


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
async def test_media(session: AsyncSession) -> Media:
    """Create a test media file."""
    media = Media(
        cloudinary_public_id="test/alumni-photo",
        image_url="https://res.cloudinary.com/test/image/upload/test-alumni.jpg",
        original_filename="test-alumni.jpg",
        file_format="jpg",
        file_size=1024,
        width=800,
        height=600,
        alt_text="Test Alumni Photo",
        resource_type="image",
    )
    session.add(media)
    await session.commit()
    await session.refresh(media)
    return media


@pytest.mark.asyncio
async def test_create_alumni_with_media_loads_relationship(
    session: AsyncSession,
    admin_user: AdminUser,
    test_media: Media,
) -> None:
    """Test that POST creates alumni and returns media relationship (regression for MissingGreenlet)."""
    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db

    try:
        token = create_access_token(data={"sub": str(admin_user.id)})
        client = TestClient(app)

        response = client.post(
            "/api/admin/alumni",
            json={
                "name": "John Doe",
                "batch_year": "2020",
                "description": "Class topper",
                "display_order": 1,
                "is_published": True,
                "media_id": str(test_media.id),
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "John Doe"
        assert data["batch_year"] == "2020"
        assert data["description"] == "Class topper"
        # Verify media relationship is loaded and present
        assert "media" in data
        assert data["media"] is not None
        assert data["media"]["id"] == str(test_media.id)
        assert data["media"]["original_filename"] == "test-alumni.jpg"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_create_alumni_without_media(
    session: AsyncSession,
    admin_user: AdminUser,
) -> None:
    """Test that POST creates alumni with no media."""
    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db

    try:
        token = create_access_token(data={"sub": str(admin_user.id)})
        client = TestClient(app)

        response = client.post(
            "/api/admin/alumni",
            json={
                "name": "Jane Doe",
                "batch_year": "2021",
                "description": "Sports champion",
                "display_order": 2,
                "is_published": False,
                "media_id": None,
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Jane Doe"
        # Verify media relationship is present but None
        assert "media" in data
        assert data["media"] is None
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_alumni_with_media(
    session: AsyncSession,
    admin_user: AdminUser,
    test_media: Media,
) -> None:
    """Test that GET returns alumni with media relationship loaded."""
    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db

    try:
        # Create an alumni record first
        alumni = await alumni_service.create_alumni(
            session,
            name="Test Alumni",
            batch_year="2019",
            description="Founder",
            display_order=1,
            is_published=True,
            media_id=test_media.id,
        )

        token = create_access_token(data={"sub": str(admin_user.id)})
        client = TestClient(app)

        response = client.get(
            f"/api/admin/alumni/{alumni.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Alumni"
        # Verify media relationship is loaded
        assert "media" in data
        assert data["media"] is not None
        assert data["media"]["id"] == str(test_media.id)
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_list_alumni_with_media(
    session: AsyncSession,
    admin_user: AdminUser,
    test_media: Media,
) -> None:
    """Test that GET /alumni lists all alumni with media relationship loaded."""
    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db

    try:
        # Create alumni records
        await alumni_service.create_alumni(
            session,
            name="Alice",
            batch_year="2018",
            description="Scholar",
            display_order=1,
            is_published=True,
            media_id=test_media.id,
        )
        await alumni_service.create_alumni(
            session,
            name="Bob",
            batch_year="2020",
            description="Athlete",
            display_order=2,
            is_published=True,
            media_id=None,
        )

        token = create_access_token(data={"sub": str(admin_user.id)})
        client = TestClient(app)

        response = client.get(
            "/api/admin/alumni",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2

        # Find Alice and Bob
        alice = next((a for a in data if a["name"] == "Alice"), None)
        bob = next((a for a in data if a["name"] == "Bob"), None)

        assert alice is not None
        assert bob is not None

        # Verify media relationships are present
        assert "media" in alice
        assert alice["media"] is not None
        assert alice["media"]["id"] == str(test_media.id)

        assert "media" in bob
        assert bob["media"] is None
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_update_alumni_with_media(
    session: AsyncSession,
    admin_user: AdminUser,
    test_media: Media,
) -> None:
    """Test that PATCH updates alumni and returns media relationship loaded."""
    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db

    try:
        # Create an alumni record
        alumni = await alumni_service.create_alumni(
            session,
            name="Old Name",
            batch_year="2020",
            is_published=False,
        )

        token = create_access_token(data={"sub": str(admin_user.id)})
        client = TestClient(app)

        # Update the alumni
        response = client.patch(
            f"/api/admin/alumni/{alumni.id}",
            json={
                "name": "New Name",
                "is_published": True,
                "media_id": str(test_media.id),
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name"
        assert data["is_published"] is True
        # Verify media relationship is loaded
        assert "media" in data
        assert data["media"] is not None
        assert data["media"]["id"] == str(test_media.id)
    finally:
        app.dependency_overrides.clear()
