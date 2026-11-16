from collections.abc import AsyncIterator
from pathlib import Path

from sqlalchemy import event
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings

settings = get_settings()
database_url = make_url(settings.database_url)
database_path = database_url.database
engine_options: dict[str, object] = {
    "pool_pre_ping": True,
}
connect_args: dict[str, object] = {}

if database_path and database_path != ":memory:":
    Path(database_path).parent.mkdir(parents=True, exist_ok=True)
    engine_options.update(pool_size=1, max_overflow=0)
    connect_args["timeout"] = 30

engine_options["connect_args"] = connect_args

engine = create_async_engine(
    settings.database_url,
    **engine_options,
)

if database_url.get_backend_name() == "sqlite":
    @event.listens_for(engine.sync_engine, "connect")
    def enable_sqlite_foreign_keys(dbapi_connection: object, _: object) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionFactory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionFactory() as session:
        yield session
