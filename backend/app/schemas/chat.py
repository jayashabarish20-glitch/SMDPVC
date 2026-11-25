from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.services.chat_language import ReplyLanguage, RequestLanguage

# Hard ceiling; the configurable CHAT_MAX_MESSAGE_CHARS (<= this) is enforced in the router.
ABSOLUTE_MAX_MESSAGE_CHARS = 5000


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: str = Field(..., max_length=ABSOLUTE_MAX_MESSAGE_CHARS)
    language: RequestLanguage = "auto"
    session_id: str | None = Field(default=None, pattern=r"^[A-Za-z0-9_-]{8,64}$")

    @field_validator("message")
    @classmethod
    def _not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("message must not be empty")
        return value


class ChatSource(BaseModel):
    title: str
    url: str


class ChatResponse(BaseModel):
    reply: str
    language: ReplyLanguage
    sources: list[ChatSource]
    session_id: str
