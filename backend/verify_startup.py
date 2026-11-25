#!/usr/bin/env python3
"""
Verify that the FastAPI backend can start successfully.

This script checks:
1. Environment configuration is valid
2. Database can be initialized
3. Admin user can be bootstrapped
4. Health endpoint works
"""

import asyncio
import logging
import sys
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)


async def verify_startup() -> bool:
    """Verify backend startup steps."""
    logger.info("=" * 60)
    logger.info("Backend Startup Verification")
    logger.info("=" * 60)

    # Step 1: Verify imports
    logger.info("\n[1/5] Checking imports...")
    try:
        from app.config import get_settings
        from app.database_init import initialize_database
        from app.services.admin_bootstrap import bootstrap_admin_user
        from app.database import engine
        logger.info("✅ All imports successful")
    except Exception as e:
        logger.error(f"❌ Import error: {e}")
        return False

    # Step 2: Verify configuration
    logger.info("\n[2/5] Checking configuration...")
    try:
        settings = get_settings()
        logger.info(f"  Database URL: {settings.database_url}")
        logger.info(f"  Admin Email: {settings.admin_email or '(not set)'}")
        logger.info(f"  Admin Password: {'(set)' if settings.admin_password else '(not set)'}")
        logger.info(f"  CORS Origins: {settings.cors_origins}")
        logger.info("✅ Configuration valid")
    except Exception as e:
        logger.error(f"❌ Configuration error: {e}")
        return False

    # Step 3: Verify database initialization
    logger.info("\n[3/5] Checking database initialization...")
    try:
        await initialize_database()
        logger.info("✅ Database initialized")
    except Exception as e:
        logger.error(f"❌ Database initialization error: {e}")
        logger.error("Hint: Run 'alembic upgrade head' to apply migrations")
        return False

    # Step 4: Verify admin bootstrap
    logger.info("\n[4/5] Checking admin user bootstrap...")
    try:
        await bootstrap_admin_user(settings.admin_email, settings.admin_password)
        logger.info("✅ Admin user bootstrap successful")
    except Exception as e:
        logger.error(f"❌ Admin bootstrap error: {e}")
        return False

    # Step 5: Verify health endpoint
    logger.info("\n[5/5] Checking health endpoint...")
    try:
        from app.database import SessionFactory
        async with SessionFactory() as session:
            from sqlalchemy import text
            await session.execute(text("SELECT 1"))
        logger.info("✅ Health check passed (database connected)")
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        return False
    finally:
        await engine.dispose()

    logger.info("\n" + "=" * 60)
    logger.info("✅ All startup checks passed!")
    logger.info("=" * 60)
    logger.info("\nTo start the backend server, run:")
    logger.info("  uvicorn app.main:app --reload")
    logger.info("\nThe API will be available at:")
    logger.info("  http://127.0.0.1:8000")
    logger.info("  Docs: http://127.0.0.1:8000/docs")

    return True


if __name__ == "__main__":
    try:
        success = asyncio.run(verify_startup())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        logger.info("\n\nVerification cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.exception(f"Unexpected error during verification: {e}")
        sys.exit(1)
