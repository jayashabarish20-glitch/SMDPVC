import { useState, useRef, useEffect } from 'react';
import { SectionHeader } from './SectionHeader';
import { Icon } from '../Icon';
import { validatePhotoUpload } from '../../utils/photoValidation';
import { useKeyedGallery } from '../../hooks/useKeyedGallery';
import {
  addKeyedPhoto,
  removeKeyedPhoto,
  reorderKeyedPhotos,
  saveKeyedDescription,
  nextOrder,
  type KeyedPhoto,
} from '../../services/photoKeyApi';

export interface KeyedGalleryManagerProps {
  /** Backend config_key shared by this manager and its public section. */
  configKey: string;
  badge: string;
  title: string;
  headerDescription: string;
  /** Short name of the section, e.g. "Learning Activities". */
  galleryName: string;
  /** Page the gallery appears on, e.g. "Nursery". */
  pageName: string;
  /** alt text stored with each uploaded photo. */
  altLabel: string;
}

/**
 * Admin manager for one school-page gallery. Photos are uploaded to Cloudinary
 * through FastAPI and linked in SQLite; the description is a SQLite content record.
 * Nothing is kept in browser storage.
 */
export function KeyedGalleryManager({
  configKey,
  badge,
  title,
  headerDescription,
  galleryName,
  pageName,
  altLabel,
}: KeyedGalleryManagerProps) {
  const { photos, description: savedDescription, isLoading, error, reload } =
    useKeyedGallery(configKey, { mode: 'admin' });

  const [description, setDescription] = useState<string>('');
  const [descriptionLoaded, setDescriptionLoaded] = useState(false);
  const [descSaved, setDescSaved] = useState(false);
  const [descChanged, setDescChanged] = useState(false);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load the saved description once, after the server responds.
  useEffect(() => {
    if (!isLoading && !descriptionLoaded) {
      setDescription(savedDescription);
      setDescriptionLoaded(true);
    }
  }, [isLoading, savedDescription, descriptionLoaded]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file || isBusy) return;

    setUploadError(null);
    const validation = validatePhotoUpload(file, altLabel);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file.');
      return;
    }

    setIsBusy(true);
    try {
      // Resolves only after Cloudinary upload and SQLite link both succeed.
      await addKeyedPhoto(file, configKey, nextOrder(photos), altLabel);
      await reload();
    } catch (cause) {
      setUploadError(errorMessage(cause, 'Failed to upload image. Please try again.'));
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async (photo: KeyedPhoto) => {
    if (deleteConfirm !== photo.configId) {
      setDeleteConfirm(photo.configId);
      return;
    }
    setDeleteConfirm(null);
    setUploadError(null);
    setIsBusy(true);
    try {
      await removeKeyedPhoto(photo.configId, photo.mediaId);
      await reload();
    } catch (cause) {
      setUploadError(errorMessage(cause, 'Failed to delete photo. Please try again.'));
      await reload();
    } finally {
      setIsBusy(false);
    }
  };

  const handleDragStart = (id: string) => setDraggedId(id);

  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const from = photos.findIndex((p) => p.configId === draggedId);
    const to = photos.findIndex((p) => p.configId === targetId);
    const reordered = [...photos];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setDraggedId(null);
    setUploadError(null);
    setIsBusy(true);
    try {
      await reorderKeyedPhotos(configKey, reordered.map((p) => p.configId));
      await reload();
    } catch (cause) {
      setUploadError(errorMessage(cause, 'Failed to save the new order.'));
      await reload();
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveDescription = async () => {
    setUploadError(null);
    setIsBusy(true);
    try {
      await saveKeyedDescription(configKey, description);
      setDescSaved(true);
      setDescChanged(false);
    } catch (cause) {
      setUploadError(errorMessage(cause, 'Failed to save the description.'));
    } finally {
      setIsBusy(false);
    }
  };

  const handleDescChange = (val: string) => {
    setDescription(val);
    setDescChanged(true);
    setDescSaved(false);
  };

  return (
    <div>
      <SectionHeader badge={badge} title={title} description={headerDescription} />

      <div className="rounded-2xl border border-school-navy/10 bg-white p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-serif text-xl font-bold text-school-navy">Gallery Photographs</h3>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-lg bg-school-gold px-4 py-2.5 text-sm font-semibold text-school-navy transition-colors hover:bg-school-gold-hover disabled:opacity-50"
          >
            <Icon name="plus" className="h-4 w-4" />
            {isBusy ? 'Saving…' : 'Add Photo'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={isBusy}
          className="hidden"
          aria-label={`Upload ${galleryName} gallery photo`}
        />

        {(uploadError || error) && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {uploadError ?? error}
          </p>
        )}

        {isLoading && photos.length === 0 ? (
          <p className="py-14 text-center text-sm text-school-muted">Loading photographs…</p>
        ) : photos.length === 0 ? (
          <div
            className="rounded-xl border-2 border-dashed border-school-navy/20 py-14 text-center cursor-pointer hover:border-school-gold/40 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon name="image" className="mx-auto mb-3 h-10 w-10 text-school-gold/40" />
            <p className="text-sm text-school-muted">No photos yet. Click to add the first one.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.configId}
                draggable={!isBusy}
                onDragStart={() => handleDragStart(photo.configId)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(photo.configId)}
                className={`group relative rounded-2xl border-2 overflow-hidden transition-all cursor-move ${
                  draggedId === photo.configId
                    ? 'border-school-gold bg-school-gold/5 opacity-50'
                    : 'border-school-navy/10 hover:border-school-gold/40 bg-school-cream'
                } p-3`}
              >
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-school-navy via-school-navy-light to-school-deep">
                  {photo.imageUrl ? (
                    <img
                      src={photo.imageUrl}
                      alt={photo.alt}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/50">
                      <Icon name="image" className="h-8 w-8" />
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    drag to reorder
                  </span>
                </div>

                <div className="mt-2 px-1">
                  <p className="truncate text-xs font-semibold text-school-navy">{photo.filename}</p>
                  <p className="text-[10px] text-school-muted/70">
                    {new Date(photo.updatedAt).toLocaleDateString()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(photo)}
                  disabled={isBusy}
                  className={`absolute right-4 top-4 rounded-lg p-1.5 transition-colors text-sm font-semibold ${
                    deleteConfirm === photo.configId
                      ? 'bg-red-500 text-white'
                      : 'bg-white/80 text-school-navy opacity-0 group-hover:opacity-100'
                  }`}
                  title={deleteConfirm === photo.configId ? 'Confirm delete' : 'Delete photo'}
                >
                  <Icon name="trash" className="h-4 w-4" />
                </button>
                {deleteConfirm === photo.configId && (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(null)}
                    className="absolute left-4 top-4 rounded-lg bg-white/80 px-2 py-1 text-xs font-semibold text-school-navy hover:bg-white transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-school-muted">
          JPG, PNG, WebP · Max 5 MB · Drag cards to reorder
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-school-navy/10 bg-white p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-serif text-xl font-bold text-school-navy">Gallery Description</h3>
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
          <label className="mb-1.5 block text-xs font-semibold text-school-navy">
            Description{' '}
            <span className="font-normal text-school-muted">(shown below the gallery on the {pageName} page)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => handleDescChange(e.target.value)}
            placeholder={`Enter a description for the ${galleryName} gallery that will appear below the photographs on the ${pageName} page.`}
            rows={4}
            className="w-full rounded-lg border border-school-navy/15 bg-school-cream px-3 py-2.5 text-sm text-school-navy placeholder:text-school-muted/60 focus:border-school-gold focus:outline-none focus:ring-2 focus:ring-school-gold/20 transition-colors resize-y"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveDescription}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-lg bg-school-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-school-navy-light disabled:opacity-50"
          >
            <Icon name="save" className="h-4 w-4" />
            Save Description
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-school-navy/10 bg-school-cream/60 p-5">
        <p className="text-sm text-school-muted">
          💡 <strong className="text-school-navy">Storage note:</strong> Photos are stored in
          Cloudinary and the description in the database, so changes appear on the public {pageName}
          page for all visitors and devices.
        </p>
      </div>
    </div>
  );
}

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}
