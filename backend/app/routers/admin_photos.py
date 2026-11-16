import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.schemas.media import PhotoConfigurationRead
from app.services.photo_config_service import (
    PhotoConfigConflictError,
    PhotoConfigError,
    PhotoConfigNotFoundError,
    PhotoConfigPersistenceError,
    assign_photo_to_config,
    list_admin_configs,
    remove_photo_from_config,
    reorder_photos_in_key,
    update_display_order,
    MediaNotFoundError,
)

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/photos", tags=["admin-photos"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
AdminAccess = Annotated[None, Depends(require_admin)]


class AssignPhotoRequest(BaseModel):
    """Request body for assigning a photo to configuration."""
    config_key: str = Field(..., min_length=1, max_length=160)
    media_id: UUID
    display_order: int = Field(default=0, ge=0)


class UpdateDisplayOrderRequest(BaseModel):
    """Request body for updating display order."""
    display_order: int = Field(..., ge=0)


class ReorderBatchRequest(BaseModel):
    """Request body for batch reordering photos."""
    config_key: str = Field(..., min_length=1, max_length=160)
    photo_ids: list[UUID]


@router.post(
    "/assign",
    response_model=PhotoConfigurationRead,
    status_code=status.HTTP_201_CREATED,
)
async def assign_photo(
    _: AdminAccess,
    session: DatabaseSession,
    request: AssignPhotoRequest,
) -> PhotoConfigurationRead:
    """
    Assign a media to a configuration key with a display order.

    Returns: PhotoConfigurationRead
    """
    try:
        photo_config = await assign_photo_to_config(
            session,
            request.media_id,
            request.config_key,
            request.display_order,
        )
        return PhotoConfigurationRead.model_validate(photo_config)
    except MediaNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PhotoConfigConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except PhotoConfigError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except PhotoConfigPersistenceError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.put(
    "/{config_id}/reorder",
    response_model=PhotoConfigurationRead,
)
async def reorder_photo(
    config_id: UUID,
    _: AdminAccess,
    session: DatabaseSession,
    request: UpdateDisplayOrderRequest,
) -> PhotoConfigurationRead:
    """
    Update display order for a photo configuration.

    Returns: PhotoConfigurationRead
    """
    try:
        photo_config = await update_display_order(
            session,
            config_id,
            request.display_order,
        )
        return PhotoConfigurationRead.model_validate(photo_config)
    except PhotoConfigNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PhotoConfigConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except PhotoConfigError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except PhotoConfigPersistenceError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.delete(
    "/{config_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def delete_photo(
    config_id: UUID,
    _: AdminAccess,
    session: DatabaseSession,
) -> Response:
    """
    Remove a photo from a configuration.

    Status: 204 No Content
    """
    try:
        await remove_photo_from_config(session, config_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except PhotoConfigNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except PhotoConfigPersistenceError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get(
    "",
    response_model=list[PhotoConfigurationRead],
)
async def list_photos(
    _: AdminAccess,
    session: DatabaseSession,
    config_key: Annotated[str | None, Query(max_length=160)] = None,
) -> list[PhotoConfigurationRead]:
    """
    List all photo configurations (admin view).

    Query Parameters:
        config_key (optional): Filter by config_key

    Returns: list[PhotoConfigurationRead]
    """
    try:
        photo_configs = await list_admin_configs(session, config_key=config_key)
        return [PhotoConfigurationRead.model_validate(pc) for pc in photo_configs]
    except PhotoConfigPersistenceError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post(
    "/reorder-batch",
    response_model=list[PhotoConfigurationRead],
)
async def reorder_batch(
    _: AdminAccess,
    session: DatabaseSession,
    request: ReorderBatchRequest,
) -> list[PhotoConfigurationRead]:
    """
    Reorder multiple photos in a config_key at once.
    Updates display_order for all photos based on array position.

    Body:
        config_key: The configuration key to reorder
        photo_ids: List of PhotoConfiguration UUIDs in desired order

    Returns: list[PhotoConfigurationRead]
    """
    try:
        photo_configs = await reorder_photos_in_key(
            session,
            request.config_key,
            request.photo_ids,
        )
        return [PhotoConfigurationRead.model_validate(pc) for pc in photo_configs]
    except PhotoConfigError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except PhotoConfigPersistenceError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
