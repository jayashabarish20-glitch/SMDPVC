import uuid
from collections.abc import AsyncIterator

import pytest
from sqlalchemy import event, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content import GalleryImage, LeadershipProfile
from app.models.media import CloudinaryCleanup, Media
from app.services.cloudinary_service import (
    CloudinaryAsset,
    CloudinaryStorageError,
)
from app.services.media_service import (
    InvalidImageError,
    MediaCleanupError,
    MediaInUseError,
    MediaPersistenceError,
    UploadTooLargeError,
    delete_media,
    retry_pending_cloudinary_cleanup,
    replace_media,
    upload_media,
)
from tests.conftest import image_upload


class FakeStorage:
    def __init__(self) -> None:
        self.uploaded: list[tuple[bytes, str]] = []
        self.assets: list[CloudinaryAsset] = []
        self.deleted: list[str] = []
        self.fail_upload = False
        self.fail_delete = False

    async def upload(self, data: bytes, filename: str) -> CloudinaryAsset:
        if self.fail_upload:
            raise CloudinaryStorageError("mock upload failure")
        self.uploaded.append((data, filename))
        public_id = f"school/{uuid.uuid4()}"
        asset = CloudinaryAsset(
            public_id=public_id,
            secure_url=(
                f"https://res.cloudinary.com/demo/image/upload/"
                f"{public_id}.{filename.rsplit('.', 1)[-1]}"
            ),
            format=filename.rsplit(".", 1)[-1],
            width=4,
            height=3,
        )
        self.assets.append(asset)
        return asset

    async def delete(self, public_id: str) -> None:
        if self.fail_delete:
            raise CloudinaryStorageError("mock delete failure")
        self.deleted.append(public_id)


@pytest.mark.asyncio
async def test_valid_image_upload_persists_metadata(session: AsyncSession) -> None:
    storage = FakeStorage()

    media = await upload_media(session, image_upload(), "School activity", storage)

    assert media.cloudinary_public_id.startswith("school/")
    assert media.image_url.startswith("https://res.cloudinary.com/")
    assert media.original_filename == "sample.jpg"
    assert media.file_format == "jpg"
    assert media.file_size == len(storage.uploaded[0][0])
    assert (media.width, media.height) == (4, 3)
    assert media.alt_text == "School activity"
    assert await session.get(Media, media.id) is not None


@pytest.mark.parametrize(
    ("filename", "image_format"),
    [
        ("photo.jpeg", "JPEG"),
        ("photo.png", "PNG"),
        ("photo.webp", "WEBP"),
    ],
)
@pytest.mark.asyncio
async def test_accepts_each_supported_image_format(
    session: AsyncSession,
    filename: str,
    image_format: str,
) -> None:
    media = await upload_media(
        session,
        image_upload(filename=filename, image_format=image_format),
        storage=FakeStorage(),
    )
    assert media.file_format == filename.rsplit(".", 1)[-1]


@pytest.mark.asyncio
async def test_rejects_unsupported_extension(session: AsyncSession) -> None:
    with pytest.raises(InvalidImageError):
        await upload_media(session, image_upload(filename="sample.gif"), storage=FakeStorage())


@pytest.mark.asyncio
async def test_rejects_filename_that_disagrees_with_image_content(
    session: AsyncSession,
) -> None:
    with pytest.raises(InvalidImageError, match="extension"):
        await upload_media(
            session,
            image_upload(filename="sample.png", image_format="JPEG"),
            storage=FakeStorage(),
        )


