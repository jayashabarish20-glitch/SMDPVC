import io
import json
from typing import Any

import pytest
from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.models.content_record import ContentRecord, ContentRecordMedia
from app.models.media import Media
from app.schemas.content_record import ContentRecordMediaInput, ContentRecordUpsert
from app.services import cloudinary_service, content_record_service, media_service
from app.services.cloudinary_service import CloudinaryAsset, CloudinaryStorage
from app.services.content_record_service import ContentRecordValidationError
from tests.conftest import image_upload


class RecordingStorage:
    def __init__(self) -> None:
        self.uploads: list[tuple[str, dict[str, Any]]] = []
        self.deleted: list[tuple[str, dict[str, Any]]] = []

    async def upload(self, data: bytes, filename: str, **kwargs: Any) -> CloudinaryAsset:
        self.uploads.append((filename, kwargs))
        return CloudinaryAsset(
            public_id=f"school/{filename}",
            secure_url=f"https://res.cloudinary.com/demo/{kwargs.get('resource_type', 'image')}/upload/{filename}",
            format=filename.rsplit(".", 1)[-1],
            width=None,
            height=None,
        )

    async def delete(self, public_id: str, **kwargs: Any) -> None:
        self.deleted.append((public_id, kwargs))


def document_upload(filename: str, content: bytes) -> UploadFile:
    return UploadFile(filename=filename, file=io.BytesIO(content))


def make_media(name: str, pending: bool = False) -> Media:
    return Media(
        cloudinary_public_id=f"school/{name}",
        image_url=f"https://res.cloudinary.com/demo/image/upload/school/{name}.jpg",
        original_filename=f"{name}.jpg",
        file_format="jpg",
        file_size=10,
        width=4,
        height=3,
        alt_text=name,
        deletion_pending=pending,
    )


# ---- Media type validation and Cloudinary routing -------------------------


@pytest.mark.asyncio
async def test_pdf_upload_is_stored_as_raw_resource(
    session: AsyncSession,
) -> None:
    storage = RecordingStorage()
    media = await media_service.upload_media(
        session,
        document_upload("calendar.pdf", b"%PDF-1.4\n%test"),
        storage=storage,
    )

    assert media.resource_type == "raw"
    assert media.file_format == "pdf"
    assert storage.uploads == [("calendar.pdf", {"resource_type": "raw"})]


@pytest.mark.asyncio
async def test_video_upload_is_stored_as_video_resource(
    session: AsyncSession,
) -> None:
    storage = RecordingStorage()
    media = await media_service.upload_media(
        session,
        document_upload("tour.mp4", b"\x00\x00\x00\x18ftypmp42rest"),
        storage=storage,
    )

    assert media.resource_type == "video"
    assert storage.uploads == [("tour.mp4", {"resource_type": "video"})]


@pytest.mark.asyncio
async def test_image_upload_keeps_original_call_shape(
    session: AsyncSession,
) -> None:
    storage = RecordingStorage()
    media = await media_service.upload_media(
        session,
        image_upload("photo.jpg"),
        storage=storage,
    )

    assert media.resource_type == "image"
    # Images must not pass resource_type, so existing storage implementations
    # with the original (data, filename) signature keep working.
    assert storage.uploads == [("photo.jpg", {})]


@pytest.mark.asyncio
async def test_pdf_with_wrong_content_is_rejected(session: AsyncSession) -> None:
    with pytest.raises(media_service.InvalidImageError):
        await media_service.upload_media(
            session,
            document_upload("fake.pdf", b"not a pdf"),
            storage=RecordingStorage(),
        )


@pytest.mark.asyncio
async def test_unsupported_extension_still_uses_image_validation(
    session: AsyncSession,
) -> None:
    with pytest.raises(media_service.InvalidImageError):
        await media_service.upload_media(
            session,
            document_upload("script.exe", b"MZ"),
            storage=RecordingStorage(),
        )


@pytest.mark.asyncio
async def test_delete_uses_stored_resource_type(session: AsyncSession) -> None:
    storage = RecordingStorage()
    media = await media_service.upload_media(
        session,
        document_upload("calendar.pdf", b"%PDF-1.4\n%test"),
        storage=storage,
    )
    await media_service.delete_media(session, media.id, storage=storage)

    assert storage.deleted == [("school/calendar.pdf", {"resource_type": "raw"})]


