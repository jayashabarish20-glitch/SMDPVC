"""Chat orchestration: language -> retrieval -> prompt -> Gemini -> response.

Session context is kept IN MEMORY only (no database, nothing permanent): the last
few turns per session, expiring after inactivity. Visitor message text is never logged.
"""
import logging
import secrets
import time
from collections import OrderedDict, deque
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.chat import ChatResponse, ChatSource
from app.services import chat_knowledge_service as knowledge
from app.services.chat_language import INTERRUPTED_REPLIES, UNAVAILABLE_REPLIES, RequestLanguage, resolve_language
from app.services.chat_prompt import SYSTEM_INSTRUCTION, build_prompt
from app.services.gemini_service import GeminiEmptyResponseError, GeminiError, TextGenerator

logger = logging.getLogger(__name__)

HISTORY_TURNS = 6           # messages kept (3 user + 3 assistant)
SESSION_TTL_SECONDS = 30 * 60
MAX_SESSIONS = 2000
MAX_HISTORY_CHARS = 600     # per stored message
MAX_SOURCES = 3


@dataclass
class _Session:
    turns: deque = field(default_factory=lambda: deque(maxlen=HISTORY_TURNS))
    touched: float = field(default_factory=time.monotonic)


class SessionStore:
    def __init__(self, ttl: float = SESSION_TTL_SECONDS, max_sessions: int = MAX_SESSIONS) -> None:
        self._ttl, self._max = ttl, max_sessions
        self._sessions: OrderedDict[str, _Session] = OrderedDict()

    def _prune(self) -> None:
        now = time.monotonic()
        for key in [k for k, s in self._sessions.items() if now - s.touched > self._ttl]:
            del self._sessions[key]
        while len(self._sessions) > self._max:
            self._sessions.popitem(last=False)

    def get(self, session_id: str | None) -> tuple[str, _Session]:
        self._prune()
        if session_id and session_id in self._sessions:
            session = self._sessions[session_id]
            self._sessions.move_to_end(session_id)
        else:
            # Unknown/expired ids get a fresh server-generated id (clients cannot pick ids).
            session_id, session = secrets.token_urlsafe(18), _Session()
            self._sessions[session_id] = session
        session.touched = time.monotonic()
        return session_id, session

    def clear(self) -> None:
        self._sessions.clear()


class RateLimiter:
    """Simple in-memory sliding window per client key."""

    def __init__(self, limit: int, window_seconds: float = 60.0) -> None:
        self.limit, self.window = limit, window_seconds
        self._hits: dict[str, deque] = {}

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        hits = self._hits.setdefault(key, deque())
        while hits and now - hits[0] > self.window:
            hits.popleft()
        if len(hits) >= self.limit:
            return False
        hits.append(now)
        if len(self._hits) > 10_000:  # bound memory
            for k in [k for k, v in self._hits.items() if not v or now - v[-1] > self.window]:
                del self._hits[k]
        return True

    def reset(self) -> None:
        self._hits.clear()


sessions = SessionStore()


def _sources(docs: list[knowledge.KnowledgeDoc]) -> list[ChatSource]:
    out: list[ChatSource] = []
    for doc in docs:
        if doc.url not in {s.url for s in out}:
            out.append(ChatSource(title=doc.source or doc.title, url=doc.url))
        if len(out) >= MAX_SOURCES:
            break
    return out


@dataclass
class _Prepared:
    language: str
    session_id: str
    chat_session: _Session
    prompt: str
    sources: list[ChatSource]
    stats: dict[str, Any]
    started: float


async def _prepare(
    session: AsyncSession,
    message: str,
    requested_language: RequestLanguage,
    session_id: str | None,
) -> _Prepared:
    started = time.perf_counter()
    stats: dict[str, Any] = {}
    language = resolve_language(requested_language, message)
    session_id, chat_session = sessions.get(session_id)
    history = list(chat_session.turns)
    previous_user = next((text for role, text in reversed(history) if role == "user"), None)

    t0 = time.perf_counter()
    docs = await knowledge.get_public_documents(session, stats)
    t1 = time.perf_counter()
    relevant = knowledge.retrieve(docs, message, previous_user)
    t2 = time.perf_counter()
    missing = knowledge.missing_topics(docs, message)
    prompt = build_prompt(message, language, relevant, history, knowledge.topic_catalog(docs), missing)
    t3 = time.perf_counter()
    stats.update(
        db_ms=round((t1 - t0) * 1000, 1),
        retrieve_ms=round((t2 - t1) * 1000, 2),
        prompt_ms=round((t3 - t2) * 1000, 2),
        prompt_chars=len(prompt),
        docs=len(relevant),
        history=len(history),
    )
    return _Prepared(language, session_id, chat_session, prompt, _sources(relevant), stats, started)


