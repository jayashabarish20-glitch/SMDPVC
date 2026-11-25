"""Google Gemini integration (official `google-genai` SDK), streaming-first.

Diagnosis 2026-11-25 (see chatbot report): the "(unavailable)" failures were real
HTTP 503 UNAVAILABLE ("model is currently experiencing high demand") responses from
Google, plus transport ReadTimeouts and per-model 429 RESOURCE_EXHAUSTED. Key, model
IDs and SDK usage were valid. This module therefore:

  * Classifies every failure precisely (HTTP code, API status, sanitized message, model,
    phase) and logs it as one structured line — never the API key or visitor text.
  * Retries only temporary errors (429, 5xx, timeouts, network) with limited exponential
    backoff that honours Google's RetryInfo/Retry-After guidance, and never retries
    permanent ones (400, 401/403, 404).
  * Hedges the first token: if the current model is slow, the next fallback model is
    started in parallel and whichever streams first wins.
  * Never restarts an answer. If a model fails after text was already delivered, another
    model CONTINUES the answer from where it stopped (overlap trimmed), so the visitor never
    sees text repeated. If nothing can continue it, the partial text is kept and
    GeminiStreamInterruptedError is raised.
"""
import asyncio
import logging
import random
import re
import time
from collections.abc import AsyncIterator
from typing import Any, Protocol

from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from app.config import get_settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------

class GeminiError(Exception):
    """Base error. `kind` is a short label; the other fields are sanitized diagnostics."""

    kind = "provider_error"
    retryable = False

    def __init__(
        self,
        message: str = "",
        *,
        http_status: int | None = None,
        api_status: str | None = None,
        model: str | None = None,
        retry_after: float | None = None,
    ) -> None:
        super().__init__(message or self.kind)
        self.message = message
        self.http_status = http_status
        self.api_status = api_status
        self.model = model
        self.retry_after = retry_after

    def describe(self) -> str:
        return (f"kind={self.kind} http={self.http_status} status={self.api_status} "
                f"retryable={self.retryable} msg={self.message!r}")


class GeminiNotConfiguredError(GeminiError):
    kind = "not_configured"


class GeminiBadRequestError(GeminiError):  # 400: permanent
    kind = "bad_request"


class GeminiAuthError(GeminiError):  # 401/403 or invalid key: permanent, same for every model
    kind = "auth_error"


class GeminiModelNotFoundError(GeminiError):  # 404: permanent for that model
    kind = "model_not_found"


class GeminiQuotaError(GeminiError):  # 429: temporary
    kind = "quota_exceeded"
    retryable = True


class GeminiUnavailableError(GeminiError):  # 500/502/503/504: temporary
    kind = "unavailable"
    retryable = True


class GeminiTimeoutError(GeminiError):  # no response in time: temporary
    kind = "timeout"
    retryable = True


class GeminiNetworkError(GeminiError):  # connection reset/refused, DNS…: temporary
    kind = "network"
    retryable = True


class GeminiEmptyResponseError(GeminiError):
    kind = "empty_response"
    retryable = True


class GeminiStreamInterruptedError(GeminiError):
    """Failed after part of the answer was delivered and no model could continue it."""

    kind = "interrupted"


class _ThinkingUnsupportedError(GeminiBadRequestError):
    kind = "thinking_unsupported"


_KEY_PATTERN = re.compile(r"AIza[0-9A-Za-z_\-]{20,}")


def _sanitize(text: str) -> str:
    return re.sub(r"\s+", " ", _KEY_PATTERN.sub("[redacted]", text or "")).strip()[:200]


def _retry_after(exc: genai_errors.APIError) -> float | None:
    """Seconds Google asks us to wait (RetryInfo.retryDelay or Retry-After header), if any."""
    try:
        error = exc.details.get("error", {}) if isinstance(exc.details, dict) else {}
        for item in error.get("details", []) or []:
            if isinstance(item, dict) and str(item.get("@type", "")).endswith("RetryInfo"):
                match = re.match(r"^([\d.]+)s$", str(item.get("retryDelay", "")))
                if match:
                    return float(match.group(1))
    except Exception:  # noqa: BLE001 - diagnostics must never raise
        pass
    try:
        header = exc.response.headers.get("retry-after") if exc.response is not None else None
        return float(header) if header else None
    except Exception:  # noqa: BLE001
        return None


