from typing import Annotated
from uuid import UUID

from pydantic import ConfigDict, Field, HttpUrl

from app.schemas.base import EntityRead, Schema


class MediaCreate(Schema):
    cloudinary_public_id: Annotated[str, Field(min_length=1, max_length=255)]
    image_url: HttpUrl
    original_filename: Annotated[str, Field(min_length=1, max_length=255)]
    file_format: Annotated[str, Field(min_length=2, max_length=16)]
    file_size: Annotated[int, Field(gt=0)]
    width: Annotated[int, Field(gt=0)] | None = None
    height: Annotated[int, Field(gt=0)] | None = None
    alt_text: Annotated[str, Field(max_length=500)] = ""


class MediaUpdate(Schema):
    cloudinary_public_id: Annotated[str, Field(min_length=1, max_length=255)] | None = None
    image_url: HttpUrl | None = None
    original_filename: Annotated[str, Field(min_length=1, max_length=255)] | None = None
    file_format: Annotated[str, Field(min_length=2, max_length=16)] | None = None
    file_size: Annotated[int, Field(gt=0)] | None = None
    width: Annotated[int, Field(gt=0)] | None = None
    height: Annotated[int, Field(gt=0)] | None = None
    alt_text: Annotated[str, Field(max_length=500)] | None = None


class MediaRead(EntityRead):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "id": "uuid",
                "cloudinary_public_id": "public_id",
                "imageUrl": "http://example.com/image.jpg",
                "original_filename": "image.jpg",
                "file_format": "jpg",
                "file_size": 1024,
                "width": 100,
                "height": 100,
                "alt_text": "Description",
                "resource_type": "image",
            }
        },
    )

    cloudinary_public_id: str
    image_url: Annotated[HttpUrl, Field(serialization_alias="imageUrl")]
    original_filename: str
    file_format: str
    file_size: int
    width: int | None = None
    height: int | None = None
    alt_text: str
    resource_type: str = "image"


class PhotoConfigurationCreate(Schema):
    config_key: Annotated[str, Field(min_length=1, max_length=160)]
    media_id: UUID
    display_order: Annotated[int, Field(ge=0)] = 0


class PhotoConfigurationUpdate(Schema):
    config_key: Annotated[str, Field(min_length=1, max_length=160)] | None = None
    media_id: UUID | None = None
    display_order: Annotated[int, Field(ge=0)] | None = None


class PhotoConfigurationRead(EntityRead):
    config_key: str
    media_id: UUID
    display_order: int
    media: MediaRead


__all__ = [
    "MediaCreate",
    "MediaRead",
    "MediaUpdate",
    "PhotoConfigurationCreate",
    "PhotoConfigurationRead",
    "PhotoConfigurationUpdate",
]
