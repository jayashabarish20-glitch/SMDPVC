import logging
import warnings
from io import BytesIO
from pathlib import PurePosixPath
from uuid import UUID

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.content import (
    ContentItem,
    GalleryImage,
    LeadershipProfile,
    SchoolSection,
    Topper,
)
from app.models.media import CloudinaryCleanup, Media, PhotoConfiguration
from app.services.cloudinary_service import (
    CloudinaryStorage,
    CloudinaryStorageError,
    ImageStorage,
)

logger = logging.getLogger(__name__)

SUPPORTED_FORMATS = {
    "JPEG": {"jpg", "jpeg"},
    "PNG": {"png"},
    "WEBP": {"webp"},
}
EXTENSION_FORMATS = {
    extension: image_format
    for image_format, extensions in SUPPORTED_FORMATS.items()
    for extension in extensions
}


class MediaError(Exception):
    """Base error for media operations."""


class InvalidImageError(MediaError):
    pass


class UploadTooLargeError(MediaError):
    pass


class MediaNotFoundError(MediaError):
    pass


class MediaInUseError(MediaError):
    pass


class MediaPersistenceError(MediaError):
    pass


class MediaCleanupError(MediaError):
    pass


async def upload_media(
    session: AsyncSession,
    upload: UploadFile,
    alt_text: str = "",
    storage: ImageStorage | None = None,
) -> Media:
    data, image_format, width, height, filename = await _read_valid_image(upload)
    storage = storage or CloudinaryStorage()
    asset = await storage.upload(data, filename)
    media = Media(
        cloudinary_public_id=asset.public_id,
        image_url=asset.secure_url,
        original_filename=filename,
        file_format=asset.format or image_format.lower(),
        file_size=len(data),
        width=asset.width or width,
        height=asset.height or height,
        alt_text=alt_text,
    )

    try:
        session.add(media)
        await session.flush()
        await session.refresh(media)
        await session.commit()
    except SQLAlchemyError as exc:
        await session.rollback()
        cleanup_status = await _cleanup_after_database_failure(
            session,
            storage,
            asset.public_id,
        )
        message = "Could not save uploaded image metadata"
        message = _append_cleanup_status(message, cleanup_status)
        raise MediaPersistenceError(message) from exc

    return media


async def replace_media(
    session: AsyncSession,
    media_id: UUID,
    upload: UploadFile,
    alt_text: str | None = None,
    storage: ImageStorage | None = None,
) -> Media:
    data, image_format, width, height, filename = await _read_valid_image(upload)
    media = await _get_media_for_update(session, media_id)
    if media.deletion_pending:
        await session.rollback()
        raise MediaNotFoundError("Media is being deleted")

    storage = storage or CloudinaryStorage()
    try:
        new_asset = await storage.upload(data, filename)
    except CloudinaryStorageError:
        await session.rollback()
        raise

    old_public_id = media.cloudinary_public_id
    media.cloudinary_public_id = new_asset.public_id
    media.image_url = new_asset.secure_url
    media.original_filename = filename
    media.file_format = new_asset.format or image_format.lower()
    media.file_size = len(data)
    media.width = new_asset.width or width
    media.height = new_asset.height or height
    if alt_text is not None:
        media.alt_text = alt_text
    cleanup_record = CloudinaryCleanup(public_id=old_public_id)

    try:
        session.add(cleanup_record)
        await session.flush()
        await session.refresh(media)
        await session.commit()
    except SQLAlchemyError as exc:
        await session.rollback()
        cleanup_status = await _cleanup_after_database_failure(
            session,
            storage,
            new_asset.public_id,
        )
        message = "Could not save replacement image metadata"
        message = _append_cleanup_status(message, cleanup_status)
        raise MediaPersistenceError(message) from exc

    try:
        await storage.delete(old_public_id)
    except CloudinaryStorageError as exc:
        logger.exception("Could not clean up replaced Cloudinary asset")
        raise MediaCleanupError(
            "Replacement was saved; previous-image cleanup is queued for retry"
        ) from exc

    try:
        await session.delete(cleanup_record)
        await session.commit()
    except SQLAlchemyError as exc:
        await session.rollback()
        raise MediaPersistenceError(
            "Previous image was deleted, but its cleanup record could not be removed"
        ) from exc

    return media


async def delete_media(
    session: AsyncSession,
    media_id: UUID,
    storage: ImageStorage | None = None,
) -> None:
    media = await _get_media_for_update(session, media_id)
    if not media.deletion_pending:
        reference_count = await _count_media_references(session, media_id)
        if reference_count:
            await session.rollback()
            raise MediaInUseError("Image is still referenced by website content")

        media.deletion_pending = True
        try:
            await session.commit()
        except SQLAlchemyError as exc:
            await session.rollback()
            raise MediaPersistenceError("Could not mark image for deletion") from exc

    storage = storage or CloudinaryStorage()
    try:
        await storage.delete(media.cloudinary_public_id)
    except CloudinaryStorageError as exc:
        raise MediaCleanupError(
            "Image is pending deletion; Cloudinary cleanup can be retried"
        ) from exc

    try:
        await session.delete(media)
        await session.commit()
    except SQLAlchemyError as exc:
        await session.rollback()
        raise MediaPersistenceError(
            "Cloudinary image was deleted, but database cleanup is pending"
        ) from exc