def _map_api_error(exc: genai_errors.APIError, model: str | None = None) -> GeminiError:
    code = getattr(exc, "code", None)
    status = str(getattr(exc, "status", "") or "") or None
    message = _sanitize(str(getattr(exc, "message", "") or ""))
    info = {"http_status": code, "api_status": status, "model": model}
    upper = message.upper()
    if code in (401, 403) or "API_KEY" in upper or "API KEY" in upper:
        return GeminiAuthError(message, **info)
    if code == 429 or status == "RESOURCE_EXHAUSTED":
        return GeminiQuotaError(message, retry_after=_retry_after(exc), **info)
    if code == 404 or status == "NOT_FOUND":
        return GeminiModelNotFoundError(message, **info)
    if code == 400 and "thinking" in message.lower():
        return _ThinkingUnsupportedError(message, **info)
    if code == 400 or status == "INVALID_ARGUMENT":
        return GeminiBadRequestError(message, **info)
    if (code is not None and code >= 500) or status in ("UNAVAILABLE", "DEADLINE_EXCEEDED", "INTERNAL"):
        return GeminiUnavailableError(message, retry_after=_retry_after(exc), **info)
    return GeminiError(message, **info)


def _map_transport_error(exc: Exception, model: str | None = None) -> GeminiError:
    name = type(exc).__name__
    detail = _sanitize(f"{name}: {exc}")
    if "timeout" in name.lower():
        return GeminiTimeoutError(detail, model=model)
    return GeminiNetworkError(detail, model=model)


class TextGenerator(Protocol):
    def stream(
        self, system_instruction: str, prompt: str, stats: dict[str, Any] | None = None
    ) -> AsyncIterator[str]: ...

    async def generate(self, system_instruction: str, prompt: str, stats: dict[str, Any] | None = None) -> str: ...


_THINKING_LEVELS = {
    "minimal": types.ThinkingLevel.MINIMAL,
    "low": types.ThinkingLevel.LOW,
    "medium": types.ThinkingLevel.MEDIUM,
    "high": types.ThinkingLevel.HIGH,
}

CONTINUE_INSTRUCTION = (
    "<answer_so_far>\n{partial}\n</answer_so_far>\n"
    "The answer above was cut off part-way and has ALREADY been shown to the visitor. Continue it "
    "from exactly where it stops, in the same language and style, using only <school_data>. Do not "
    "repeat any of it, do not start over and do not greet. If it is already complete, reply with "
    "nothing more than a single full stop."
)


def _trim_overlap(previous: str, continuation: str) -> str:
    """Drop text at the start of `continuation` that repeats the end of `previous`."""
    tail = previous[-120:]
    for size in range(min(len(tail), len(continuation)), 3, -1):
        if continuation.startswith(tail[-size:]):
            return continuation[size:]
    return continuation


class _MidStreamFailure(Exception):
    def __init__(self, model: str, error: GeminiError) -> None:
        super().__init__(model)
        self.model = model
        self.error = error