def test_cloudinary_rejects_unknown_resource_type() -> None:
    import asyncio

    settings = Settings.model_construct(
        database_url="sqlite+aiosqlite:///:memory:",
        cloudinary_cloud_name="c",
        cloudinary_api_key="k",
        cloudinary_api_secret="s",
    )
    with pytest.raises(cloudinary_service.CloudinaryStorageError):
        asyncio.run(
            CloudinaryStorage(settings).upload(b"x", "f.bin", resource_type="bogus")
        )


# ---- Content records ------------------------------------------------------


@pytest.mark.asyncio
async def test_content_record_round_trip_and_replace(session: AsyncSession) -> None:
    photo = make_media("photo")
    session.add(photo)
    await session.commit()

    first = await content_record_service.upsert_record(
        session,
        "primary.about",
        ContentRecordUpsert(
            payload={"description": "Hello", "subjects": ["Maths"]},
            media=[ContentRecordMediaInput(media_id=photo.id, role="photo")],
        ),
    )
    assert json.loads(first.payload) == {"description": "Hello", "subjects": ["Maths"]}
    assert [link.media.id for link in first.media_links] == [photo.id]

    second = await content_record_service.upsert_record(
        session,
        "primary.about",
        ContentRecordUpsert(payload={"description": "Updated"}, media=[]),
    )
    assert second.id == first.id
    assert json.loads(second.payload) == {"description": "Updated"}
    assert second.media_links == []


@pytest.mark.asyncio
async def test_content_record_rejects_missing_and_pending_media(
    session: AsyncSession,
) -> None:
    pending = make_media("gone", pending=True)
    session.add(pending)
    await session.commit()

    with pytest.raises(ContentRecordValidationError):
        await content_record_service.upsert_record(
            session,
            "nursery.about",
            ContentRecordUpsert(
                payload={},
                media=[ContentRecordMediaInput(media_id=pending.id)],
            ),
        )


@pytest.mark.asyncio
async def test_public_read_hides_media_pending_deletion(session: AsyncSession) -> None:
    live = make_media("live")
    gone = make_media("gone")
    session.add_all([live, gone])
    await session.commit()

    await content_record_service.upsert_record(
        session,
        "hs.gallery",
        ContentRecordUpsert(
            payload={"description": "d"},
            media=[
                ContentRecordMediaInput(media_id=live.id, position=0),
                ContentRecordMediaInput(media_id=gone.id, position=1),
            ],
        ),
    )
    gone.deletion_pending = True
    await session.commit()

    public = await content_record_service.get_record(session, "hs.gallery", public=True)
    assert public is not None
    assert [link.media_id for link in public.media_links] == [live.id]


@pytest.mark.asyncio
async def test_in_use_media_cannot_be_deleted(session: AsyncSession) -> None:
    photo = make_media("used")
    session.add(photo)
    await session.commit()
    await content_record_service.upsert_record(
        session,
        "nursery.gallery",
        ContentRecordUpsert(
            payload={},
            media=[ContentRecordMediaInput(media_id=photo.id)],
        ),
    )

    with pytest.raises(media_service.MediaInUseError):
        await media_service.delete_media(session, photo.id, storage=RecordingStorage())


@pytest.mark.asyncio
async def test_delete_record_removes_links_but_keeps_media(
    session: AsyncSession,
) -> None:
    photo = make_media("keep")
    session.add(photo)
    await session.commit()
    await content_record_service.upsert_record(
        session,
        "primary.gallery",
        ContentRecordUpsert(
            payload={},
            media=[ContentRecordMediaInput(media_id=photo.id)],
        ),
    )

    await content_record_service.delete_record(session, "primary.gallery")

    records = (await session.scalars(select(ContentRecord))).all()
    links = (await session.scalars(select(ContentRecordMedia))).all()
    media = (await session.scalars(select(Media))).all()
    assert records == []
    assert links == []
    assert [item.id for item in media] == [photo.id]


@pytest.mark.asyncio
async def test_delete_missing_record_reports_not_found(session: AsyncSession) -> None:
    with pytest.raises(content_record_service.ContentRecordNotFoundError):
        await content_record_service.delete_record(session, "does.not.exist")


def test_payload_size_limit_is_enforced() -> None:
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        ContentRecordUpsert(payload={"text": "x" * 250_000})
