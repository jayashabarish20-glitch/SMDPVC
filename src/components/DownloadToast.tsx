import { useEffect } from 'react';
import { Icon } from './Icon';

interface DownloadToastProps {
  status: 'success' | 'error' | null;
  message: string;
  onDismiss: () => void;
}

/**
 * Fixed top-centre toast notification for download feedback.
 * - Success: green, auto-dismisses after 3 seconds
 * - Error: red, stays until dismissed manually
 * - Slides down from above on entry
 */
export function DownloadToast({ status, message, onDismiss }: DownloadToastProps) {
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, onDismiss]);

  if (!status) return null;

  const isSuccess = status === 'success';

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(calc(100vw - 2rem), 28rem)',
        zIndex: 9999,
        animation: 'downloadToastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      <style>{`
        @keyframes downloadToastSlideIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-120%); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <div
        className={`flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-lg ${
          isSuccess ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
          {isSuccess ? (
            <Icon name="check" className="h-3.5 w-3.5 text-white" />
          ) : (
            <Icon name="x" className="h-3.5 w-3.5 text-white" />
          )}
        </span>
        <p className="flex-1 text-sm font-semibold leading-snug">{message}</p>
        <button
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="ml-1 rounded p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <Icon name="x" className="h-3.5 w-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}