async def retry_pending_cloudinary_cleanup(
    session: AsyncSession,
    storage: ImageStorage | None = None,
) -> int:
    storage = storage or CloudinaryStorage()
    try:
        records = (
            await session.scalars(
                select(CloudinaryCleanup).order_by(CloudinaryCleanup.created_at)
            )
        ).all()
    except SQLAlchemyError as exc:
        await session.rollback()
        raise MediaPersistenceError("Could not load pending image cleanup") from exc

    completed = 0
    for record in records:
        try:
            await storage.delete(record.public_id)
        except CloudinaryStorageError as exc:
            await session.rollback()
            raise MediaCleanupError(
                "Cloudinary cleanup remains pending and can be retried"
            ) from exc

        try:
            await session.delete(record)
            await session.commit()
        except SQLAlchemyError as exc:
            await session.rollback()
            raise MediaPersistenceError(
                "Cloudinary asset was deleted, but its cleanup record remains"
            ) from exc
        completed += 1

    return completed


async def _read_valid_image(
    upload: UploadFile,
) -> tuple[bytes, str, int, int, str]:
    maximum_size = get_settings().max_upload_size_bytes
    chunks: list[bytes] = []
    total_size = 0
    while chunk := await upload.read(64 * 1024):
        total_size += len(chunk)
        if total_size > maximum_size:
            raise UploadTooLargeError(
                f"Image exceeds the maximum size of {maximum_size} bytes"
            )
        chunks.append(chunk)

    if total_size == 0:
        raise InvalidImageError("The uploaded file is empty")

    data = b"".join(chunks)
    filename = _safe_filename(upload.filename or "")
    extension = PurePosixPath(filename).suffix.lower().lstrip(".")
    expected_format = EXTENSION_FORMATS.get(extension)
    if expected_format is None:
        raise InvalidImageError("Supported formats are JPG, JPEG, PNG, and WebP")

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(BytesIO(data)) as image:
                image_format = image.format
                if image_format not in SUPPORTED_FORMATS:
                    raise InvalidImageError(
                        "Supported formats are JPG, JPEG, PNG, and WebP"
                    )
                if image_format != expected_format:
                    raise InvalidImageError(
                        "The filename extension does not match the image content"
                    )
                image.verify()

            with Image.open(BytesIO(data)) as image:
                width, height = image.size
    except InvalidImageError:
        raise
    except (
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
        UnidentifiedImageError,
        OSError,
        ValueError,
    ) as exc:
        raise InvalidImageError("The uploaded file is not a valid image") from exc

    if not width or not height:
        raise InvalidImageError("The uploaded image has invalid dimensions")
    return data, image_format, width, height, filename


def _safe_filename(filename: str) -> str:
    normalized = filename.replace("\\", "/")
    basename = PurePosixPath(normalized).name.strip()
    if not basename or basename in {".", ".."}:
        raise InvalidImageError("A valid image filename is required")
    if len(basename) > 255:
        raise InvalidImageError("Image filename must be 255 characters or fewer")
    return basename


async def _get_media_for_update(session: AsyncSession, media_id: UUID) -> Media:
    try:
        media = await session.scalar(
            select(Media).where(Media.id == media_id).with_for_update()
        )
    except SQLAlchemyError as exc:
        await session.rollback()
        raise MediaPersistenceError("Could not access image metadata") from exc
    if media is None:
        await session.rollback()
        raise MediaNotFoundError("Image was not found")
    return media


async def _count_media_references(session: AsyncSession, media_id: UUID) -> int:
    reference_columns = (
        (GalleryImage, GalleryImage.media_id),
        (LeadershipProfile, LeadershipProfile.media_id),
        (SchoolSection, SchoolSection.card_media_id),
        (Topper, Topper.media_id),
        (ContentItem, ContentItem.media_id),
        (PhotoConfiguration, PhotoConfiguration.media_id),
    )
    try:
        total = 0
        for model, reference_column in reference_columns:
            result = await session.scalar(
                select(func.count())
                .select_from(model)
                .where(reference_column == media_id)
            )
            total += result or 0
        return total
    except SQLAlchemyError as exc:
        await session.rollback()
        raise MediaPersistenceError("Could not check image references") from exc


async def _cleanup_after_database_failure(
    session: AsyncSession,
    storage: ImageStorage,
    public_id: str,
) -> str:
    try:
        await storage.delete(public_id)
        return "deleted"
    except CloudinaryStorageError:
        logger.exception(
            "Failed to clean up Cloudinary asset after database failure: %s",
            public_id,
        )

    try:
        session.add(CloudinaryCleanup(public_id=public_id))
        await session.commit()
        return "queued"
    except SQLAlchemyError:
        await session.rollback()
        logger.exception(
            "Failed to queue Cloudinary cleanup after database failure: %s",
            public_id,
        )
        return "failed"


def _append_cleanup_status(message: str, cleanup_status: str) -> str:
    if cleanup_status == "queued":
        return f"{message}; Cloudinary cleanup is queued for retry"
    if cleanup_status == "failed":
        return f"{message}; Cloudinary cleanup could not be completed or queued"
    return message
    return True
