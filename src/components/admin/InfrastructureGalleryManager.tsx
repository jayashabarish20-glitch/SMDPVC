import { useState, useRef, useEffect } from 'react';
import { handleFileInput, type ImageUploadError } from '../../utils/imageUpload';
import { getPhotoConfig } from '../../data/photoService';
import { Icon } from '../Icon';
import { SectionHeader } from './SectionHeader';
import { useInfrastructureGallery } from '../../hooks/useInfrastructureGallery';
import {
  addInfrastructurePhoto,
  replaceInfrastructurePhoto,
  removeInfrastructurePhoto,
  reorderInfrastructurePhotos,
  saveInfrastructureDescription,
  nextDisplayOrder,
  type InfrastructurePhoto,
} from '../../services/infrastructureContentApi';

// One-time import of photos saved in this browser before the backend migration.
// Stores the ids already imported, so re-running never duplicates a photo.
const LEGACY_IMPORT_KEY = 'smdpvc_infra_legacy_import_v1';

interface LegacyPhoto {
  id: string;
  filename: string;
  dataUrl: string;
}

function readLegacyPhotos(): { photos: LegacyPhoto[]; description: string } {
  try {
    const config = getPhotoConfig();
    const legacy = config.groupOfSchoolsInfrastructure;
    const photos = (legacy?.photos ?? [])
      .filter((p) => !!p.dataUrl)
      .map((p) => ({ id: p.id, filename: p.filename || 'photo.jpg', dataUrl: p.dataUrl as string }));
    return { photos, description: legacy?.description ?? '' };
  } catch {
    return { photos: [], description: '' };
  }
}

