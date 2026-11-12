"""Admin account bootstrap service.

This module handles automatic creation of the initial admin account during
application startup if configured via environment variables.
"""

import logging
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.models.admin import AdminUser
from app.services.auth_service import hash_password
from app.database import SessionFactory

logger = logging.getLogger(__name__)


async def bootstrap_admin_user(
    admin_email: str | None,
    admin_password: str | None,
) -> None:
    """Create initial admin account if configured and doesn't exist.

    This function is safe to call on every application startup:
    - If credentials are not configured, does nothing
    - If admin account already exists, skips creation
    - If admin account is missing, creates it with configured credentials

    Important: Never overwrites existing admin passwords automatically.
    An existing admin's password remains unchanged even if different
    credentials are configured in the environment.

    Args:
        admin_email: Admin email from environment config (ADMIN_EMAIL).
        admin_password: Admin password from environment config (ADMIN_PASSWORD).

    Returns:
        None

    Raises:
        Exception: Re-raises unexpected database errors after logging.
    """
    # Skip if credentials not configured
    if not admin_email or not admin_password:
        logger.debug("Admin bootstrap: credentials not configured, skipping")
        return

    async with SessionFactory() as session:
        try:
            # Check if admin account already exists
            stmt = select(AdminUser).where(AdminUser.email == admin_email)
            result = await session.execute(stmt)
            existing_admin = result.scalar_one_or_none()

            if existing_admin:
                logger.info(f"Admin bootstrap: account with email '{admin_email}' already exists")
                return

            # Create new admin account
            password_hash = hash_password(admin_password)
            new_admin = AdminUser(
                email=admin_email,
                password_hash=password_hash,
                is_active=True,
            )

            session.add(new_admin)
            await session.commit()

            logger.info(f"Admin bootstrap: created new admin account with email '{admin_email}'")

        except IntegrityError:
            await session.rollback()
            logger.warning(
                f"Admin bootstrap: integrity error while creating admin with email '{admin_email}' "
                "(account may have been created by another process)"
            )
        except Exception as e:
            await session.rollback()
            logger.error(f"Admin bootstrap: unexpected error while creating admin account: {e}")
            raise
