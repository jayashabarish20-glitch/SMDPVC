/** Public chatbot API client (POST /api/public/chat via the existing /api proxy). */

export type ChatLanguage = "auto" | "en" | "ta" | "tanglish";
export type ReplyLanguage = Exclude<ChatLanguage, "auto">;

export interface ChatSource {
  title: string;
  url: string;
}

export interface ChatReply {
  reply: string;
  language: ReplyLanguage;
  sources: ChatSource[];
  session_id: string;
}

const CHAT_TIMEOUT_MS = 45_000;

function errorDetail(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && typeof detail[0]?.msg === "string") {
    return String(detail[0].msg).replace(/^Value error, /, "");
  }
  if (status === 429) return "Too many messages. Please wait a minute and try again.";
  return "The assistant could not answer right now. Please try again.";
}

export interface StreamMeta {
  language: ReplyLanguage;
  session_id: string;
  sources: ChatSource[];
}

export interface StreamHandlers {
  onMeta?: (meta: StreamMeta) => void;
  /** Called with the full answer text so far (already accumulated). */
  onText?: (text: string) => void;
}

/** Error that carries any answer text received before the failure. */
export class ChatStreamError extends Error {
  readonly partialText: string;
  constructor(message: string, partialText: string) {
    super(message);
    this.partialText = partialText;
  }
}

let requestCounter = 0;

/**
 * Streaming chat over Server-Sent Events (POST /api/public/chat/stream).
 * Records performance measures `chat:ttfb`, `chat:first-token`, `chat:total` (DevTools → Performance).
 */
export async function streamChatMessage(
  message: string,
  language: ChatLanguage,
  sessionId: string | null,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<ChatReply> {
  const id = ++requestCounter;
  const mark = (name: string) => performance.mark(`chat:${name}:${id}`);
  const measure = (name: string, end: string) => {
    try {
      performance.measure(`chat:${name}`, `chat:start:${id}`, `chat:${end}:${id}`);
    } catch {
      /* marks missing: ignore */
    }
  };
  mark("start");

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort);
  // Idle timeout: no bytes for this long means the stream is stuck.
  let idleTimer = window.setTimeout(abort, CHAT_TIMEOUT_MS);
  const touch = () => {
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(abort, CHAT_TIMEOUT_MS);
  };

  let text = "";
  let meta: StreamMeta | null = null;
  let finished = false;
  try {
    const response = await fetch("/api/public/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({ message, language, ...(sessionId ? { session_id: sessionId } : {}) }),
      signal: controller.signal,
    });
    mark("ttfb");
    measure("ttfb", "ttfb");
    if (!response.ok || !response.body) {
      const body = await response.json().catch(() => null);
      throw new ChatStreamError(errorDetail(body, response.status), "");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (!finished) {
      const { value, done } = await reader.read();
      if (done) break;
      touch();
      buffer += decoder.decode(value, { stream: true });
      let boundary: number;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        let event = "message";
        let data = "";
        for (const line of block.split("\n")) {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          else if (line.startsWith("data:")) data += line.slice(5).trim();
        }
        const payload = data ? JSON.parse(data) : {};
        if (event === "meta") {
          meta = payload as StreamMeta;
          handlers.onMeta?.(meta);
        } else if (event === "delta" && typeof payload.text === "string") {
          if (!text) {
            mark("first-token");
            measure("first-token", "first-token");
          }
          text += payload.text;
          handlers.onText?.(text);
        } else if (event === "reset") {
          text = "";
          handlers.onText?.(text);
        } else if (event === "error") {
          throw new ChatStreamError(
            typeof payload.detail === "string" ? payload.detail : "The assistant could not answer right now.",
            text,
          );
        } else if (event === "done") {
          finished = true;
        }
      }
    }
    if (!finished || !meta) {
      throw new ChatStreamError("The answer was interrupted. Please ask again.", text);
    }
    mark("total");
    measure("total", "total");
    return { reply: text.trim(), language: meta.language, sources: meta.sources, session_id: meta.session_id };
  } catch (error) {
    if (error instanceof ChatStreamError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ChatStreamError(
        signal?.aborted ? "Cancelled." : "The assistant took too long to respond. Please try again.",
        text,
      );
    }
    // fetch/read network failures surface as TypeError
    throw new ChatStreamError(
      text ? "The connection was lost before the answer finished." : "Could not reach the assistant. Please check your connection.",
      text,
    );
  } finally {
    window.clearTimeout(idleTimer);
    signal?.removeEventListener("abort", abort);
  }
}

export async function sendChatMessage(
  message: string,
  language: ChatLanguage,
  sessionId: string | null,
): Promise<ChatReply> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);
  try {
    const response = await fetch("/api/public/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, language, ...(sessionId ? { session_id: sessionId } : {}) }),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(errorDetail(body, response.status));
    return body as ChatReply;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The assistant took too long to respond. Please try again.");
    }
    if (error instanceof TypeError) {
      throw new Error("Could not reach the assistant. Please check your connection.");
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}
