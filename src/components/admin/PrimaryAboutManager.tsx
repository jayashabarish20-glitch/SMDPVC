import { useRef, useState } from 'react';
import { usePhotoConfig } from '../../hooks/usePhotoConfig';
import type { PhotoMetadata } from '../../data/photoService';
import {
  generateSemanticFilename,
  handleFileInput,
} from '../../utils/imageUpload';
import { Icon } from '../Icon';
import { SectionHeader } from './SectionHeader';

export function PrimaryAboutManager() {
  const { config, updatePrimaryAbout } = usePhotoConfig();
  const about = config.primaryAbout ?? { photo: null, description: '' };
  const [photo, setPhoto] = useState<PhotoMetadata | null>(about.photo);
  const [savedPhoto, setSavedPhoto] = useState<PhotoMetadata | null>(about.photo);
  const [description, setDescription] = useState(about.description);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [descriptionChanged, setDescriptionChanged] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const hasUnsavedChanges = photoChanged || descriptionChanged;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setIsUploading(true);

    try {
      const result = await handleFileInput(event);
      if ('type' in result) {
        setUploadError(result.message);
        return;
      }

      const filename = generateSemanticFilename(result.filename, 'primary-about');
      setPhoto({
        id: filename.replace(/\.[^/.]+$/, ''),
        filename,
        alt: 'Primary About',
        updatedAt: new Date().toISOString(),
        dataUrl: result.dataUrl,
      });
      setPhotoChanged(true);
      setIsSaved(false);
    } catch (error) {
      console.error('Failed to upload Primary About photo:', error);
      setUploadError(
        error instanceof Error ? error.message : 'Failed to upload image. Please try again.'
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    updatePrimaryAbout({ photo, description });
    setSavedPhoto(photo);
    setPhotoChanged(false);
    setDescriptionChanged(false);
    setIsSaved(true);
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoChanged(true);
    setIsSaved(false);
  };

  const handleRestorePhoto = () => {
    setPhoto(savedPhoto);
    setPhotoChanged(false);
    setIsSaved(false);
  };

  return (
    <div>
      <SectionHeader
        badge="PRIMARY PAGE"
        title="Primary – About"
        description="Manage the photograph and description displayed in the About section of the public Primary page."
      />

      <div className="space-y-6 rounded-2xl border border-school-navy/10 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl font-bold text-school-navy">About Photo</h3>
            <p className="mt-1 text-sm text-school-muted">
              JPG, PNG, or WebP · Maximum 5 MB
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-lg bg-school-gold px-4 py-2.5 text-sm font-semibold text-school-navy transition-colors hover:bg-school-gold-hover disabled:opacity-50"
          >
            <Icon name="image" className="h-4 w-4" />
            {isUploading ? 'Uploading…' : photo ? 'Replace Photo' : 'Upload Photo'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
          aria-label="Upload Primary About photo"
        />

        {uploadError && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {uploadError}
          </p>
        )}

        {photo?.dataUrl ? (
          <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-school-navy/10 bg-school-cream">
            <div className="flex max-h-[28rem] min-h-48 items-center justify-center">
              <img
                src={photo.dataUrl}
                alt="Primary About preview"
                className="max-h-[28rem] w-full object-contain"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-school-navy/10 px-4 py-3">
              <p className="min-w-0 truncate text-xs text-school-muted">{photo.filename}</p>
              <div className="flex items-center gap-3">
                {photoChanged && savedPhoto && (
                  <button
                    type="button"
                    onClick={handleRestorePhoto}
                    className="text-xs font-semibold text-school-navy underline underline-offset-2"
                  >
                    Undo replacement
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
                >
                  <Icon name="trash" className="h-3.5 w-3.5" />
                  Remove Photo
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-school-navy/20 py-12 text-center">
            <Icon name="image" className="mx-auto mb-3 h-10 w-10 text-school-gold/50" />
            <p className="text-sm text-school-muted">
              {savedPhoto ? 'Photo removal is not saved yet.' : 'No photo uploaded yet.'}
            </p>
            {photoChanged && savedPhoto && (
              <button
                type="button"
                onClick={handleRestorePhoto}
                className="mt-2 text-xs font-semibold text-school-navy underline underline-offset-2"
              >
                Undo removal
              </button>
            )}
          </div>
        )}

        {photo && photoChanged && (
          <p className="text-xs font-medium text-amber-700">
            Photo preview only — save your changes to publish it.
          </p>
        )}

        <div className="border-t border-school-navy/10 pt-6">
          <h3 className="font-serif text-xl font-bold text-school-navy">About Description</h3>
          <label htmlFor="primary-about-description" className="mb-1.5 mt-4 block text-xs font-semibold text-school-navy">
            Description
          </label>
          <textarea
            id="primary-about-description"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setDescriptionChanged(true);
              setIsSaved(false);
            }}
            placeholder="Enter the description to display in the Primary About section."
            rows={5}
            className="w-full resize-y rounded-lg border border-school-navy/15 bg-school-cream px-3 py-2.5 text-sm text-school-navy placeholder:text-school-muted/60 transition-colors focus:border-school-gold focus:outline-none focus:ring-2 focus:ring-school-gold/20"
          />

          <div className="mt-5 rounded-xl border border-school-navy/10 bg-school-cream/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-school-muted">
              Public preview
            </p>
            {description ? (
              <p className="mt-2 whitespace-pre-line text-sm font-bold leading-relaxed text-school-navy">
                {description}
              </p>
            ) : (
              <p className="mt-2 text-sm italic text-school-muted">No description entered.</p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            {hasUnsavedChanges ? (
              <span className="text-xs font-semibold text-amber-700">Unsaved changes</span>
            ) : isSaved ? (
              <span role="status" className="text-xs font-semibold text-green-700">Saved</span>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-lg bg-school-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-school-navy-light"
            >
              Save About
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
