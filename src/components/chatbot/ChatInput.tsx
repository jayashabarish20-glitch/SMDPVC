import { useState, type FormEvent, type RefObject } from 'react';
import { Icon } from '../Icon';

export const MAX_MESSAGE_CHARS = 1000;

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  placeholder: string;
  sendLabel: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

export function ChatInput({ onSend, disabled, placeholder, sendLabel, inputRef }: ChatInputProps) {
  const [value, setValue] = useState('');
  const trimmed = value.trim();

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <form onSubmit={submit} className="flex items-end gap-2 border-t border-school-navy/10 bg-white p-3">
      <div className="flex-1">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX_MESSAGE_CHARS))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) submit(e);
          }}
          rows={1}
          maxLength={MAX_MESSAGE_CHARS}
          placeholder={placeholder}
          aria-label={placeholder}
          className="max-h-28 min-h-[2.75rem] w-full resize-none rounded-xl border border-school-navy/15 bg-school-cream px-3 py-2.5 text-sm text-school-navy placeholder:text-school-muted/70 focus:border-school-gold focus:outline-none focus:ring-2 focus:ring-school-gold/20"
        />
        {value.length > MAX_MESSAGE_CHARS * 0.8 && (
          <p className="mt-1 text-right text-[11px] text-school-muted">
            {value.length}/{MAX_MESSAGE_CHARS}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={disabled || !trimmed}
        aria-label={sendLabel}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-school-gold text-school-navy transition-colors hover:bg-school-gold-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Icon name="arrow" className="h-5 w-5" />
      </button>
    </form>
  );
}
