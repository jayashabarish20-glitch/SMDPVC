import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.testclient import TestClient

from app.main import app
from app.models.admin import AdminUser
from app.services.auth_service import hash_password, create_access_token
from app.database import get_db


@pytest.fixture
async def admin_user(session: AsyncSession) -> AdminUser:
    """Create a test admin user."""
    user = AdminUser(
        email="test@example.com",
        password_hash=hash_password("test_password"),
        is_active=True,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@pytest.mark.asyncio
async def test_login_returns_token(
    session: AsyncSession,
    admin_user: AdminUser,
) -> None:
    """Test that login returns a JWT token."""
    # Setup: Override the database dependency
    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db

    try:
        client = TestClient(app)
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "test_password",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_current_user_with_valid_token(
    session: AsyncSession,
    admin_user: AdminUser,
) -> None:
    """Test that GET /auth/me returns user info with valid token."""
    # Setup: Override the database dependency
    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db

    try:
        # Create a token for the admin user
        token = create_access_token(data={"sub": str(admin_user.id)})

        client = TestClient(app)
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(admin_user.id)
        assert data["email"] == "test@example.com"
        assert data["is_active"] is True
        assert "created_at" in data
        assert "updated_at" in data
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_current_user_without_token(
    session: AsyncSession,
) -> None:
    """Test that GET /auth/me returns 401 without token."""
    # Setup: Override the database dependency
    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db

    try:
        client = TestClient(app)
        response = client.get("/api/auth/me")

        assert response.status_code == 401
        data = response.json()
        assert data["detail"] == "Missing authorization header"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_current_user_with_invalid_token(
    session: AsyncSession,
) -> None:
    """Test that GET /auth/me returns 401 with invalid token."""
    # Setup: Override the database dependency
    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db

    try:
        client = TestClient(app)
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid_token"},
        )

        assert response.status_code == 401
        data = response.json()
        assert data["detail"] == "Invalid or expired token"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_current_user_with_inactive_user(
    session: AsyncSession,
) -> None:
    """Test that GET /auth/me returns 401 for inactive user."""
    # Create an inactive user
    user = AdminUser(
        email="inactive@example.com",
        password_hash=hash_password("test_password"),
        is_active=False,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    # Setup: Override the database dependency
    async def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db

    try:
        # Create a token for the inactive user
        token = create_access_token(data={"sub": str(user.id)})

        client = TestClient(app)
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 401
        data = response.json()
        assert data["detail"] == "Admin user not found or inactive"
    finally:
        app.dependency_overrides.clear()
