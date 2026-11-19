import json
from typing import Annotated, Any
from uuid import UUID

from pydantic import Field, field_validator

from app.schemas.base import EntityRead, Schema
from app.schemas.media import MediaRead

RECORD_KEY_PATTERN = r"^[a-z0-9][a-z0-9._-]{0,159}$"
MAX_PAYLOAD_BYTES = 200_000


class ContentRecordMediaInput(Schema):
    media_id: UUID
    role: Annotated[str, Field(max_length=80)] = ""
    position: Annotated[int, Field(ge=0)] = 0


class ContentRecordUpsert(Schema):
    payload: dict[str, Any] = Field(default_factory=dict)
    media: list[ContentRecordMediaInput] = Field(default_factory=list, max_length=200)

    @field_validator("payload")
    @classmethod
    def _limit_payload_size(cls, value: dict[str, Any]) -> dict[str, Any]:
        if len(json.dumps(value, ensure_ascii=False).encode("utf-8")) > MAX_PAYLOAD_BYTES:
            raise ValueError(f"payload exceeds {MAX_PAYLOAD_BYTES} bytes")
        return value


class ContentRecordMediaRead(Schema):
    media_id: UUID
    role: str
    position: int
    media: MediaRead


class ContentRecordRead(EntityRead):
    record_key: str
    payload: dict[str, Any]
    media: list[ContentRecordMediaRead] = Field(validation_alias="media_links")

    @field_validator("payload", mode="before")
    @classmethod
    def _decode_payload(cls, value: Any) -> Any:
        if isinstance(value, str):
            return json.loads(value)
        return value
