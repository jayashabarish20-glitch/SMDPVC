import pytest
from fastapi import HTTPException
from fastapi.routing import APIRoute

from app.dependencies import require_admin
from app.main import app
from app.routers.media import router as media_router


def test_media_write_router_is_not_mounted_on_application() -> None:
    application_paths = set(app.openapi()["paths"])
    assert not any(path.startswith("/api/media") for path in application_paths)
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


@pytest.mark.asyncio
async def test_auth_dependency_fails_closed_before_phase_five() -> None:
    with pytest.raises(HTTPException) as error:
        await require_admin()
    assert error.value.status_code == 503
