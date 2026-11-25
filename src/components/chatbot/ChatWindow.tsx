import { useCallback, useEffect, useRef } from 'react';
import type { ChatLanguage } from '../../services/chatApi';
import { Icon } from '../Icon';
import { ChatInput } from './ChatInput';
import { ChatMessage, type ChatMessageData } from './ChatMessage';
import { LanguageSelector } from './LanguageSelector';
import { stringsFor } from './chatStrings';

interface ChatWindowProps {
  messages: ChatMessageData[];
  loading: boolean;
  language: ChatLanguage;
  onLanguageChange: (language: ChatLanguage) => void;
  onSend: (text: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function ChatWindow({ messages, loading, language, onLanguageChange, onSend, onClear, onClose }: ChatWindowProps) {
  const t = stringsFor(language);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // On phone-width screens the chat covers the page, so close it after a source link is
  // tapped; the visitor then sees the section. The conversation is kept (state lives in the widget).
  const handleSourceClick = useCallback(() => {
    if (window.matchMedia('(max-width: 639px)').matches) onClose();
  }, [onClose]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div
      role="dialog"
      aria-label={t.title}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      className="flex h-[min(36rem,calc(100dvh-14.5rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-school-navy/10 bg-school-cream shadow-2xl sm:w-96"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 bg-school-navy px-4 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-serif text-lg font-bold text-white">
            <Icon name="sparkles" className="h-4 w-4 text-school-gold" />
            {t.title}
          </p>
          <p className="truncate text-[11px] text-white/60">{t.subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <LanguageSelector value={language} onChange={onLanguageChange} label={t.languageLabel} />
          <button
            type="button"
            onClick={onClear}
            aria-label={t.clear}
            title={t.clear}
            className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Icon name="trash" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4" aria-live="polite">
        <ChatMessage message={{ id: 'welcome', role: 'assistant', text: t.welcome }} sourcesLabel={t.sources} />

        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {t.suggestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => onSend(question)}
                disabled={loading}
                className="rounded-full border border-school-gold/40 bg-white px-3 py-1.5 text-left text-xs font-semibold text-school-navy transition-colors hover:bg-school-gold/15 disabled:opacity-50"
              >
                {question}
              </button>
            ))}
          </div>
        )}

        {messages.map((message) =>
          message.streaming && !message.text ? null : (
            <ChatMessage key={message.id} message={message} sourcesLabel={t.sources} onSourceClick={handleSourceClick} />
          ),
        )}

        {loading && !messages.some((m) => m.streaming && m.text) && (
          <div className="flex justify-start" role="status">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-school-navy/10 bg-white px-4 py-2.5 text-sm text-school-muted">
              <span className="flex gap-1" aria-hidden="true">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-school-gold [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-school-gold [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-school-gold" />
              </span>
              {t.thinking}
            </div>
          </div>
        )}
      </div>

      <ChatInput onSend={onSend} disabled={loading} placeholder={t.placeholder} sendLabel={t.send} inputRef={inputRef} />
    </div>
  );
}
