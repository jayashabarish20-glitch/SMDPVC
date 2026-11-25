import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChatStreamError, streamChatMessage, type ChatLanguage, type ChatSource } from '../../services/chatApi';
import { Icon } from '../Icon';
import type { ChatMessageData } from './ChatMessage';
import { ChatWindow } from './ChatWindow';
import { stringsFor } from './chatStrings';

/** Only same-site page paths are rendered as source links. */
function safeSources(sources: ChatSource[] | undefined): ChatSource[] {
  return (sources ?? []).filter((s) => typeof s.url === 'string' && s.url.startsWith('/') && !s.url.startsWith('//'));
}

/**
 * Floating public chatbot. Conversation lives only in component memory
 * (no localStorage); "Clear" also drops the server session id.
 * Answers stream in progressively; updates are batched to one render per frame.
 */
export function ChatbotWidget() {
  const shouldReduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<ChatLanguage>('auto');
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [loading, setLoading] = useState(false);
  const sessionId = useRef<string | null>(null);
  const counter = useRef(0);
  const inFlight = useRef(false); // synchronous guard against double submits
  const abortRef = useRef<AbortController | null>(null);
  const frame = useRef<number | null>(null);
  const t = stringsFor(language);

  const nextId = () => `m${++counter.current}`;

  const patchMessage = useCallback((id: string, patch: Partial<ChatMessageData>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  useEffect(() => () => {
    abortRef.current?.abort();
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (inFlight.current) return;
      inFlight.current = true;
      const controller = new AbortController();
      abortRef.current = controller;
      const replyId = nextId();
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'user', text },
        { id: replyId, role: 'assistant', text: '', streaming: true },
      ]);
      setLoading(true);

      let latest = '';
      const flush = () => {
        frame.current = null;
        patchMessage(replyId, { text: latest });
      };
      const scheduleText = (full: string) => {
        latest = full;
        if (frame.current === null) frame.current = requestAnimationFrame(flush);
      };

      try {
        const result = await streamChatMessage(
          text,
          language,
          sessionId.current,
          {
            onMeta: (meta) => {
              sessionId.current = meta.session_id;
            },
            onText: scheduleText,
          },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        if (frame.current !== null) cancelAnimationFrame(frame.current);
        frame.current = null;
        patchMessage(replyId, { text: result.reply, sources: safeSources(result.sources), streaming: false });
      } catch (error) {
        if (controller.signal.aborted) return; // cleared or unmounted: nothing to show
        if (frame.current !== null) cancelAnimationFrame(frame.current);
        frame.current = null;
        const partial = error instanceof ChatStreamError ? error.partialText.trim() : '';
        const detail = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
        setMessages((prev) => {
          const rest = prev.filter((m) => m.id !== replyId);
          const kept: ChatMessageData[] = partial
            ? [{ id: replyId, role: 'assistant', text: partial, streaming: false }]
            : [];
          return [...rest, ...kept, { id: nextId(), role: 'assistant', isError: true, text: detail }];
        });
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          inFlight.current = false;
          setLoading(false);
        }
      }
    },
    [language, patchMessage],
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    inFlight.current = false;
    setLoading(false);
    setMessages([]);
    sessionId.current = null;
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] right-[calc(env(safe-area-inset-right)+1rem)] z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'bottom right' }}
          >
            <ChatWindow
              messages={messages}
              loading={loading}
              language={language}
              onLanguageChange={setLanguage}
              onSend={send}
              onClear={clear}
              onClose={close}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? t.close : t.open}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-school-gold text-school-navy shadow-2xl transition-transform hover:scale-105 hover:bg-school-gold-hover focus:outline-none focus:ring-4 focus:ring-school-gold/30"
      >
        <Icon name={open ? 'close' : 'sparkles'} className="h-6 w-6" />
      </button>
    </div>
  );
}
