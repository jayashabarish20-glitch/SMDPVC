"""Tests for admin account bootstrap functionality."""

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.models import Base
from app.models.admin import AdminUser
from app.services.admin_bootstrap import bootstrap_admin_user
from app.services.auth_service import verify_password


@pytest.fixture
async def test_session() -> AsyncSession:
    """Create in-memory SQLite database for testing."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    factory = async_sessionmaker(engine, expire_on_commit=False)
    session = factory()
    yield session
    await session.close()
    await engine.dispose()


@pytest.mark.asyncio
async def test_bootstrap_creates_admin_user(test_session: AsyncSession, monkeypatch) -> None:
    """Test that bootstrap creates admin user when credentials are configured."""
    # Mock SessionFactory to use test session
    async def mock_session_factory():
        return test_session

    import app.services.admin_bootstrap
    original_factory = app.services.admin_bootstrap.SessionFactory
    app.services.admin_bootstrap.SessionFactory = mock_session_factory

    try:
        admin_email = "admin@test.school"
        admin_password = "TestPassword@123"

        # Bootstrap should create the admin
        await bootstrap_admin_user(admin_email, admin_password)

        # Verify admin was created
        stmt = select(AdminUser).where(AdminUser.email == admin_email)
        result = await test_session.execute(stmt)
        admin = result.scalar_one_or_none()

        assert admin is not None, "Admin user should be created"
        assert admin.email == admin_email, "Email should match"
        assert admin.is_active is True, "Admin should be active"
        assert admin.password_hash is not None, "Password hash should exist"

        # Verify password is hashed (not plaintext)
        assert admin.password_hash != admin_password, "Password should be hashed, not plaintext"

        # Verify password verification works
        assert verify_password(admin_password, admin.password_hash), "Password verification should work"

    finally:
        app.services.admin_bootstrap.SessionFactory = original_factory


@pytest.mark.asyncio
async def test_bootstrap_skips_if_admin_exists(test_session: AsyncSession, monkeypatch) -> None:
    """Test that bootstrap skips if admin already exists."""
    async def mock_session_factory():
        return test_session

    import app.services.admin_bootstrap
    original_factory = app.services.admin_bootstrap.SessionFactory
    app.services.admin_bootstrap.SessionFactory = mock_session_factory

    try:
        admin_email = "admin@test.school"
        admin_password = "TestPassword@123"

        # First bootstrap creates admin
        await bootstrap_admin_user(admin_email, admin_password)

        # Get the created admin to verify first state
        stmt = select(AdminUser).where(AdminUser.email == admin_email)
        result = await test_session.execute(stmt)
        admin_first = result.scalar_one()
        original_hash = admin_first.password_hash

        # Second bootstrap with different password
        different_password = "DifferentPassword@456"
        await bootstrap_admin_user(admin_email, different_password)

        # Verify admin still exists and password hash unchanged
        await test_session.refresh(admin_first)
        assert admin_first.password_hash == original_hash, "Password should not be updated"

        # Verify there's still only one admin
        stmt = select(AdminUser).where(AdminUser.email == admin_email)
        result = await test_session.execute(stmt)
        admins = result.scalars().all()
        assert len(admins) == 1, "Should only have one admin with this email"

    finally:
        app.services.admin_bootstrap.SessionFactory = original_factory


@pytest.mark.asyncio
async def test_bootstrap_skips_if_credentials_not_configured(test_session: AsyncSession, monkeypatch) -> None:
    """Test that bootstrap skips if credentials are not configured."""
    async def mock_session_factory():
        return test_session

    import app.services.admin_bootstrap
    original_factory = app.services.admin_bootstrap.SessionFactory
    app.services.admin_bootstrap.SessionFactory = mock_session_factory

    try:
        # Bootstrap with None credentials should do nothing
        await bootstrap_admin_user(None, None)

        # Verify no admin was created
        stmt = select(AdminUser)
        result = await test_session.execute(stmt)
        admins = result.scalars().all()
        assert len(admins) == 0, "No admin should be created when credentials are None"

        # Bootstrap with only email, no password
        await bootstrap_admin_user("admin@test.school", None)
        result = await test_session.execute(stmt)
        admins = result.scalars().all()
        assert len(admins) == 0, "No admin should be created without password"

        # Bootstrap with only password, no email
        await bootstrap_admin_user(None, "password@123")
        result = await test_session.execute(stmt)
        admins = result.scalars().all()
        assert len(admins) == 0, "No admin should be created without email"

    finally:
        app.services.admin_bootstrap.SessionFactory = original_factory


@pytest.mark.asyncio
async def test_admin_uses_argon2_hashing(test_session: AsyncSession, monkeypatch) -> None:
    """Test that admin password uses Argon2 hashing."""
    async def mock_session_factory():
        return test_session

    import app.services.admin_bootstrap
    original_factory = app.services.admin_bootstrap.SessionFactory
    app.services.admin_bootstrap.SessionFactory = mock_session_factory

    try:
        admin_email = "admin@test.school"
        admin_password = "TestPassword@123"

        await bootstrap_admin_user(admin_email, admin_password)

        stmt = select(AdminUser).where(AdminUser.email == admin_email)
        result = await test_session.execute(stmt)
        admin = result.scalar_one()

        # Argon2 hashes start with $argon2
        assert admin.password_hash.startswith("$argon2"), "Password should be hashed with Argon2"

    finally:
        app.services.admin_bootstrap.SessionFactory = original_factory
