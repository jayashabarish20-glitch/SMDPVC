import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.media import Media, PhotoConfiguration

logger = logging.getLogger(__name__)


class PhotoConfigError(Exception):
    """Base error for photo configuration operations."""


class PhotoConfigNotFoundError(PhotoConfigError):
    """Raised when a photo configuration is not found."""


class PhotoConfigConflictError(PhotoConfigError):
    """Raised when there's a constraint conflict (e.g., duplicate config_key + display_order)."""


class PhotoConfigPersistenceError(PhotoConfigError):
    """Raised when there's a database persistence error."""


class MediaNotFoundError(PhotoConfigError):
    """Raised when a media item is not found."""


async def assign_photo_to_config(
    session: AsyncSession,
    media_id: UUID,
    config_key: str,
    display_order: int,
) -> PhotoConfiguration:
    """
    Assign a media to a configuration key with a display order.

    Raises:
        MediaNotFoundError: If media_id doesn't exist
        PhotoConfigConflictError: If config_key + display_order already exists
        PhotoConfigPersistenceError: If database operation fails
    """
    if display_order < 0:
        raise PhotoConfigError("display_order must be >= 0")

    try:
        # Verify media exists
        media = await session.scalar(
            select(Media).where(Media.id == media_id)
        )
        if media is None:
            raise MediaNotFoundError(f"Media with id {media_id} not found")

        photo_config = PhotoConfiguration(
            config_key=config_key,
            media_id=media_id,
            display_order=display_order,
        )
        session.add(photo_config)
        await session.flush()
        await session.refresh(photo_config, ["media"])
        await session.commit()
        return photo_config
    except IntegrityError as exc:
        await session.rollback()
        if "unique" in str(exc).lower():
            raise PhotoConfigConflictError(
                f"A photo already exists at {config_key} with display_order {display_order}"
            ) from exc
        raise PhotoConfigPersistenceError("Could not assign photo to configuration") from exc
    except SQLAlchemyError as exc:
        await session.rollback()
        raise PhotoConfigPersistenceError("Database error during photo assignment") from exc


async def update_display_order(
    session: AsyncSession,
    config_id: UUID,
    new_order: int,
) -> PhotoConfiguration:
    """
    Update display order for a photo configuration.

    Raises:
        PhotoConfigNotFoundError: If config_id doesn't exist
        PhotoConfigConflictError: If new display_order conflicts with existing config
        PhotoConfigPersistenceError: If database operation fails
    """
    if new_order < 0:
        raise PhotoConfigError("display_order must be >= 0")

    try:
        photo_config = await session.scalar(
            select(PhotoConfiguration)
            .where(PhotoConfiguration.id == config_id)
            .with_for_update()
        )
        if photo_config is None:
            await session.rollback()
            raise PhotoConfigNotFoundError(f"Photo configuration with id {config_id} not found")

        photo_config.display_order = new_order
        await session.flush()
        await session.refresh(photo_config, ["media"])
        await session.commit()
        return photo_config
    except IntegrityError as exc:
        await session.rollback()
        if "unique" in str(exc).lower():
            raise PhotoConfigConflictError(
                f"A photo already exists at {photo_config.config_key} with display_order {new_order}"
            ) from exc
        raise PhotoConfigPersistenceError("Could not update display order") from exc
    except SQLAlchemyError as exc:
        await session.rollback()
        raise PhotoConfigPersistenceError("Database error during display order update") from exc


async def remove_photo_from_config(
    session: AsyncSession,
    config_id: UUID,
) -> None:
    """
    Remove a photo from a configuration.

    Raises:
        PhotoConfigNotFoundError: If config_id doesn't exist
        PhotoConfigPersistenceError: If database operation fails
    """
    try:
        photo_config = await session.scalar(
            select(PhotoConfiguration).where(PhotoConfiguration.id == config_id)
        )
        if photo_config is None:
            await session.rollback()
            raise PhotoConfigNotFoundError(f"Photo configuration with id {config_id} not found")

        await session.delete(photo_config)
        await session.commit()
    except SQLAlchemyError as exc:
        await session.rollback()
        raise PhotoConfigPersistenceError("Could not remove photo from configuration") from exc


async def reorder_photos_in_key(
    session: AsyncSession,
    config_key: str,
    photo_ids: list[UUID],
) -> list[PhotoConfiguration]:
    """
    Reorder multiple photos in a config_key at once.
    Updates display_order for all photos based on array position.

    Raises:
        PhotoConfigPersistenceError: If database operation fails
    """
    if not photo_ids:
        return []

    try:
        # Fetch all existing photo configurations for this key
        existing = await session.scalars(
            select(PhotoConfiguration)
            .where(PhotoConfiguration.config_key == config_key)
            .order_by(PhotoConfiguration.display_order)
        )
        existing_configs = {str(pc.id): pc for pc in existing.all()}

        # Verify all requested photo_ids exist in this config_key
        existing_ids = set(existing_configs.keys())
        requested_ids = set(str(pid) for pid in photo_ids)

        if not requested_ids.issubset(existing_ids):
            await session.rollback()
            raise PhotoConfigPersistenceError(
                "Some photo configurations do not exist in this config_key"
            )

        # Update display order based on position
        updated_configs = []
        for position, photo_id in enumerate(photo_ids):
            photo_id_str = str(photo_id)
            if photo_id_str in existing_configs:
                photo_config = existing_configs[photo_id_str]
                photo_config.display_order = position
                updated_configs.append(photo_config)

        await session.flush()
        # Refresh all configs with media relationship
        for config in updated_configs:
            await session.refresh(config, ["media"])
        await session.commit()

        return updated_configs
    except IntegrityError as exc:
        await session.rollback()
        raise PhotoConfigPersistenceError(
            "Could not reorder photos (constraint conflict)"
        ) from exc
    except SQLAlchemyError as exc:
        await session.rollback()
        raise PhotoConfigPersistenceError("Database error during photo reordering") from exc


async def list_admin_configs(
    session: AsyncSession,
    config_key: str | None = None,
) -> list[PhotoConfiguration]:
    """
    List all photo configurations (admin view).
    Optionally filter by config_key.
    """
    try:
        query = select(PhotoConfiguration).options(
            joinedload(PhotoConfiguration.media)
        ).order_by(
            PhotoConfiguration.config_key,
            PhotoConfiguration.display_order,
        )

        if config_key is not None:
            query = query.where(PhotoConfiguration.config_key == config_key)

        result = await session.scalars(query)
        return list(result.all())
    except SQLAlchemyError as exc:
        await session.rollback()
        raise PhotoConfigPersistenceError("Could not list photo configurations") from exc
