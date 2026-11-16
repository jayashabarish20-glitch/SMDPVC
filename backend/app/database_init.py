"""Database initialization and migration management.

This module ensures the database schema is initialized before any
application startup operations (like admin bootstrap) that depend on tables.
"""

import asyncio
import logging
from pathlib import Path

from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import get_settings

logger = logging.getLogger(__name__)


async def table_exists(engine, table_name: str) -> bool:
    """Check if a table exists in the database.

    Args:
        engine: SQLAlchemy async engine.
        table_name: Name of the table to check.

    Returns:
        True if table exists, False otherwise.
    """
    try:
        async with engine.connect() as connection:
            result = await connection.execute(
                text("SELECT name FROM sqlite_master WHERE type='table' AND name = :table_name"),
                {"table_name": table_name},
            )
            return result.scalar() is not None
    except Exception as e:
        logger.error(f"Error checking if table exists: {e}")
        return False


async def run_alembic_migrations() -> None:
    """Run Alembic migrations to initialize database schema.

    Uses Alembic's offline migration mode to apply all pending migrations.
    This ensures all tables are created before the application uses them.

    Raises:
        Exception: If migration fails.
    """
    logger.info("Running Alembic migrations...")

    # Import Alembic components
    from alembic.config import Config
    from alembic.runtime.migration import MigrationContext
    from alembic.operations import Operations
    from alembic import command

    # Get project root and Alembic config path
    backend_dir = Path(__file__).resolve().parent.parent
    alembic_ini_path = backend_dir / "alembic.ini"

    if not alembic_ini_path.exists():
        logger.error(f"Alembic config not found at {alembic_ini_path}")
        raise FileNotFoundError(f"alembic.ini not found at {alembic_ini_path}")

    # Create Alembic config
    alembic_config = Config(str(alembic_ini_path))

    # Update database URL from environment
    settings = get_settings()
    # Escape % characters for ConfigParser (convert % to %%)
    escaped_url = settings.database_url.replace("%", "%%")
    alembic_config.set_main_option("sqlalchemy.url", escaped_url)

    # Ensure database directory exists
    from sqlalchemy.engine import make_url

    db_url = make_url(settings.database_url)
    if db_url.database and db_url.database != ":memory:":
        Path(db_url.database).parent.mkdir(parents=True, exist_ok=True)

    try:
        # Run migrations to head
        await asyncio.get_event_loop().run_in_executor(
            None, lambda: command.upgrade(alembic_config, "head")
        )
        logger.info("Alembic migrations completed successfully")
    except Exception as e:
        logger.error(f"Alembic migration failed: {e}")
        raise


async def initialize_database() -> None:
    """Initialize database by running migrations if needed.

    This function:
    1. Checks if the admin_users table exists
    2. If not, runs Alembic migrations to create all tables
    3. Ensures schema is ready before application startup continues

    This must be called before bootstrap_admin_user() or any other
    database operations during startup.

    Raises:
        Exception: If database initialization fails.
    """
    settings = get_settings()

    logger.info("Checking database initialization...")

    # Create a temporary engine just for checking
    check_engine = create_async_engine(
        settings.database_url,
        echo=False,
    )

    try:
        # Check if admin_users table exists
        admin_users_exists = await table_exists(check_engine, "admin_users")

        if admin_users_exists:
            logger.info("Database schema already initialized (admin_users table exists)")
            return

        # Table doesn't exist, run migrations
        logger.warning("Database schema not initialized, running Alembic migrations...")
        await run_alembic_migrations()

        # Verify migrations ran successfully
        admin_users_exists = await table_exists(check_engine, "admin_users")
        if not admin_users_exists:
            raise RuntimeError(
                "Alembic migrations completed but admin_users table still missing"
            )

        logger.info("Database schema initialized successfully")

    finally:
        await check_engine.dispose()
