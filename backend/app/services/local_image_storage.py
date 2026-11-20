"""
Temporary local image storage for School Toppers testing.

This is a temporary solution to test the topper feature without Cloudinary credentials.
In production, this will be replaced with Cloudinary storage.

IMPORTANT: This is for testing only. Do not use in production.
"""

import logging
import uuid
from pathlib import Path
from dataclasses import dataclass

from app.services.cloudinary_service import ImageStorage

logger = logging.getLogger(__name__)

# Temporary storage directory for topper images
TOPPERS_STORAGE_DIR = Path(__file__).resolve().parents[2] / "uploads" / "toppers"
TOPPERS_STORAGE_DIR.mkdir(parents=True, exist_ok=True)


@dataclass(frozen=True)
class LocalImageAsset:
    public_id: str
    secure_url: str
    format: str
    width: int | None = None
    height: int | None = None


class LocalImageStorage:
    """Temporary local storage for topper images during testing."""

    def __init__(self, base_url: str | None = None):
        # base_url should be the absolute URL path, e.g., "http://localhost:8000/uploads/toppers"
        # If not provided, it will be constructed as a relative path (for backward compatibility)
        self.base_url = base_url or "/uploads/toppers"
        self.storage_dir = TOPPERS_STORAGE_DIR

    async def upload(self, data: bytes, filename: str) -> LocalImageAsset:
        """
        Store image locally and return a reference.

        Args:
            data: Image file bytes
            filename: Original filename

        Returns:
            LocalImageAsset with file reference and URL
        """
        try:
            # Generate unique filename to avoid conflicts
            file_extension = Path(filename).suffix or ".jpg"
            unique_id = str(uuid.uuid4())
            stored_filename = f"{unique_id}{file_extension}"

            # Save file
            file_path = self.storage_dir / stored_filename
            file_path.write_bytes(data)

            logger.info(f"Stored image locally: {stored_filename}")

            # Return asset reference
            # The public_id is the filename, which is used to identify the image for deletion
            return LocalImageAsset(
                public_id=stored_filename,
                secure_url=f"{self.base_url}/{stored_filename}",
                format=file_extension.lstrip("."),
                width=None,
                height=None,
            )
        except Exception as exc:
            logger.error(f"Failed to store image locally: {exc}")
            raise

    async def delete(self, public_id: str) -> None:
        """
        Delete locally stored image.

        Args:
            public_id: Filename to delete
        """
        try:
            file_path = self.storage_dir / public_id
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Deleted local image: {public_id}")
        except Exception as exc:
            logger.error(f"Failed to delete image: {exc}")
            # Don't raise - allow cleanup to be non-fatal