class GeminiTextGenerator:
    _BACKOFF_BASE = 0.5              # seconds; doubles per retry (0.5s, 1s) with ±20% jitter
    _MAX_RETRIES_PER_MODEL = 2
    _MAX_HONOURED_RETRY_AFTER = 4.0  # longer server-requested waits: move on to the next model

    def __init__(
        self,
        api_key: str,
        model: str,
        fallback_models: str | list[str] | None,
        timeout_seconds: float,
        hedge_after_seconds: float = 4.0,
        thinking_level: str = "minimal",
    ) -> None:
        self._client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(timeout=int(timeout_seconds * 1000)),  # SDK-level retries stay off
        )
        fallbacks = [fallback_models] if isinstance(fallback_models, str) else list(fallback_models or [])
        self._models: list[str] = []
        for name in [model, *fallbacks]:
            if name and name not in self._models:
                self._models.append(name)
        self._timeout = timeout_seconds
        self._hedge_after = min(hedge_after_seconds, timeout_seconds)
        self._thinking = _THINKING_LEVELS.get(thinking_level)
        self._no_thinking_models: set[str] = set()  # models that rejected the thinking level

    @property
    def models(self) -> list[str]:
        return list(self._models)

    def _config(self, model: str, system_instruction: str) -> types.GenerateContentConfig:
        thinking = None
        if self._thinking is not None and model not in self._no_thinking_models:
            thinking = types.ThinkingConfig(thinking_level=self._thinking)
        return types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.3,
            max_output_tokens=1024,
            thinking_config=thinking,
        )

    async def _open_stream(self, model: str, system_instruction: str, prompt: str) -> AsyncIterator[Any]:
        """Low-level SDK stream (separate method so tests can replace it)."""
        return await self._client.aio.models.generate_content_stream(
            model=model, contents=prompt, config=self._config(model, system_instruction)
        )

    @staticmethod
    def _log_failure(error: GeminiError, model: str, phase: str, action: str) -> None:
        logger.warning("gemini_error model=%s phase=%s %s action=%s", model, phase, error.describe(), action)

    async def _attempt(
        self,
        model: str,
        system_instruction: str,
        prompt: str,
        queue: asyncio.Queue,
        delay: float = 0.0,
        allow_empty: bool = False,
    ) -> None:
        """Run one model; push (model, "chunk"|"done"|"error", payload) into the shared queue."""
        if delay:
            await asyncio.sleep(delay)
        sent_any = False
        for _ in range(2):  # second pass only if the model rejected the thinking level
            try:
                stream = await self._open_stream(model, system_instruction, prompt)
                async for chunk in stream:
                    text = getattr(chunk, "text", None)
                    if text:
                        sent_any = True
                        await queue.put((model, "chunk", text))
                if sent_any or allow_empty:
                    await queue.put((model, "done", None))
                else:
                    await queue.put((model, "error", GeminiEmptyResponseError("no text returned", model=model)))
                return
            except asyncio.CancelledError:
                raise
            except genai_errors.APIError as exc:
                error = _map_api_error(exc, model)
            except GeminiError as exc:
                error = exc
                error.model = error.model or model
            except Exception as exc:  # transport errors (httpx ReadTimeout, connection reset, …)
                error = _map_transport_error(exc, model)
            if isinstance(error, _ThinkingUnsupportedError) and not sent_any and model not in self._no_thinking_models:
                self._log_failure(error, model, "before_first_token", "retry_without_thinking")
                self._no_thinking_models.add(model)
                continue
            await queue.put((model, "error", error))
            return

    def _backoff(self, error: GeminiError, retries_done: int) -> float | None:
        """Delay before retrying the same model, or None if it must not be retried."""
        if not error.retryable or retries_done >= self._MAX_RETRIES_PER_MODEL:
            return None
        if error.retry_after is not None:
            return error.retry_after if error.retry_after <= self._MAX_HONOURED_RETRY_AFTER else None
        return self._BACKOFF_BASE * (2 ** retries_done) * (0.8 + 0.4 * random.random())

    async def stream(
        self, system_instruction: str, prompt: str, stats: dict[str, Any] | None = None
    ) -> AsyncIterator[str]:
        """Yield answer text chunks. Text already yielded is never repeated or withdrawn."""
        stats = stats if stats is not None else {}
        started = time.monotonic()
        emitted = ""
        failed_mid_stream: list[str] = []
        round_prompt, continuing = prompt, False
        try:
            for round_no in range(3):  # the answer + at most two continuations
                # A continuation prefers models that have not just failed mid-stream.
                models = [m for m in self._models if m not in failed_mid_stream] + failed_mid_stream
                first_chunk_of_round = True
                try:
                    async for chunk in self._stream_round(models, system_instruction, round_prompt, stats, continuing):
                        if continuing and first_chunk_of_round:
                            chunk = _trim_overlap(emitted, chunk)
                            if chunk.strip() == "." and emitted.rstrip().endswith((".", "!", "?", "।")):
                                chunk = ""  # model said the answer was already complete
                        first_chunk_of_round = False
                        if chunk:
                            emitted += chunk
                            yield chunk
                    return
                except _MidStreamFailure as failure:
                    failed_mid_stream = [m for m in failed_mid_stream if m != failure.model] + [failure.model]
                    stats["continuations"] = stats.get("continuations", 0) + 1
                    if round_no == 2:
                        self._log_failure(failure.error, failure.model, "mid_stream", "give_up_keep_partial")
                        raise GeminiStreamInterruptedError(
                            failure.error.message, http_status=failure.error.http_status,
                            api_status=failure.error.api_status, model=failure.model) from failure.error
                    self._log_failure(failure.error, failure.model, "mid_stream", "continue_on_next_model")
                    safe_partial = emitted.replace("<", "‹").replace(">", "›")
                    round_prompt = f"{prompt}\n\n{CONTINUE_INSTRUCTION.format(partial=safe_partial)}"
                    continuing = True
                except GeminiError as error:
                    if emitted:  # a continuation could not even start: keep the partial answer
                        raise GeminiStreamInterruptedError(
                            error.message, http_status=error.http_status,
                            api_status=error.api_status, model=error.model) from error
                    raise
        finally:
            stats["gemini_ms"] = int((time.monotonic() - started) * 1000)

    async def _stream_round(
        self, models: list[str], system_instruction: str, prompt: str, stats: dict[str, Any], allow_empty: bool
    ) -> AsyncIterator[str]:
        started = time.monotonic()
        queue: asyncio.Queue = asyncio.Queue()
        tasks: dict[str, asyncio.Task] = {}
        failed: set[str] = set()
        pending: list[tuple[str, float]] = [(m, 0.0) for m in models]  # (model, start delay)
        retries = {m: 0 for m in models}
        winner: str | None = None
        last_error: GeminiError = GeminiUnavailableError("no model produced an answer")

        def live() -> list[str]:
            return [m for m in tasks if m not in failed]

        def start_next() -> bool:
            if not pending:
                return False
            model, delay = pending.pop(0)
            failed.discard(model)
            tasks[model] = asyncio.create_task(
                self._attempt(model, system_instruction, prompt, queue, delay, allow_empty)
            )
            stats.setdefault("attempts", []).append(model)
            return True

        start_next()
        try:
            # Phase 1: first token (hedging the next model in if the current one is slow).
            while winner is None:
                if not live() and not start_next():
                    raise last_error
                elapsed = time.monotonic() - started
                if elapsed >= self._timeout:
                    raise GeminiTimeoutError(f"no first token within {self._timeout:.0f}s", model=",".join(tasks))
                wait = self._timeout - elapsed
                if pending:
                    wait = min(wait, max(0.0, self._hedge_after - elapsed))
                try:
                    model, kind, payload = await asyncio.wait_for(queue.get(), timeout=wait)
                except asyncio.TimeoutError:
                    if pending and start_next():
                        logger.info("gemini_hedge after=%.1fs starting=%s", self._hedge_after, stats["attempts"][-1])
                    continue
                if model in failed:
                    continue
                if kind in ("chunk", "done"):
                    winner = model
                    stats["model"] = model
                    stats.setdefault("ttft_ms", int((time.monotonic() - started) * 1000))
                    for other, task in tasks.items():
                        if other != winner:
                            task.cancel()
                    if kind == "done":  # empty continuation: the answer was already complete
                        return
                    yield payload
                    break
                error: GeminiError = payload
                failed.add(model)
                last_error = error
                if isinstance(error, GeminiAuthError):
                    self._log_failure(error, model, "before_first_token", "stop_all_models")
                    raise error  # same key for every model: no point trying another
                remaining = self._timeout - (time.monotonic() - started)
                delay = self._backoff(error, retries[model])
                if delay is not None and remaining > delay + 1.0:
                    retries[model] += 1
                    if live():
                        pending.append((model, delay))   # another model is running: retry later
                    else:
                        pending.insert(0, (model, delay))
                    self._log_failure(error, model, "before_first_token", f"retry_in_{delay:.1f}s")
                else:
                    self._log_failure(error, model, "before_first_token", "next_model" if pending else "give_up")
                if not live():
                    start_next()

            # Phase 2: forward the winner's remaining chunks.
            while True:
                try:
                    model, kind, payload = await asyncio.wait_for(queue.get(), timeout=self._timeout)
                except asyncio.TimeoutError as exc:
                    raise _MidStreamFailure(winner, GeminiTimeoutError(
                        f"no chunk for {self._timeout:.0f}s", model=winner)) from exc
                if model != winner:
                    continue
                if kind == "chunk":
                    yield payload
                elif kind == "done":
                    break
                else:
                    raise _MidStreamFailure(winner, payload)
        finally:
            for task in tasks.values():
                task.cancel()

    async def generate(self, system_instruction: str, prompt: str, stats: dict[str, Any] | None = None) -> str:
        text = "".join([chunk async for chunk in self.stream(system_instruction, prompt, stats)]).strip()
        if not text:
            raise GeminiEmptyResponseError("no text returned")
        return text


_generator: TextGenerator | None = None


def get_text_generator() -> TextGenerator:
    """Lazily create the shared generator. Raises if GEMINI_API_KEY is missing."""
    global _generator
    if _generator is None:
        settings = get_settings()
        key = settings.gemini_api_key.get_secret_value().strip() if settings.gemini_api_key else ""
        if not key:
            logger.error("Chatbot disabled: GEMINI_API_KEY is not configured")
            raise GeminiNotConfiguredError("GEMINI_API_KEY is not set")
        _generator = GeminiTextGenerator(
            api_key=key,
            model=settings.gemini_model,
            fallback_models=settings.gemini_fallback_model_list,
            timeout_seconds=settings.gemini_timeout_seconds,
            hedge_after_seconds=settings.gemini_hedge_after_seconds,
            thinking_level=settings.gemini_thinking_level,
        )
    return _generator
