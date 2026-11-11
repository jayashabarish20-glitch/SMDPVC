import io
from collections.abc import AsyncIterator

import pytest
import pytest_asyncio
from fastapi import UploadFile
from PIL import Image
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings
from app.models import Base


@pytest.fixture(autouse=True)
def clear_settings_cache() -> AsyncIterator[None]:
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest_asyncio.fixture
async def session() -> AsyncIterator[AsyncSession]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as db_session:
        yield db_session
    await engine.dispose()


def image_upload(
    filename: str = "sample.jpg",
    image_format: str = "JPEG",
    color: str = "red",
) -> UploadFile:
    data = io.BytesIO()
    Image.new("RGB", (4, 3), color=color).save(data, format=image_format)
    data.seek(0)
    return UploadFile(filename=filename, file=data)
