from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.schemas.media import MediaRead
from app.services.cloudinary_service import CloudinaryStorageError
from app.services.media_service import (
    InvalidImageError,
    MediaCleanupError,
    MediaInUseError,
    MediaNotFoundError,
    MediaPersistenceError,
    UploadTooLargeError,
    delete_media,
    replace_media,
    upload_media,
)

router = APIRouter(tags=["media"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]
AdminAccess = Annotated[None, Depends(require_admin)]


@router.post(
    "/upload",
    response_model=MediaRead,
    status_code=status.HTTP_201_CREATED,
)
async def upload_image(
    _: AdminAccess,
    session: DatabaseSession,
    file: Annotated[UploadFile, File()],
    alt_text: Annotated[str, Form(max_length=500)] = "",
) -> MediaRead:
    try:
        return MediaRead.model_validate(
            await upload_media(session, file, alt_text=alt_text)
        )
    except UploadTooLargeError as exc:
        raise HTTPException(status_code=413, detail=str(exc)) from exc
    except InvalidImageError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except MediaPersistenceError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except CloudinaryStorageError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.put("/{media_id}", response_model=MediaRead)
async def replace_image(
    media_id: UUID,
    _: AdminAccess,
    session: DatabaseSession,
    file: Annotated[UploadFile, File()],
    alt_text: Annotated[str | None, Form(max_length=500)] = None,
) -> MediaRead:
    try:
        return MediaRead.model_validate(
            await replace_media(session, media_id, file, alt_text=alt_text)
        )
    except UploadTooLargeError as exc:
        raise HTTPException(status_code=413, detail=str(exc)) from exc
    except InvalidImageError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except MediaNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except MediaPersistenceError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except MediaCleanupError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except CloudinaryStorageError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.delete(
    "/{media_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def delete_image(
    media_id: UUID,
    _: AdminAccess,
    session: DatabaseSession,
) -> Response:
    try:
        await delete_media(session, media_id)
    except MediaNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except MediaInUseError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except MediaPersistenceError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except MediaCleanupError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except CloudinaryStorageError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)
