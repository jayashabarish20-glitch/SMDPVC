from uuid import uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.models.content import ContentItem, LeadershipProfile
from app.models.media import Media
from app.routers import admin_content_items as admin
from app.routers import admin_leadership as leadership
from app.routers.public import list_public_content_items
from app.schemas.content import (
    ContentItemCreate,
    ContentItemReorder,
    ContentItemUpdate,
    LeadershipProfileCreateNew,
    ReorderRequest,
)
from app.services import content_item_service as service
from app.services import media_service


class FakeStorage:
    def __init__(self) -> None:
        self.deleted: list[str] = []

    async def delete(self, public_id: str) -> None:
        self.deleted.append(public_id)


def make_media(name: str = "a") -> Media:
    return Media(
        cloudinary_public_id=f"school/{name}",
        image_url=f"https://res.cloudinary.com/demo/image/upload/school/{name}.jpg",
        original_filename=f"{name}.jpg",
        file_format="jpg",
        file_size=10,
        width=4,
        height=3,
        alt_text=name,
    )


async def create(session, section="learning", page="nursery", title="T", **kw):
    return await admin.create_content_item(
        ContentItemCreate(page_slug=page, section_key=section, title=title, **kw),
        None,
        session,
    )


def test_routes_registered() -> None:
    paths = app.openapi()["paths"]
    assert "/api/public/content-items" in paths
    assert "/api/admin/content-items" in paths
    assert "/api/admin/content-items/reorder" in paths
    assert "/api/admin/leadership-profiles/reorder" in paths


def test_admin_routes_require_authentication() -> None:
    from fastapi.testclient import TestClient

    client = TestClient(app, raise_server_exceptions=False)
    for method, url in [
        ("get", "/api/admin/content-items"),
        ("post", "/api/admin/content-items"),
        ("patch", f"/api/admin/content-items/{uuid4()}"),
        ("delete", f"/api/admin/content-items/{uuid4()}"),
        ("post", "/api/admin/content-items/reorder"),
        ("post", "/api/admin/leadership-profiles"),
        ("delete", "/api/admin/leadership-profiles/x"),
        ("post", "/api/admin/leadership-profiles/reorder"),
    ]:
        assert getattr(client, method)(url).status_code == 401, (method, url)


@pytest.mark.asyncio
async def test_create_assigns_sequential_order_per_section(session: AsyncSession):
    a = await create(session, title="A")
    b = await create(session, title="B")
    other = await create(session, section="extracurricular", title="C")
    assert (a.display_order, b.display_order, other.display_order) == (0, 1, 0)


@pytest.mark.asyncio
async def test_unknown_section_rejected(session: AsyncSession):
    with pytest.raises(HTTPException) as exc:
        await create(session, page="higher-secondary", section="infrastructure")
    assert exc.value.status_code == 422
    with pytest.raises(HTTPException):
        await create(session, page="nursery", section="infrastructure")


@pytest.mark.asyncio
async def test_unknown_media_rejected(session: AsyncSession):
    with pytest.raises(HTTPException) as exc:
        await create(session, media_id=uuid4())
    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_update_and_hide(session: AsyncSession):
    item = await create(session, title="Old")
    updated = await admin.update_content_item(
        item.id, ContentItemUpdate(title="New", is_active=False), None, session
    )
    assert updated.title == "New" and updated.is_active is False
    assert await list_public_content_items(session, "nursery", "learning") == []
    assert len(await admin.list_content_items(None, session, "nursery", "learning")) == 1


@pytest.mark.asyncio
async def test_partial_update_keeps_media(session: AsyncSession):
    media = make_media()
    session.add(media)
    await session.commit()
    item = await create(session, media_id=media.id)
    updated = await admin.update_content_item(
        item.id, ContentItemUpdate(title="Renamed"), None, session
    )
    assert updated.media_id == media.id


@pytest.mark.asyncio
async def test_reorder(session: AsyncSession):
    a, b, c = [await create(session, title=t) for t in "ABC"]
    result = await admin.reorder_content_items(
        ContentItemReorder(
            page_slug="nursery", section_key="learning", ids=[c.id, a.id, b.id]
        ),
        None,
        session,
    )
    assert [i.title for i in result] == ["C", "A", "B"]
    public = await list_public_content_items(session, "nursery", "learning")
    assert [i.title for i in public] == ["C", "A", "B"]


@pytest.mark.asyncio
async def test_reorder_requires_complete_unique_list(session: AsyncSession):
    a = await create(session, title="A")
    await create(session, title="B")
    for ids in ([a.id], [a.id, a.id]):
        with pytest.raises(HTTPException) as exc:
            await admin.reorder_content_items(
                ContentItemReorder(
                    page_slug="nursery", section_key="learning", ids=ids
                ),
                None,
                session,
            )
        assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_delete_removes_item_and_media(session: AsyncSession, monkeypatch):
    storage = FakeStorage()
    monkeypatch.setattr(media_service, "CloudinaryStorage", lambda: storage)
    media = make_media("gone")
    session.add(media)
    await session.commit()
    item = await create(session, media_id=media.id)

    await admin.delete_content_item(item.id, None, session)

    assert await session.scalar(select(ContentItem)) is None
    assert await session.scalar(select(Media)) is None
    assert storage.deleted == ["school/gone"]


@pytest.mark.asyncio
async def test_media_in_use_by_item_cannot_be_deleted(session: AsyncSession):
    media = make_media("busy")
    session.add(media)
    await session.commit()
    await create(session, media_id=media.id)
    with pytest.raises(media_service.MediaInUseError):
        await media_service.delete_media(session, media.id, storage=FakeStorage())


@pytest.mark.asyncio
async def test_public_hides_pending_deletion_media(session: AsyncSession):
    media = make_media("pending")
    media.deletion_pending = True
    session.add(media)
    await session.commit()
    await create(session, media_id=media.id)
    public = await list_public_content_items(session, "nursery", "learning")
    assert len(public) == 1 and public[0].media is None


@pytest.mark.asyncio
async def test_leadership_create_reorder_delete(session: AsyncSession, monkeypatch):
    storage = FakeStorage()
    monkeypatch.setattr(media_service, "CloudinaryStorage", lambda: storage)
    session.add(
        LeadershipProfile(
            profile_key="management", name="M", category="Management", display_order=1
        )
    )
    await session.commit()

    new_one = await leadership.create_leadership_profile(
        LeadershipProfileCreateNew(name="Fourth", designation="Dean"), None, session
    )
    new_two = await leadership.create_leadership_profile(
        LeadershipProfileCreateNew(name="Fifth"), None, session
    )
    assert new_one.profile_key.startswith("leader-")
    assert new_one.display_order == 2 and new_two.display_order == 3

    existing = await session.scalar(
        select(LeadershipProfile).where(LeadershipProfile.profile_key == "management")
    )
    result = await leadership.reorder_leadership_profiles(
        ReorderRequest(ids=[new_two.id, existing.id, new_one.id]), None, session
    )
    assert [p.name for p in result] == ["Fifth", "M", "Fourth"]

    with pytest.raises(HTTPException) as exc:
        await leadership.reorder_leadership_profiles(
            ReorderRequest(ids=[new_two.id]), None, session
        )
    assert exc.value.status_code == 422

    await leadership.delete_leadership_profile(new_one.profile_key, None, session)
    remaining = await leadership.list_leadership_profiles(None, session)
    assert [p.name for p in remaining] == ["Fifth", "M"]
    with pytest.raises(HTTPException) as exc:
        await leadership.delete_leadership_profile("missing", None, session)
    assert exc.value.status_code == 404
