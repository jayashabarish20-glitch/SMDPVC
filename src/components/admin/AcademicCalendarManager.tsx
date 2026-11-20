import { useState, useRef } from 'react';
import { Icon } from '../Icon';
import { SectionHeader } from './SectionHeader';
import { usePhotoKey } from '../../hooks/usePhotoKey';
import {
  addKeyedPhoto,
  removeKeyedPhoto,
  nextOrder,
} from '../../services/photoKeyApi';

// Matches the backend upload limit (MAX_UPLOAD_SIZE_BYTES, default 5 MB).
export const MAX_CALENDAR_PDF_BYTES = 5 * 1024 * 1024;

interface AcademicCalendarManagerProps {
  badge: string;
  title: string;
  description: string;
  /** Backend config_key for this calendar (see CALENDAR_KEYS). */
  configKey: string;
}

/**
 * Admin manager for one academic calendar PDF. The PDF is uploaded to Cloudinary
 * through FastAPI and linked in SQLite. When a new PDF is saved, the previous
 * PDFs for that key are removed, so the newest link is the current calendar.
 */
export function AcademicCalendarManager({
  badge,
  title,
  description,
  configKey,
}: AcademicCalendarManagerProps) {
  const { photos, isLoading, error, reload } = usePhotoKey(configKey);
  // Photos are sorted by display_order, so the last one is the newest upload.
  const calendar = photos.length > 0 ? photos[photos.length - 1] : null;

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    setUploadError(null);
    setSuccessMessage(null);

    if (file.type !== 'application/pdf') {
      setUploadError('Please select a PDF file only.');
      return;
    }
    if (file.size > MAX_CALENDAR_PDF_BYTES) {
      setUploadError('The PDF must be 5 MB or smaller.');
      return;
    }

    setSelectedFile(file);
  };

  const handleSave = async () => {
    if (!selectedFile || isBusy) return;

    setUploadError(null);
    setSuccessMessage(null);
    setIsBusy(true);
    const previous = [...photos];
    try {
      // Resolves only after the Cloudinary upload and SQLite link both succeed.
      await addKeyedPhoto(selectedFile, configKey, nextOrder(previous), 'Academic Calendar');
      for (const old of previous) {
        await removeKeyedPhoto(old.configId, old.mediaId);
      }
      await reload();
      setSuccessMessage('Academic Calendar saved successfully.');
      setSelectedFile(null);
    } catch (cause) {
      setUploadError(errorMessage(cause, 'Failed to save the PDF. Please try again.'));
      await reload();
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async () => {
    if (isBusy || photos.length === 0) return;
    setUploadError(null);
    setSuccessMessage(null);
    setIsBusy(true);
    try {
      for (const old of photos) {
        await removeKeyedPhoto(old.configId, old.mediaId);
      }
      await reload();
    } catch (cause) {
      setUploadError(errorMessage(cause, 'Failed to delete the PDF. Please try again.'));
      await reload();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div>
      <SectionHeader
        badge={badge}
        title={title}
        description={description}
      />

      <div className="rounded-2xl border border-school-navy/10 bg-white p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-serif text-xl font-bold text-school-navy">Upload PDF</h3>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-lg bg-school-gold px-4 py-2.5 text-sm font-semibold text-school-navy transition-colors hover:bg-school-gold-hover disabled:opacity-50"
          >
            <Icon name="plus" className="h-4 w-4" />
            {isBusy ? 'Saving…' : calendar ? 'Replace PDF' : 'Upload PDF'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          disabled={isBusy}
          className="hidden"
          aria-label="Upload academic calendar PDF"
        />

        {(uploadError || error) && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {uploadError ?? error}
          </p>
        )}

        {successMessage && (
          <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </p>
        )}

        {selectedFile && (
          <div className="rounded-2xl border border-school-navy/10 overflow-hidden bg-school-cream p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-school-muted/70">Selected File</p>
              <p className="truncate text-sm font-semibold text-school-navy">{selectedFile.name}</p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={isBusy}
              className="w-full rounded-lg bg-school-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-school-navy-light disabled:opacity-50"
            >
              {isBusy ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}

        {isLoading && photos.length === 0 ? (
          <p className="py-8 text-center text-sm text-school-muted">Loading the current calendar…</p>
        ) : calendar ? (
          <div className="rounded-2xl border border-school-navy/10 overflow-hidden bg-school-cream p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-school-muted/70">Current PDF</p>
              <p className="truncate text-sm font-semibold text-school-navy">{calendar.filename}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-school-muted/70">Uploaded</p>
              <p className="text-xs text-school-muted">
                {new Date(calendar.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isBusy}
                className="flex-1 rounded-lg border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <Icon name="trash" className="inline h-4 w-4 mr-2" />
                Delete PDF
              </button>
            </div>
          </div>
        ) : !selectedFile && (
          <div className="rounded-xl border-2 border-dashed border-school-navy/20 py-8 text-center">
            <Icon name="image" className="mx-auto mb-3 h-10 w-10 text-school-gold/40" />
            <p className="text-sm text-school-muted">No PDF uploaded yet. Click Upload to add one.</p>
          </div>
        )}

        <p className="text-[11px] text-school-muted">PDF files only · Max file size: 5 MB</p>
      </div>
    </div>
  );
}

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}
