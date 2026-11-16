import { useRef, useState } from 'react';
import { usePhotoConfig } from '../../hooks/usePhotoConfig';
import type { PhotoMetadata } from '../../data/photoService';
import { handleFileInput, type UploadedImage, type ImageUploadError } from '../../utils/imageUpload';
import { Icon } from '../Icon';
import { SectionHeader } from './SectionHeader';

export function NurseryAboutManager() {
  const { config, updateNurseryAbout } = usePhotoConfig();
  const about = config.nurseryAbout ?? { photo: null, description: '' };

  // Photo state
  const [photo, setPhoto] = useState<PhotoMetadata | null>(about.photo);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Description state
  const [description, setDescription] = useState<string>(about.description ?? '');
  const [descChanged, setDescChanged] = useState(false);
  const [descSaved, setDescSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Upload Handler ──────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setIsUploading(true);

    try {
      const result = await handleFileInput(e);
      if ('type' in result && (result as ImageUploadError).type) {
        setUploadError((result as ImageUploadError).message);
        return;
      }

      const uploaded = result as UploadedImage;
      const filename = e.target.files?.[0]?.name || 'photo.jpg';

      setPhoto({
        id: `nursery-about-${Date.now()}`,
        filename,
        alt: 'Nursery About',
        updatedAt: new Date().toISOString(),
        dataUrl: uploaded.dataUrl,
      });
      setPhotoChanged(true);
      setDescSaved(false);
    } catch (error) {
      console.error('Failed to upload photo:', error);
      setUploadError(
        error instanceof Error ? error.message : 'Failed to upload image. Please try again.'
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Delete Handler ──────────────────────────────────────────────────────────

  const handleDelete = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setPhoto(null);
    setPhotoChanged(true);
    setDeleteConfirm(false);
    setDescSaved(false);
  };

  // ── Save Handler ────────────────────────────────────────────────────────────

  const handleSave = () => {
    updateNurseryAbout({ photo, description });
    setPhotoChanged(false);
    setDescChanged(false);
    setDescSaved(true);
  };

  return (
    <div>
      <SectionHeader
        badge="NURSERY PAGE"
        title="Nursery – About"
        description="Upload and manage the photograph and description for the About section of the Nursery page."
      />

      {/* ── Photo Section ── */}
      <div className="rounded-2xl border border-school-navy/10 bg-white p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-serif text-xl font-bold text-school-navy">About Photograph</h3>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-lg bg-school-gold px-4 py-2.5 text-sm font-semibold text-school-navy transition-colors hover:bg-school-gold-hover disabled:opacity-50"
          >
            <Icon name={photo ? 'upload' : 'image'} className="h-4 w-4" />
            {isUploading ? 'Uploading…' : photo ? 'Replace Photo' : 'Add Photo'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
          aria-label="Upload about photo"
        />

        {uploadError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {uploadError}
          </p>
        )}

        {photo ? (
          <div className="rounded-2xl border border-school-navy/10 overflow-hidden bg-school-cream">
            {/* Photo Preview */}
            <div className="aspect-[4/3] flex items-center justify-center overflow-hidden bg-gradient-to-br from-school-navy via-school-navy-light to-school-deep">
              {photo.dataUrl || photo.imageUrl ? (
                <img
                  src={photo.dataUrl || photo.imageUrl}
                  alt={photo.alt}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Icon name="image" className="h-12 w-12 text-white/30" />
              )}
            </div>

            {/* Photo Info */}
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-school-muted/70">Filename</p>
                <p className="truncate text-sm font-semibold text-school-navy">{photo.filename}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-school-muted/70">Uploaded</p>
                <p className="text-xs text-school-muted">
                  {new Date(photo.updatedAt).toLocaleDateString()}
                </p>
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={handleDelete}
                className={`w-full rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  deleteConfirm
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'border border-red-200 text-red-700 hover:bg-red-50'
                }`}
              >
                <Icon
                  name={deleteConfirm ? 'x' : 'trash'}
                  className="inline h-4 w-4 mr-2"
                />
                {deleteConfirm ? 'Confirm Delete' : 'Remove Photo'}
              </button>

              {deleteConfirm && (
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(false)}
                  className="w-full rounded-lg border border-school-navy/15 px-3 py-2.5 text-sm font-semibold text-school-navy hover:bg-school-cream transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl border-2 border-dashed border-school-navy/20 py-14 text-center cursor-pointer hover:border-school-gold/40 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon name="image" className="mx-auto mb-3 h-10 w-10 text-school-gold/40" />
            <p className="text-sm text-school-muted">No photo yet. Click to add one.</p>
          </div>
        )}

        <p className="text-[11px] text-school-muted">JPG, PNG, WebP · Max 5 MB</p>
      </div>

      {/* ── Description Section ── */}
      <div className="mt-6 rounded-2xl border border-school-navy/10 bg-white p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-serif text-xl font-bold text-school-navy">About Description</h3>
          {descChanged && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              Unsaved changes
            </span>
          )}
          {descSaved && !descChanged && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              ✓ Saved
            </span>
          )}
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-xs font-semibold text-school-navy">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setDescChanged(true);
              setDescSaved(false);
            }}
            placeholder="Enter the about section description..."
            rows={5}
            className="w-full resize-y rounded-lg border border-school-navy/15 bg-school-cream px-3 py-2.5 text-sm text-school-navy placeholder:text-school-muted/60 transition-colors focus:border-school-gold focus:outline-none focus:ring-2 focus:ring-school-gold/20"
          />
        </div>

        <div className="rounded-lg border border-school-navy/10 bg-school-cream/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-school-muted">Public preview</p>
          {description ? (
            <p className="mt-2 whitespace-pre-line text-sm font-medium leading-relaxed text-school-navy">
              {description}
            </p>
          ) : (
            <p className="mt-2 text-sm italic text-school-muted">No description yet.</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!photoChanged && !descChanged}
          className="w-full rounded-lg bg-school-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-school-navy-light disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Nursery About
        </button>
      </div>
    </div>
  );
}
