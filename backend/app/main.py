import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.config import get_settings
from app.database import engine
from app.database_init import initialize_database
from app.routers.admin_auth import router as admin_auth_router
from app.routers.admin_about_sections import router as admin_about_sections_router
from app.routers.admin_content_items import router as admin_content_items_router
from app.routers.admin_leadership import router as admin_leadership_router
from app.routers.admin_photos import router as admin_photos_router
from app.routers.admin_toppers import router as admin_toppers_router
from app.routers.admin_achievements import router as admin_achievements_router
from app.routers.admin_alumni import router as admin_alumni_router
from app.routers.admin_sports import router as admin_sports_router
from app.routers.admin_sports_achievements import router as admin_sports_achievements_router
from app.routers.admin_academic_information import router as admin_academic_information_router
from app.routers.admin_clubs import router as admin_clubs_router
from app.routers.health import router as health_router
from app.routers.media import router as media_router
from app.routers.admin_content_records import router as admin_content_records_router
from app.routers.public import router as public_router
from app.routers.public_chat import router as public_chat_router
from app.services.admin_bootstrap import bootstrap_admin_user

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    await initialize_database()
    await bootstrap_admin_user(settings.admin_email, settings.admin_password)
    yield
    await engine.dispose()


app = FastAPI(
    title="SMDPVC API",
    description="Backend API for the SMDPVC school website.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    logger.info("Request validation failed for %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=422,
        content={"detail": jsonable_encoder(exc.errors())},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    logger.exception("Unhandled error while handling %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


app.include_router(health_router, prefix="/api")
app.include_router(admin_auth_router, prefix="/api")
app.include_router(admin_leadership_router, prefix="/api/admin")
app.include_router(admin_content_items_router, prefix="/api/admin")
app.include_router(admin_about_sections_router, prefix="/api/admin")
app.include_router(admin_toppers_router, prefix="/api/admin")
app.include_router(admin_achievements_router, prefix="/api/admin")
app.include_router(admin_alumni_router, prefix="/api/admin")
app.include_router(admin_sports_router, prefix="/api/admin")
app.include_router(admin_sports_achievements_router, prefix="/api/admin")
app.include_router(admin_academic_information_router, prefix="/api/admin")
app.include_router(admin_clubs_router, prefix="/api/admin")
app.include_router(admin_content_records_router, prefix="/api/admin")
app.include_router(admin_photos_router, prefix="/api/admin")
app.include_router(media_router, prefix="/api/media")
app.include_router(public_router, prefix="/api")
app.include_router(public_chat_router, prefix="/api")

# Temporary: Mount local uploads directory for topper images
# This will be removed when switching back to Cloudinary
uploads_dir = Path(__file__).resolve().parents[1] / "uploads"
if uploads_dir.exists():
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
