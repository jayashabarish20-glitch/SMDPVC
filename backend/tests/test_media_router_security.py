import pytest
from fastapi import HTTPException
from fastapi.routing import APIRoute

from app.dependencies import require_admin
from app.main import app
from app.routers.admin_leadership import router as admin_leadership_router
from app.routers.media import router as media_router


def test_media_write_router_is_mounted_on_application() -> None:
    application_paths = set(app.openapi()["paths"])
    assert "/api/media/upload" in application_paths
    assert "/api/media/{media_id}" in application_paths
    assert "/api/public/photos" in application_paths
    assert {route.path for route in media_router.routes} == {
        "/upload",
        "/{media_id}",
    }


def test_all_media_write_routes_require_admin_dependency() -> None:
    for route in media_router.routes:
        assert isinstance(route, APIRoute)
        assert any(
            dependency.call is require_admin
            for dependency in route.dependant.dependencies
        )


def test_leadership_admin_routes_require_admin_dependency() -> None:
    for route in admin_leadership_router.routes:
        assert isinstance(route, APIRoute)
        assert any(
            dependency.call is require_admin
            for dependency in route.dependant.dependencies
        )


@pytest.mark.asyncio
async def test_auth_dependency_rejects_missing_authorization() -> None:
    with pytest.raises(HTTPException) as error:
        await require_admin()
    assert error.value.status_code == 401
