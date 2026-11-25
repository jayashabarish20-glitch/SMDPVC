"""Tests for chatbot latency features: the streaming endpoint and the validated
public-knowledge cache. Gemini generator behaviour is in test_gemini_integration.py."""
import asyncio
import json

import pytest
from sqlalchemy import delete, event, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content import Club, Sport
from app.routers import public_chat
from app.schemas.chat import ChatRequest
from app.services import chat_knowledge_service as knowledge
from app.services import chat_service
from app.services.gemini_service import GeminiUnavailableError
from tests.test_public_chat import FakeGenerator, make_request


@pytest.fixture(autouse=True)
def reset_state():
    public_chat.rate_limiter.reset()
    chat_service.sessions.clear()
    knowledge.invalidate_cache()
    yield


# ---- Streaming endpoint -----------------------------------------------------------

def parse_sse(raw: str) -> list[tuple[str, dict]]:
    events = []
    for block in raw.strip().split("\n\n"):
        lines = dict(line.split(": ", 1) for line in block.splitlines())
        events.append((lines["event"], json.loads(lines["data"])))
    return events


async def stream_chat(session, gen, message, session_id=None):
    response = await public_chat.public_chat_stream(
        ChatRequest(message=message, session_id=session_id), make_request(), session, gen)
    assert response.media_type == "text/event-stream"
    raw = "".join([chunk async for chunk in response.body_iterator])
    return parse_sse(raw)


async def stream_response(session, gen, message):
    return await public_chat.public_chat_stream(ChatRequest(message=message), make_request(), session, gen)


@pytest.mark.asyncio
async def test_stream_endpoint_event_order_and_history(session: AsyncSession) -> None:
    session.add(Sport(name="Football", description="Daily coaching."))
    await session.commit()
    events = await stream_chat(session, FakeGenerator("Football is offered."), "What sports are there?")
    kinds = [e for e, _ in events]
    assert kinds[0] == "meta" and kinds[-1] == "done" and "delta" in kinds
    meta = events[0][1]
    assert meta["language"] == "en" and meta["sources"][0]["url"] == "/higher-secondary#higher-sports"
    assert "".join(d["text"] for e, d in events if e == "delta") == "Football is offered."
    turns = list(chat_service.sessions.get(meta["session_id"])[1].turns)
    assert turns[-1] == ("assistant", "Football is offered.")


@pytest.mark.asyncio
async def test_stream_failure_before_first_token_is_real_http_503(session: AsyncSession) -> None:
    response = await stream_response(session, FakeGenerator(error=GeminiUnavailableError("high demand")),
                                     "What sports are there?")
    assert response.status_code == 503  # not a misleading 200
    body = json.loads(response.body)
    assert "temporarily unavailable" in body["detail"]
    assert list(chat_service.sessions._sessions.values())[0].turns.maxlen  # session exists, nothing stored
    assert all(not s.turns for s in chat_service.sessions._sessions.values())


class PartialThenFailGenerator(FakeGenerator):
    async def stream(self, system_instruction, prompt, stats=None):
        self.prompts.append(prompt)
        yield "Football is "
        raise __import__("app.services.gemini_service", fromlist=["x"]).GeminiStreamInterruptedError("cut")


@pytest.mark.asyncio
async def test_failure_after_text_keeps_partial_and_reports_error_event(session: AsyncSession) -> None:
    events = await stream_chat(session, PartialThenFailGenerator(), "What sports are there?")
    assert [e for e, _ in events] == ["meta", "delta", "error"]
    assert events[1][1]["text"] == "Football is "
    assert events[2][1]["partial"] is True and "interrupted" in events[2][1]["detail"]
    assert all(not s.turns for s in chat_service.sessions._sessions.values())  # half answer not stored


@pytest.mark.asyncio
async def test_stream_validation_happens_before_streaming(session: AsyncSession) -> None:
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc:
        await public_chat.public_chat_stream(ChatRequest(message="a" * 1001), make_request(), session, FakeGenerator())
    assert exc.value.status_code == 422
    with pytest.raises(HTTPException) as exc:
        await public_chat.public_chat_stream(ChatRequest(message="hi"), make_request(), session, None)
    assert exc.value.status_code == 503


# ---- Knowledge cache ----------------------------------------------------------------

class QueryCounter:
    def __init__(self, session: AsyncSession) -> None:
        self.n = 0
        self.engine = session.bind.sync_engine if hasattr(session.bind, "sync_engine") else session.bind

    def __enter__(self):
        event.listen(self.engine, "before_cursor_execute", self._count)
        return self

    def __exit__(self, *exc):
        event.remove(self.engine, "before_cursor_execute", self._count)

    def _count(self, *args, **kwargs):
        self.n += 1


async def titles(session):
    return [d.title for d in await knowledge.get_public_documents(session)]


@pytest.mark.asyncio
async def test_cache_hit_costs_one_query(session: AsyncSession) -> None:
    session.add(Club(name="Eco Club", description="Trees."))
    await session.commit()
    stats: dict = {}
    await knowledge.get_public_documents(session, stats)
    assert stats["cache"] == "miss"
    with QueryCounter(session) as qc:
        stats = {}
        docs = await knowledge.get_public_documents(session, stats)
    assert stats["cache"] == "hit" and qc.n == 1
    assert "Club: Eco Club" in [d.title for d in docs]


@pytest.mark.asyncio
async def test_cold_load_batches_content_records(session: AsyncSession) -> None:
    with QueryCounter(session) as qc:
        await knowledge.load_public_documents(session)
    assert qc.n <= 14  # was 39 before batching content-record reads


@pytest.mark.asyncio
async def test_orm_edit_is_visible_immediately(session: AsyncSession) -> None:
    club = Club(name="Eco Club", description="Trees.")
    session.add(club)
    await session.commit()
    club_id = club.id
    await titles(session)  # note: public reads expunge_all(), detaching `club`
    fresh = await session.get(Club, club_id)
    fresh.description = "Recycling drive."
    await session.commit()
    stats: dict = {}
    docs = await knowledge.get_public_documents(session, stats)
    assert stats["cache"] == "miss"
    assert any("Recycling drive." in d.text for d in docs)


@pytest.mark.asyncio
async def test_bulk_delete_and_unpublish_are_visible_immediately(session: AsyncSession) -> None:
    session.add_all([Club(name="Eco Club", description="x"), Sport(name="Chess", description="y")])
    await session.commit()
    assert {"Club: Eco Club", "Sport: Chess"} <= set(await titles(session))
    await session.execute(delete(Club).where(Club.name == "Eco Club"))
    await session.execute(update(Sport).where(Sport.name == "Chess").values(is_active=False))
    await session.commit()
    remaining = set(await titles(session))
    assert "Club: Eco Club" not in remaining and "Sport: Chess" not in remaining


@pytest.mark.asyncio
async def test_out_of_band_delete_detected_by_fingerprint(session: AsyncSession) -> None:
    session.add(Club(name="Eco Club", description="x"))
    await session.commit()
    await titles(session)
    # Raw SQL (e.g. another process) bypasses ORM events; the fingerprint must catch it.
    await session.execute(text("DELETE FROM clubs"))
    await session.commit()
    assert "Club: Eco Club" not in await titles(session)


@pytest.mark.asyncio
async def test_cache_disabled_with_zero_ttl(session: AsyncSession, monkeypatch) -> None:
    from app.config import get_settings
    monkeypatch.setattr(get_settings(), "chat_knowledge_cache_seconds", 0)
    stats: dict = {}
    await knowledge.get_public_documents(session, stats)
    await knowledge.get_public_documents(session, stats)
    assert stats["cache"] == "miss"
