from pathlib import Path

import pytest
from sqlalchemy import text
from sqlalchemy.engine import make_url

from app.config import Settings
from app.database import engine


def test_default_database_url_uses_persistent_backend_directory(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)
    settings = Settings(_env_file=None)

    assert settings.database_url.startswith("sqlite+aiosqlite:///")
    expected_path = Path(__file__).parents[1] / "data" / "smdpvc.db"
    assert Path(make_url(settings.database_url).database) == expected_path


def test_database_url_rejects_postgresql() -> None:
    with pytest.raises(ValueError, match="sqlite\\+aiosqlite"):
        Settings(database_url="postgresql+asyncpg://localhost/smdpvc", _env_file=None)


@pytest.mark.asyncio
async def test_sqlite_engine_connects_with_foreign_keys_enabled() -> None:
    async with engine.connect() as connection:
        assert (await connection.execute(text("SELECT 1"))).scalar_one() == 1
        assert (
            await connection.execute(text("PRAGMA foreign_keys"))
        ).scalar_one() == 1