def _commit(prepared: _Prepared, message: str, reply: str) -> None:
    prepared.chat_session.turns.append(("user", message[:MAX_HISTORY_CHARS]))
    prepared.chat_session.turns.append(("assistant", reply[:MAX_HISTORY_CHARS]))


def _log(prepared: _Prepared, mode: str, outcome: str) -> None:
    """One structured timing line per request. Never includes visitor text or secrets."""
    s = prepared.stats
    logger.info(
        "chat_timing mode=%s outcome=%s lang=%s cache=%s docs=%s history=%s prompt_chars=%s "
        "db_ms=%s retrieve_ms=%s prompt_ms=%s model=%s attempts=%s continuations=%s error=%s ttft_ms=%s gemini_ms=%s "
        "total_ms=%d",
        mode, outcome, prepared.language, s.get("cache"), s.get("docs"), s.get("history"), s.get("prompt_chars"),
        s.get("db_ms"), s.get("retrieve_ms"), s.get("prompt_ms"), s.get("model"),
        ",".join(s.get("attempts", [])), s.get("continuations", 0), s.get("error"), s.get("ttft_ms"), s.get("gemini_ms"),
        (time.perf_counter() - prepared.started) * 1000,
    )


async def answer(
    session: AsyncSession,
    generator: TextGenerator,
    message: str,
    requested_language: RequestLanguage,
    session_id: str | None,
) -> ChatResponse:
    prepared = await _prepare(session, message, requested_language, session_id)
    try:
        reply = await generator.generate(SYSTEM_INSTRUCTION, prepared.prompt, prepared.stats)
    except GeminiError as exc:
        prepared.stats["error"] = f"{exc.kind}:{exc.http_status}:{exc.api_status}"
        _log(prepared, "json", exc.kind)
        raise
    _commit(prepared, message, reply)
    _log(prepared, "json", "ok")
    return ChatResponse(reply=reply, language=prepared.language, sources=prepared.sources, session_id=prepared.session_id)


async def answer_stream(
    session: AsyncSession,
    generator: TextGenerator,
    message: str,
    requested_language: RequestLanguage,
    session_id: str | None,
) -> AsyncIterator[tuple[str, dict[str, Any]]]:
    """Yield (event, data): one "meta", then "delta" chunks, then "done" or "error".

    Text already sent is never withdrawn: if the provider fails part-way, the generator
    continues the answer on another model; if that is impossible, "error" has partial=True.

    Conversation history is stored only when the answer completes, so an interrupted
    stream never leaves a half answer in the follow-up context.
    """
    prepared = await _prepare(session, message, requested_language, session_id)
    yield "meta", {
        "language": prepared.language,
        "session_id": prepared.session_id,
        "sources": [s.model_dump() for s in prepared.sources],
    }
    parts: list[str] = []
    outcome = "cancelled"
    try:
        async for chunk in generator.stream(SYSTEM_INSTRUCTION, prepared.prompt, prepared.stats):
            parts.append(chunk)
            yield "delta", {"text": chunk}
        reply = "".join(parts).strip()
        if not reply:
            raise GeminiEmptyResponseError("no text returned")
        _commit(prepared, message, reply)
        outcome = "ok"
        yield "done", {}
    except GeminiError as exc:
        outcome = exc.kind
        prepared.stats["error"] = f"{exc.kind}:{exc.http_status}:{exc.api_status}"
        yield "error", {
            "detail": UNAVAILABLE_REPLIES[prepared.language] if not parts else INTERRUPTED_REPLIES[prepared.language],
            "partial": bool(parts),
        }
    finally:
        _log(prepared, "stream", outcome)
