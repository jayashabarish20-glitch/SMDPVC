import { Fragment, memo, type ReactNode } from 'react';
import type { ChatSource } from '../../services/chatApi';

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sources?: ChatSource[];
  isError?: boolean;
  /** True while the answer is still arriving. */
  streaming?: boolean;
}

const URL_PATTERN = /(https?:\/\/[^\s)]+)/g;

/**
 * Source links point at page sections ("/higher-secondary#higher-sports"). The app router
 * handles the page change (and scrolls to top); then sections above the target load their
 * data and grow, pushing it down. So keep re-aligning until the target stops moving, and stop
 * immediately if the visitor scrolls themselves.
 */
function scrollToSectionSoon(url: string) {
  const hash = url.split('#')[1];
  if (!hash) return;
  let userScrolled = false;
  const stop = () => {
    userScrolled = true;
  };
  const listeners = ['wheel', 'touchstart', 'keydown'] as const;
  listeners.forEach((type) => window.addEventListener(type, stop, { passive: true, once: true }));
  const cleanup = () => listeners.forEach((type) => window.removeEventListener(type, stop));

  let attempts = 0;
  let stableChecks = 0;
  const tick = () => {
    if (userScrolled || attempts++ > 60) return cleanup(); // ~6 s max
    const target = document.getElementById(hash);
    if (target) {
      // Aligned position honours the section's scroll-margin-top (space for the fixed header).
      const expected = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      const offset = target.getBoundingClientRect().top - expected;
      if (Math.abs(offset) > 4) {
        // 'instant': the site sets html { scroll-behavior: smooth }, and restarting a smooth
        // scroll every tick while the page grows never converges.
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
        stableChecks = 0;
      } else if (++stableChecks >= 5) {
        return cleanup(); // stayed aligned for ~0.5 s: layout has settled
      }
    }
    window.setTimeout(tick, 100);
  };
  window.setTimeout(tick, 120);
}

/** Inline text: **bold** and http(s) links. Rendered as React nodes (no HTML injection). */
function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).flatMap((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return [<strong key={`b${i}`}>{part.slice(2, -2)}</strong>];
    }
    return part.split(URL_PATTERN).map((piece, j) =>
      /^https?:\/\//.test(piece) ? (
        <a
          key={`u${i}-${j}`}
          href={piece}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all font-semibold text-school-gold underline underline-offset-2"
        >
          Open link
        </a>
      ) : (
        <Fragment key={`t${i}-${j}`}>{piece}</Fragment>
      ),
    );
  });
}

/** Minimal block formatting: paragraphs and "*", "-", "•" bullet lists. */
function renderBody(text: string): ReactNode[] {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={`l${blocks.length}`} className="my-1 list-disc space-y-0.5 pl-5">
          {bullets.map((b, i) => <li key={i}>{renderInline(b)}</li>)}
        </ul>,
      );
      bullets = [];
    }
  };
  for (const line of text.split('\n')) {
    const bullet = line.match(/^\s*(?:[*•-])\s+(.*)$/);
    if (bullet) {
      bullets.push(bullet[1]);
    } else {
      flush();
      if (line.trim()) blocks.push(<p key={`p${blocks.length}`}>{renderInline(line)}</p>);
    }
  }
  flush();
  return blocks;
}

/** Memoized: while streaming, only the message whose text changed re-renders. */
export const ChatMessage = memo(function ChatMessage({
  message,
  sourcesLabel,
  onSourceClick,
}: {
  message: ChatMessageData;
  sourcesLabel: string;
  /** Called after a source link is clicked (e.g. to close the chat on small screens). */
  onSourceClick?: () => void;
}) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words ${
          isUser
            ? 'rounded-br-md bg-school-navy text-white'
            : message.isError
              ? 'rounded-bl-md border border-red-200 bg-red-50 text-red-700'
              : 'rounded-bl-md border border-school-navy/10 bg-white text-school-navy'
        }`}
      >
        <div className="space-y-1.5">{isUser ? <p className="whitespace-pre-wrap">{message.text}</p> : renderBody(message.text)}</div>
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2.5 border-t border-school-navy/10 pt-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-school-muted">{sourcesLabel}</p>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {message.sources.map((source) => (
                <li key={`${source.url}-${source.title}`}>
                  <a
                    href={source.url}
                    onClick={() => {
                      scrollToSectionSoon(source.url);
                      onSourceClick?.();
                    }}
                    className="inline-block rounded-full border border-school-gold/40 bg-school-cream px-2.5 py-1 text-xs font-semibold text-school-navy transition-colors hover:bg-school-gold/20"
                  >
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
});