function importedLegacyIds(): string[] {
  try {
    const raw = localStorage.getItem(LEGACY_IMPORT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function markLegacyImported(id: string) {
  const ids = importedLegacyIds();
  if (!ids.includes(id)) ids.push(id);
  localStorage.setItem(LEGACY_IMPORT_KEY, JSON.stringify(ids));
}

export function InfrastructureGalleryManager() {
  const { photos, description: savedDescription, isLoading, error, reload } =
    useInfrastructureGallery('admin');

  // Local state
  const [description, setDescription] = useState<string>('');
  const [descriptionLoaded, setDescriptionLoaded] = useState(false);
  const [descSaved, setDescSaved] = useState(false);
  const [descChanged, setDescChanged] = useState(false);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [legacy, setLegacy] = useState<LegacyPhoto[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<string | null>(null);

  // Load the saved description once, after the server responds.
  useEffect(() => {
    if (!isLoading && !descriptionLoaded) {
      setDescription(savedDescription);
      setDescriptionLoaded(true);
    }
  }, [isLoading, savedDescription, descriptionLoaded]);

  // Find legacy browser photos that are not yet imported.
  useEffect(() => {
    const { photos: legacyPhotos } = readLegacyPhotos();
    const done = importedLegacyIds();
    setLegacy(legacyPhotos.filter((p) => !done.includes(p.id)));
  }, []);

  // ── Upload ──────────────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setIsBusy(true);
    const picked = e.target.files?.[0];
    try {
      const result = await handleFileInput(e);
      if ('type' in result && (result as ImageUploadError).type) {
        setUploadError((result as ImageUploadError).message);
      } else if (picked) {
        await addInfrastructurePhoto(picked, nextDisplayOrder(photos));
        await reload();
      }
    } catch (cause) {
      setUploadError(errorMessage(cause, 'Failed to upload image. Please try again.'));
    } finally {
      setIsBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Replace ─────────────────────────────────────────────────────────────────

  const handleReplaceClick = (mediaId: string) => {
    replaceTargetRef.current = mediaId;
    replaceInputRef.current?.click();
  };

  const handleReplaceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const mediaId = replaceTargetRef.current;
    const file = e.target.files?.[0];
    if (!mediaId || !file) return;
    setUploadError(null);
    setIsBusy(true);
    try {
      await replaceInfrastructurePhoto(mediaId, file);
      await reload();
    } catch (cause) {
      setUploadError(errorMessage(cause, 'Failed to replace image. Please try again.'));
    } finally {
      setIsBusy(false);
      replaceTargetRef.current = null;
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = async (photo: InfrastructurePhoto) => {
    if (deleteConfirm !== photo.configId) {
      setDeleteConfirm(photo.configId);
      return;
    }
    setUploadError(null);
    setIsBusy(true);
    setDeleteConfirm(null);
    try {
      await removeInfrastructurePhoto(photo.configId, photo.mediaId);
      await reload();
    } catch (cause) {
      setUploadError(errorMessage(cause, 'Failed to delete photo. Please try again.'));
      await reload();
    } finally {
      setIsBusy(false);
    }
  };

  // ── Drag-to-reorder ─────────────────────────────────────────────────────────

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
      await reorderInfrastructurePhotos(reordered.map((p) => p.configId));
      await reload();
    } catch (cause) {
      setUploadError(errorMessage(cause, 'Failed to save the new order.'));
      await reload();
    } finally {
      setIsBusy(false);
    }
  };

  // ── Description save ────────────────────────────────────────────────────────

  const handleSaveDescription = async () => {
    setUploadError(null);
    setIsBusy(true);
    try {
      await saveInfrastructureDescription(description);
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

  // ── Legacy import ───────────────────────────────────────────────────────────

  const handleImportLegacy = async () => {
    setUploadError(null);
    setIsBusy(true);
    let imported = 0;
    let order = nextDisplayOrder(photos);
    try {
      for (const item of legacy) {
        const file = await dataUrlToFile(item.dataUrl, item.filename);
        await addInfrastructurePhoto(file, order);
        markLegacyImported(item.id);
        order += 1;
        imported += 1;
      }
      const legacyDescription = readLegacyPhotos().description;
      if (!description.trim() && legacyDescription.trim()) {
        await saveInfrastructureDescription(legacyDescription);
        setDescription(legacyDescription);
      }
      setLegacy([]);
      await reload();
    } catch (cause) {
      setUploadError(
        errorMessage(cause, `Imported ${imported} photo(s) before an error occurred. Run the import again to continue.`),
      );
      setLegacy((prev) => prev.filter((p) => !importedLegacyIds().includes(p.id)));
      await reload();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div>
      <SectionHeader
        badge="GROUP OF SCHOOLS"
        title="Infrastructure"
        description="Upload and manage photographs for the Infrastructure section. Add a gallery description that appears below all photographs."
      />

      {/* ── Legacy import notice ── */}
      {legacy.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-amber-800">
            {legacy.length} photo(s) were saved in this browser before the server storage update.
            Import them once so they appear for all visitors.
          </p>
          <button
            type="button"
            onClick={handleImportLegacy}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-lg bg-school-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-school-navy-light disabled:opacity-50"
          >
            Import photos from this browser
          </button>
        </div>
      )}

      {/* ── Photo Upload Section ── */}
      <div className="rounded-2xl border border-school-navy/10 bg-white p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-serif text-xl font-bold text-school-navy">Infrastructure Photographs</h3>
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

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={isBusy}
          className="hidden"
          aria-label="Upload infrastructure photo"
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleReplaceChange}
          disabled={isBusy}
          className="hidden"
          aria-label="Replace infrastructure photo"
        />

        {/* Errors */}
        {(uploadError || error) && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {uploadError ?? error}
          </p>
        )}

        {/* Photo grid */}
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
                {/* Preview */}
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
                  {/* Drag hint badge */}
                  <span className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    drag to reorder
                  </span>
                </div>

                {/* Info */}
                <div className="mt-2 px-1">
                  <p className="truncate text-xs font-semibold text-school-navy">{photo.filename}</p>
                  <p className="text-[10px] text-school-muted/70">
                    {new Date(photo.updatedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Replace button */}
                <button
                  type="button"
                  onClick={() => handleReplaceClick(photo.mediaId)}
                  disabled={isBusy}
                  className="absolute right-14 top-4 rounded-lg bg-white/80 px-2 py-1 text-xs font-semibold text-school-navy opacity-0 transition-colors hover:bg-white group-hover:opacity-100 disabled:opacity-50"
                  title="Replace photo"
                >
                  Replace
                </button>

                {/* Delete button */}
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

      {/* ── Gallery Description ── */}
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
            <span className="font-normal text-school-muted">(shown below the gallery on the Group of Schools page)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => handleDescChange(e.target.value)}
            placeholder="Enter a description for the infrastructure gallery that will appear below the photographs."
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

      {/* ── Storage note ── */}
      <div className="mt-6 rounded-2xl border border-school-navy/10 bg-school-cream/60 p-5">
        <p className="text-sm text-school-muted">
          💡 <strong className="text-school-navy">Storage note:</strong> Photos are stored in
          Cloudinary and the description in the database, so changes appear on the public Group of
          Schools page for all visitors and devices.
        </p>
      </div>
    </div>
  );
}

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}

async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}
