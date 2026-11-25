import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.main import app
from app.models.admin import AdminUser
from app.models.media import Media
from app.services.auth_service import create_access_token, hash_password


@pytest.fixture
async def admin_user(session: AsyncSession) -> AdminUser:
    """Create a test admin user."""
    user = AdminUser(
        email="admin_about@example.com",
        password_hash=hash_password("admin_pass"),
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@pytest.fixture
async def test_media(session: AsyncSession) -> Media:
    """Create a test media item."""
    media = Media(
        cloudinary_public_id="test/about-photo",
        image_url="https://res.cloudinary.com/test/image/upload/about-photo.jpg",
        original_filename="about-photo.jpg",
        file_format="jpg",
        file_size=1024,
        width=800,
        height=600,
        alt_text="About Photo",
        resource_type="image",
    )
    session.add(media)
    await session.commit()
    await session.refresh(media)
    return media


@pytest.mark.parametrize("section_key", ["nursery", "primary", "higher-secondary"])
@pytest.mark.asyncio
async def test_about_section_crud_lifecycle(
    section_key: str,
    session: AsyncSession,
    admin_user: AdminUser,
    test_media: Media,
) -> None:
    """Test GET, POST create, POST upsert, and PATCH for Nursery, Primary, and Higher Secondary."""
    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db
    try:
        token = create_access_token(data={"sub": str(admin_user.id)})
        client = TestClient(app)
        headers = {"Authorization": f"Bearer {token}"}

        # 1. GET non-existent section should return 200 with null
        get_init = client.get(f"/api/admin/about-sections/{section_key}", headers=headers)
        assert get_init.status_code == 200
        assert get_init.json() is None

        # 2. POST create section with media
        create_resp = client.post(
            "/api/admin/about-sections",
            json={
                "section_key": section_key,
                "description": f"Initial {section_key} description",
                "media_id": str(test_media.id),
            },
            headers=headers,
        )
        assert create_resp.status_code == 201
        created = create_resp.json()
        assert created["section_key"] == section_key
        assert created["description"] == f"Initial {section_key} description"
        assert created["media_id"] == str(test_media.id)
        assert created["media"] is not None
        assert created["media"]["id"] == str(test_media.id)
        assert created["media"]["imageUrl"] == test_media.image_url
        assert created["created_at"] is not None
        assert created["updated_at"] is not None

        # 3. GET section with media loaded
        get_resp = client.get(f"/api/admin/about-sections/{section_key}", headers=headers)
        assert get_resp.status_code == 200
        fetched = get_resp.json()
        assert fetched["section_key"] == section_key
        assert fetched["media_id"] == str(test_media.id)
        assert fetched["media"] is not None
        assert fetched["media"]["imageUrl"] == test_media.image_url
        assert fetched["updated_at"] is not None

        # 4. POST idempotent update / upsert via create endpoint
        upsert_resp = client.post(
            "/api/admin/about-sections",
            json={
                "section_key": section_key,
                "description": f"Upserted {section_key} description",
                "media_id": str(test_media.id),
            },
            headers=headers,
        )
        assert upsert_resp.status_code == 201
        upserted = upsert_resp.json()
        assert upserted["section_key"] == section_key
        assert upserted["description"] == f"Upserted {section_key} description"
        assert upserted["media"] is not None
        assert upserted["media"]["id"] == str(test_media.id)
        assert upserted["media"]["imageUrl"] == test_media.image_url
        assert upserted["updated_at"] is not None

        # 5. PATCH update section
        patch_resp = client.patch(
            f"/api/admin/about-sections/{section_key}",
            json={
                "description": f"Patched {section_key} description",
            },
            headers=headers,
        )
        assert patch_resp.status_code == 200
        patched = patch_resp.json()
        assert patched["section_key"] == section_key
        assert patched["description"] == f"Patched {section_key} description"
        assert patched["media"] is not None
        assert patched["media"]["id"] == str(test_media.id)
        assert patched["media"]["imageUrl"] == test_media.image_url
        assert patched["updated_at"] is not None

        # 6. GET list about sections
        list_resp = client.get("/api/admin/about-sections", headers=headers)
        assert list_resp.status_code == 200
        items = list_resp.json()
        matched = [i for i in items if i["section_key"] == section_key]
        assert len(matched) == 1
        assert matched[0]["media"] is not None
        assert matched[0]["media"]["id"] == str(test_media.id)
        assert matched[0]["media"]["imageUrl"] == test_media.image_url
        assert matched[0]["updated_at"] is not None
    finally:
        app.dependency_overrides.clear()