@pytest.mark.asyncio
async def test_rejects_image_larger_than_configured_limit(
    session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("MAX_UPLOAD_SIZE_BYTES", "128")

    with pytest.raises(UploadTooLargeError):
        await upload_media(session, image_upload(), storage=FakeStorage())


@pytest.mark.asyncio
async def test_rejects_invalid_image_content(session: AsyncSession) -> None:
    from fastapi import UploadFile
    from io import BytesIO

    invalid = UploadFile(filename="fake.jpg", file=BytesIO(b"not an image"))
    with pytest.raises(InvalidImageError):
        await upload_media(session, invalid, storage=FakeStorage())


@pytest.mark.asyncio
async def test_cloudinary_failure_does_not_create_media_row(
    session: AsyncSession,
) -> None:
    storage = FakeStorage()
    storage.fail_upload = True

    with pytest.raises(CloudinaryStorageError):
        await upload_media(session, image_upload(), storage=storage)

    assert (await session.scalars(select(Media))).all() == []
    assert storage.deleted == []


@pytest.mark.asyncio
async def test_database_failure_cleans_up_cloudinary_upload(
    session: AsyncSession,
) -> None:
    storage = FakeStorage()

    def fail_commit(_: AsyncSession) -> None:
        raise SQLAlchemyError("simulated database failure")

    event.listen(session.sync_session, "before_commit", fail_commit)
    with pytest.raises(MediaPersistenceError):
        await upload_media(session, image_upload(), storage=storage)
    event.remove(session.sync_session, "before_commit", fail_commit)

    assert storage.deleted == [storage.assets[0].public_id]
    assert (await session.scalars(select(Media))).all() == []


@pytest.mark.asyncio
async def test_failed_compensating_cleanup_is_reported(
    session: AsyncSession,
) -> None:
    storage = FakeStorage()
    storage.fail_delete = True
    commit_attempts = 0

    def fail_commit(_: AsyncSession) -> None:
        nonlocal commit_attempts
        commit_attempts += 1
        if commit_attempts == 1:
            raise SQLAlchemyError("simulated database failure")

    event.listen(session.sync_session, "before_commit", fail_commit)
    with pytest.raises(MediaPersistenceError, match="queued for retry"):
        await upload_media(session, image_upload(), storage=storage)
    event.remove(session.sync_session, "before_commit", fail_commit)

    queued = (await session.scalars(select(CloudinaryCleanup))).all()
    assert len(queued) == 1
    assert queued[0].public_id == storage.assets[0].public_id


@pytest.mark.asyncio
async def test_replacement_deletes_old_asset_after_database_commit(
    session: AsyncSession,
) -> None:
    storage = FakeStorage()
    existing = await upload_media(session, image_upload(), storage=storage)
    previous_public_id = existing.cloudinary_public_id

    replaced = await replace_media(
        session,
        existing.id,
        image_upload(filename="replacement.webp", image_format="WEBP"),
        alt_text="Updated image",
        storage=storage,
    )

    assert replaced.id == existing.id
    assert replaced.cloudinary_public_id != previous_public_id
    assert replaced.file_format == "webp"
    assert replaced.alt_text == "Updated image"
    assert storage.deleted == [previous_public_id]


@pytest.mark.asyncio
async def test_replacement_database_failure_cleans_up_new_asset(
    session: AsyncSession,
) -> None:
    storage = FakeStorage()
    existing = await upload_media(session, image_upload(), storage=storage)
    media_id = existing.id
    old_public_id = existing.cloudinary_public_id

    def fail_commit(_: AsyncSession) -> None:
        raise SQLAlchemyError("simulated database failure")

    event.listen(session.sync_session, "before_commit", fail_commit)
    with pytest.raises(MediaPersistenceError):
        await replace_media(
            session,
            media_id,
            image_upload(),
            storage=storage,
        )
    event.remove(session.sync_session, "before_commit", fail_commit)

    assert storage.deleted[0] != old_public_id
    persisted = await session.get(Media, media_id)
    assert persisted is not None
    assert persisted.cloudinary_public_id == old_public_id


@pytest.mark.asyncio
async def test_replacement_reports_old_asset_cleanup_failure(
    session: AsyncSession,
) -> None:
    storage = FakeStorage()
    existing = await upload_media(session, image_upload(), storage=storage)
    old_public_id = existing.cloudinary_public_id
    storage.fail_delete = True

    with pytest.raises(MediaCleanupError):
        await replace_media(session, existing.id, image_upload(), storage=storage)

    refreshed = await session.get(Media, existing.id)
    assert refreshed is not None
    assert refreshed.cloudinary_public_id != old_public_id
    assert await session.scalar(
        select(CloudinaryCleanup).where(CloudinaryCleanup.public_id == old_public_id)
    )
    storage.fail_delete = False
    assert await retry_pending_cloudinary_cleanup(session, storage) == 1
    assert storage.deleted == [old_public_id]
    assert await session.scalar(
        select(CloudinaryCleanup).where(CloudinaryCleanup.public_id == old_public_id)
    ) is None


@pytest.mark.asyncio
async def test_delete_refuses_media_referenced_by_gallery(
    session: AsyncSession,
) -> None:
    storage = FakeStorage()
    media = await upload_media(session, image_upload(), storage=storage)
    media_id = media.id
    from app.models.content import GalleryCollection

    collection = GalleryCollection(collection_key="test.gallery", title="Test gallery")
    session.add(collection)
    await session.flush()
    session.add(
        GalleryImage(
            collection_id=collection.id,
            media_id=media.id,
            display_order=0,
        )
    )
    await session.commit()

    with pytest.raises(MediaInUseError):
        await delete_media(session, media_id, storage=storage)

    assert await session.get(Media, media_id) is not None
    assert storage.deleted == []


@pytest.mark.asyncio
async def test_delete_refuses_media_shared_by_leadership(
    session: AsyncSession,
) -> None:
    storage = FakeStorage()
    media = await upload_media(session, image_upload(), storage=storage)
    media_id = media.id
    session.add(
        LeadershipProfile(
            profile_key="principal",
            name="Principal",
            designation="Principal",
            category="School Head",
            media_id=media.id,
        )
    )
    await session.commit()

    with pytest.raises(MediaInUseError):
        await delete_media(session, media_id, storage=storage)

    assert await session.get(Media, media_id) is not None
    assert storage.deleted == []


@pytest.mark.asyncio
async def test_delete_unreferenced_media_removes_database_and_cloudinary(
    session: AsyncSession,
) -> None:
    storage = FakeStorage()
    media = await upload_media(session, image_upload(), storage=storage)
    media_id = media.id
    public_id = media.cloudinary_public_id

    await delete_media(session, media_id, storage=storage)

    assert await session.get(Media, media_id) is None
    assert storage.deleted == [public_id]


@pytest.mark.asyncio
async def test_delete_cloudinary_failure_leaves_retryable_pending_row(
    session: AsyncSession,
) -> None:
    storage = FakeStorage()
    media = await upload_media(session, image_upload(), storage=storage)
    media_id = media.id
    storage.fail_delete = True

    with pytest.raises(MediaCleanupError):
        await delete_media(session, media_id, storage=storage)

    pending = await session.get(Media, media_id)
    assert pending is not None
    assert pending.deletion_pending is True
    storage.fail_delete = False
    await delete_media(session, media_id, storage=storage)
    assert await session.get(Media, media_id) is None


@pytest.mark.asyncio
async def test_delete_database_failure_leaves_retryable_pending_row(
    session: AsyncSession,
) -> None:
    storage = FakeStorage()
    media = await upload_media(session, image_upload(), storage=storage)
    media_id = media.id
    commit_count = 0

    def fail_final_commit(_: AsyncSession) -> None:
        nonlocal commit_count
        commit_count += 1
        if commit_count == 2:
            raise SQLAlchemyError("simulated database failure")

    event.listen(session.sync_session, "before_commit", fail_final_commit)
    with pytest.raises(MediaPersistenceError):
        await delete_media(session, media_id, storage=storage)
    event.remove(session.sync_session, "before_commit", fail_final_commit)

    pending = await session.get(Media, media_id)
    assert pending is not None
    assert pending.deletion_pending is True
    assert storage.deleted == [pending.cloudinary_public_id]
    await delete_media(session, media_id, storage=storage)
    assert await session.get(Media, media_id) is None
