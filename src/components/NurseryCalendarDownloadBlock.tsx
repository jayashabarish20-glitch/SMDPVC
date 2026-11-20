import { useState, useCallback } from 'react';
import { Icon } from './Icon';
import { DownloadToast } from './DownloadToast';
import type { AcademicCalendarData } from '../data/photoService';

interface NurseryCalendarDownloadBlockProps {
  calendar: AcademicCalendarData;
}

/**
 * Nursery Academic Calendar download card.
 * Shows file info, a download button, and a green toast on success.
 * The DownloadToast is fixed-position so DOM nesting doesn't affect placement.
 */
export function NurseryCalendarDownloadBlock({ calendar }: NurseryCalendarDownloadBlockProps) {
  const [toastStatus, setToastStatus] = useState<'success' | 'error' | null>(null);

  const handleDismiss = useCallback(() => setToastStatus(null), []);

  // The PDF is hosted on Cloudinary (cross-origin), so the browser ignores a
  // download attribute. Open it in a new tab instead; the viewer offers the save.
  const handleDownload = useCallback(() => {
    const opened = window.open(calendar.dataUrl, '_blank');
    if (opened) {
      opened.opener = null;
      setToastStatus('success');
    } else {
      setToastStatus('error');
    }
  }, [calendar.dataUrl]);

  return (
    <>
      <DownloadToast
        status={toastStatus}
        message={
          toastStatus === 'success'
            ? 'Academic Calendar downloaded successfully!'
            : 'Download failed. Please try again.'
        }
        onDismiss={handleDismiss}
      />

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* File info card */}
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-school-navy/10 bg-school-cream-alt px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-school-navy/10">
            <Icon name="upload" className="h-4 w-4 text-school-navy" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-school-navy">{calendar.filename}</p>
            <p className="mt-0.5 text-xs text-school-muted">
              Uploaded {new Date(calendar.uploadedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-school-gold px-6 py-3 text-sm font-semibold text-school-navy transition-colors hover:bg-school-gold-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-school-gold/60"
        >
          <Icon name="arrow" className="h-4 w-4" />
          Download Academic Calendar
        </button>
      </div>
    </>
  );
}

