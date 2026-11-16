from typing import Any

import pytest

from app.config import Settings
from app.services import cloudinary_service
from app.services.cloudinary_service import (
    CloudinaryNotConfiguredError,
    CloudinaryStorage,
    CloudinaryStorageError,
)


def configured_settings() -> Settings:
    return Settings.model_construct(
        database_url="postgresql+asyncpg://user:pass@localhost/db",
        cloudinary_cloud_name="test-cloud",
        cloudinary_api_key="test-key",
        cloudinary_api_secret="test-secret",
    )


@pytest.mark.asyncio
async def test_cloudinary_upload_is_mapped_to_secure_asset(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def fake_upload(*args: Any, **kwargs: Any) -> dict[str, Any]:
        assert kwargs["resource_type"] == "image"
        return {
            "public_id": "school/test-image",
            "secure_url": "https://res.cloudinary.com/test/image/upload/test-image.jpg",
            "format": "jpg",
            "width": 640,
            "height": 480,
        }

    monkeypatch.setattr(cloudinary_service.uploader, "upload", fake_upload)
    asset = await CloudinaryStorage(configured_settings()).upload(b"image-bytes", "test.jpg")

    assert asset.public_id == "school/test-image"
    assert asset.secure_url.startswith("https://")
    assert (asset.format, asset.width, asset.height) == ("jpg", 640, 480)


@pytest.mark.asyncio
async def test_cloudinary_delete_accepts_idempotent_not_found(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        cloudinary_service.uploader,
        "destroy",
        lambda *args, **kwargs: {"result": "not found"},
    )

    await CloudinaryStorage(configured_settings()).delete("school/removed")


@pytest.mark.asyncio
async def test_cloudinary_errors_are_wrapped_without_exposing_provider_details(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def fail_upload(*args: Any, **kwargs: Any) -> None:
        raise RuntimeError("provider response contains sensitive details")

    monkeypatch.setattr(cloudinary_service.uploader, "upload", fail_upload)

    with pytest.raises(CloudinaryStorageError) as error:
        await CloudinaryStorage(configured_settings()).upload(b"image-bytes", "test.jpg")

    assert "sensitive details" not in str(error.value)


@pytest.mark.asyncio
async def test_cloudinary_requires_all_credentials(monkeypatch: pytest.MonkeyPatch) -> None:
    settings = configured_settings()
    settings.cloudinary_api_secret = None

    with pytest.raises(CloudinaryNotConfiguredError):
        await CloudinaryStorage(settings).upload(b"image-bytes", "test.jpg")
