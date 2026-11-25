import type { ChatLanguage } from '../../services/chatApi';
import { LANGUAGE_OPTIONS } from './chatStrings';

interface LanguageSelectorProps {
  value: ChatLanguage;
  onChange: (language: ChatLanguage) => void;
  label: string;
}

export function LanguageSelector({ value, onChange, label }: LanguageSelectorProps) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-white/70">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ChatLanguage)}
        aria-label={label}
        className="rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-school-gold/40 [&>option]:text-school-navy"
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
