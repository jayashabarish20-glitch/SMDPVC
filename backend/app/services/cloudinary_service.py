import logging
from dataclasses import dataclass
from io import BytesIO
from typing import Any, Protocol

import cloudinary
from cloudinary import uploader
from starlette.concurrency import run_in_threadpool

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)


class CloudinaryStorageError(Exception):
    """Cloudinary upload or deletion failed."""


class CloudinaryNotConfiguredError(CloudinaryStorageError):
    """Cloudinary credentials have not been configured."""


@dataclass(frozen=True)
class CloudinaryAsset:
    public_id: str
    secure_url: str
    format: str
    width: int | None
    height: int | None


class ImageStorage(Protocol):
    async def upload(self, data: bytes, filename: str) -> CloudinaryAsset: ...

    async def delete(self, public_id: str) -> None: ...


class CloudinaryStorage:
    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()

    def _configure(self) -> None:
        if not all(
            (
                self._settings.cloudinary_cloud_name,
                self._settings.cloudinary_api_key,
                self._settings.cloudinary_api_secret,
            )
        ):
            raise CloudinaryNotConfiguredError(
                "Cloudinary credentials are not configured"
            )

        cloudinary.config(
            cloud_name=self._settings.cloudinary_cloud_name,
            api_key=self._settings.cloudinary_api_key,
            api_secret=self._settings.cloudinary_api_secret,
            secure=True,
        )

    async def upload(self, data: bytes, filename: str) -> CloudinaryAsset:
        self._configure()
        try:
            response = await run_in_threadpool(
                uploader.upload,
                BytesIO(data),
                resource_type="image",
                filename_override=filename,
                use_filename=False,
                unique_filename=True,
                overwrite=False,
            )
            return _asset_from_response(response)
        except CloudinaryStorageError:
            raise
        except Exception as exc:
            logger.exception("Cloudinary image upload failed")
            raise CloudinaryStorageError("Cloudinary image upload failed") from exc

    async def delete(self, public_id: str) -> None:
        self._configure()
        try:
            response: Any = await run_in_threadpool(
                uploader.destroy,
                public_id,
                resource_type="image",
                invalidate=True,
            )
        except Exception as exc:
            logger.exception("Cloudinary image deletion failed")
            raise CloudinaryStorageError("Cloudinary image deletion failed") from exc

        if response.get("result") not in {"ok", "not found"}:
            raise CloudinaryStorageError("Cloudinary image deletion failed")


def _asset_from_response(response: Any) -> CloudinaryAsset:
    if not isinstance(response, dict):
        raise CloudinaryStorageError("Cloudinary returned an invalid upload response")

    public_id = response.get("public_id")
    secure_url = response.get("secure_url")
    file_format = response.get("format")
    if (
        not isinstance(public_id, str)
        or not public_id
        or not isinstance(secure_url, str)
        or not secure_url.startswith("https://")
        or not isinstance(file_format, str)
        or not file_format
    ):
        raise CloudinaryStorageError("Cloudinary returned incomplete image metadata")

    width = response.get("width")
    height = response.get("height")
    if not isinstance(width, int) or width <= 0:
        width = None
    if not isinstance(height, int) or height <= 0:
        height = None

    return CloudinaryAsset(
        public_id=public_id,
        secure_url=secure_url,
        format=file_format.lower(),
        width=width,
        height=height,
    )
