"""Public AI chatbot endpoint: POST /api/public/chat

Read-only: answers from published public content. It has no access to admin
operations, and never returns configuration, keys, or database internals.
"""
import ipaddress
import json
import logging
from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse, Response, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services import chat_service
from app.services.chat_language import UNAVAILABLE_REPLIES, resolve_language
from app.services.gemini_service import (
    GeminiError,
    GeminiNotConfiguredError,
    TextGenerator,
    get_text_generator,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/public", tags=["public-chat"])
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]

rate_limiter = chat_service.RateLimiter(get_settings().chat_rate_limit_per_minute)


def chat_generator() -> TextGenerator | None:
    """Dependency (overridable in tests). None means the chatbot is not configured."""
    try:
        return get_text_generator()
    except GeminiNotConfiguredError:
        return None


def client_key(request: Request) -> str:
    """Client IP. X-Forwarded-For is trusted only when the direct peer is a local/private
    proxy (e.g. the site's Node server), so public clients cannot spoof their bucket."""
    peer = request.client.host if request.client else "unknown"
    forwarded = request.headers.get("x-forwarded-for")
    try:
        trusted_peer = ipaddress.ip_address(peer).is_private or ipaddress.ip_address(peer).is_loopback
    except ValueError:
        trusted_peer = False
    if forwarded and trusted_peer:
        return forwarded.split(",")[0].strip()[:64] or peer
    return peer


def _check_request(data: ChatRequest, request: Request, generator: TextGenerator | None) -> None:
    """Shared validation for both endpoints (runs before any work or streaming starts)."""
    if not rate_limiter.allow(client_key(request)):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many messages. Please wait a minute and try again.",
            headers={"Retry-After": "60"},
        )
    max_chars = get_settings().chat_max_message_chars
    if len(data.message) > max_chars:
        raise HTTPException(
            status_code=422,
            detail=f"Message is too long. Please keep it under {max_chars} characters.",
        )
    if generator is None:
        language = resolve_language(data.language, data.message)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=UNAVAILABLE_REPLIES[language])


@router.post("/chat", response_model=ChatResponse)
async def public_chat(
    data: ChatRequest,
    request: Request,
    session: DatabaseSession,
    generator: Annotated[TextGenerator | None, Depends(chat_generator)],
) -> ChatResponse:
    _check_request(data, request, generator)
    try:
        return await chat_service.answer(session, generator, data.message, data.language, data.session_id)
    except GeminiError as exc:
        language = resolve_language(data.language, data.message)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=UNAVAILABLE_REPLIES[language]) from exc


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.post("/chat/stream")
async def public_chat_stream(
    data: ChatRequest,
    request: Request,
    session: DatabaseSession,
    generator: Annotated[TextGenerator | None, Depends(chat_generator)],
) -> Response:
    """Server-Sent Events version of /chat: `meta`, then `delta` chunks, then `done` or `error`.

    HTTP 200 is only sent once Gemini has produced its first token. If every model fails
    before that, the response is a real HTTP 503 (friendly, localized `detail`), so a 200
    always means generation actually started. Failures after text was sent arrive as an
    SSE `error` event with `partial: true` (the text already shown is kept).
    """
    _check_request(data, request, generator)
    language = resolve_language(data.language, data.message)
    stream = chat_service.answer_stream(session, generator, data.message, data.language, data.session_id)

    # Pull events until the first text chunk (or a terminal event) before choosing the status.
    prefetched: list[tuple[str, dict]] = []
    try:
        async for event, payload in stream:
            prefetched.append((event, payload))
            if event in ("delta", "done", "error"):
                break
    except Exception:  # noqa: BLE001 - never leak internals
        logger.exception("Chat stream failed before the first token")
        await stream.aclose()
        return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content={"detail": UNAVAILABLE_REPLIES[language]})
    last_event, last_payload = prefetched[-1] if prefetched else ("error", {"partial": False})
    if last_event == "error" and not last_payload.get("partial"):
        await stream.aclose()
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"detail": last_payload.get("detail", UNAVAILABLE_REPLIES[language])},
        )

    async def events() -> AsyncIterator[str]:
        try:
            for event, payload in prefetched:
                yield _sse(event, payload)
            if last_event in ("done", "error"):
                return
            async for event, payload in stream:
                yield _sse(event, payload)
        except Exception:  # noqa: BLE001 - never leak internals into the stream
            logger.exception("Chat stream failed unexpectedly")
            yield _sse("error", {"detail": UNAVAILABLE_REPLIES[language], "partial": True})
        finally:
            await stream.aclose()

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"},
    )
