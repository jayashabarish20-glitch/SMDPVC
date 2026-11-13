import { useState, useRef } from 'react';
import { usePhotoConfig } from '../../hooks/usePhotoConfig';
import { Icon } from '../Icon';
import { SectionHeader } from './SectionHeader';

interface AcademicCalendarManagerProps {
  badge: string;
  title: string;
  description: string;
  calendarKey: 'primary' | 'nursery';
}

export function AcademicCalendarManager({
  badge,
  title,
  description,
  calendarKey,
}: AcademicCalendarManagerProps) {
  const { config, updatePrimaryAcademicCalendar, updateNurseryAcademicCalendar } = usePhotoConfig();
  const calendar = calendarKey === 'primary' ? config.academicCalendarPrimary : config.academicCalendarNursery;
  const updateCalendar = calendarKey === 'primary' ? updatePrimaryAcademicCalendar : updateNurseryAcademicCalendar;

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      if (file.type !== 'application/pdf') {
        setUploadError('Please select a PDF file only.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const dataUrl = event.target?.result as string;
          updateCalendar({
            filename: file.name,
            dataUrl,
            uploadedAt: new Date().toISOString(),
          });
        } catch (error) {
          setUploadError('Failed to process PDF file.');
          console.error('Failed to process PDF:', error);
        }
      };

      reader.onerror = () => {
        setUploadError('Failed to read PDF file.');
      };

      reader.readAsDataURL(file);
    } catch (error) {
      setUploadError('Failed to upload PDF. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = () => {
    updateCalendar(null);
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
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-lg bg-school-gold px-4 py-2.5 text-sm font-semibold text-school-navy transition-colors hover:bg-school-gold-hover disabled:opacity-50"
          >
            <Icon name="plus" className="h-4 w-4" />
            {isUploading ? 'Uploading…' : calendar ? 'Replace PDF' : 'Upload PDF'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
          aria-label="Upload academic calendar PDF"
        />

        {uploadError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {uploadError}
          </p>
        )}

        {calendar ? (
          <div className="rounded-2xl border border-school-navy/10 overflow-hidden bg-school-cream p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-school-muted/70">Current PDF</p>
              <p className="truncate text-sm font-semibold text-school-navy">{calendar.filename}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-school-muted/70">Uploaded</p>
              <p className="text-xs text-school-muted">
                {new Date(calendar.uploadedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-lg border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
              >
                <Icon name="trash" className="inline h-4 w-4 mr-2" />
                Delete PDF
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-school-navy/20 py-8 text-center">
            <Icon name="image" className="mx-auto mb-3 h-10 w-10 text-school-gold/40" />
            <p className="text-sm text-school-muted">No PDF uploaded yet. Click Upload to add one.</p>
          </div>
        )}

        <p className="text-[11px] text-school-muted">PDF files only · Max file size: 10 MB</p>
      </div>
    </div>
  );
}
