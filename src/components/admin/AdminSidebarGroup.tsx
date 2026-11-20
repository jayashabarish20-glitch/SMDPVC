import type { ReactNode } from 'react';

interface AdminSidebarGroupProps {
  groupId: string;
  title: string;
  /** Distinguishes desktop vs mobile instances so element ids stay unique. */
  idPrefix: string;
  isOpen: boolean;
  containsActive: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function AdminSidebarGroup({
  groupId,
  title,
  idPrefix,
  isOpen,
  containsActive,
  onToggle,
  children,
}: AdminSidebarGroupProps) {
  const panelId = `${idPrefix}-group-${groupId}`;

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className={`flex w-full items-center justify-between rounded-lg px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-school-cream hover:text-school-navy ${
          containsActive ? 'text-school-navy' : 'text-school-muted'
        }`}
      >
        <span className="flex items-center gap-2">
          {title}
          {containsActive && !isOpen && (
            <span
              aria-label="Active section inside this group"
              className="h-1.5 w-1.5 rounded-full bg-school-gold"
            />
          )}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {isOpen && (
        <div id={panelId} className="space-y-1 pl-2">
          {children}
        </div>
      )}
    </div>
  );
}
