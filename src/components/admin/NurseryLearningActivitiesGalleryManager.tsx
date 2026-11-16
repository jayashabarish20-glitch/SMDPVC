import { useState, useRef } from 'react';
import { usePhotoConfig } from '../../hooks/usePhotoConfig';
import { SectionHeader } from './SectionHeader';
import { Icon } from '../Icon';
import type { PhotoMetadata } from '../../data/photoService';
import {
  handleFileInput,
  generateSemanticFilename,
  type UploadedImage,
  type ImageUploadError,
} from '../../utils/imageUpload';

export function NurseryLearningActivitiesGalleryManager() {
  const { config, updateNurseryLearningActivitiesGallery } = usePhotoConfig();

  const gallery = config.nurseryLearningActivitiesGallery ?? { photos: [], description: '' };
  const photos: PhotoMetadata[] = gallery.photos ?? [];

  const [description, setDescription] = useState<string>(gallery.description ?? '');
  const [descSaved, setDescSaved] = useState(false);
  const [descChanged, setDescChanged] = useState(false);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setIsUploading(true);
    try {
      const result = await handleFileInput(e);
      if ('type' in result && (result as ImageUploadError).type) {
        setUploadError((result as ImageUploadError).message);
      } else {
        const uploaded = result as UploadedImage;
        const filename = generateSemanticFilename(
          uploaded.filename,
          'nursery-learning-activities',
          photos.length
        );
        const newPhoto: PhotoMetadata = {
          id: filename.replace(/\.[^/.]+$/, ''),
          filename,
          alt: 'Nursery Learning Activities',
          updatedAt: new Date().toISOString(),
          dataUrl: uploaded.dataUrl,
        };
        updateNurseryLearningActivitiesGallery({ photos: [...photos, newPhoto] });
      }
    } catch {
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    updateNurseryLearningActivitiesGallery({ photos: photos.filter((p) => p.id !== id) });
    setDeleteConfirm(null);
  };

  const handleDragStart = (id: string) => setDraggedId(id);

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const from = photos.findIndex((p) => p.id === draggedId);
    const to = photos.findIndex((p) => p.id === targetId);
    const reordered = [...photos];
    [reordered[from], reordered[to]] = [reordered[to], reordered[from]];
    updateNurseryLearningActivitiesGallery({ photos: reordered });
    setDraggedId(null);
  };

  const handleSaveDescription = () => {
    updateNurseryLearningActivitiesGallery({ description });
    setDescSaved(true);
    setDescChanged(false);
  };

  const handleDescChange = (val: string) => {
    setDescription(val);
    setDescChanged(true);
    setDescSaved(false);
  };

  return (
    <div>
      <SectionHeader
        badge="NURSERY PAGE"
        title="Nursery – Learning Activities Gallery"
        description="Upload and manage photographs for the Learning Activities section of the Nursery page. Add a gallery description that appears below all photographs."
      />

      <div className="rounded-2xl border border-school-navy/10 bg-white p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-serif text-xl font-bold text-school-navy">Gallery Photographs</h3>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-lg bg-school-gold px-4 py-2.5 text-sm font-semibold text-school-navy transition-colors hover:bg-school-gold-hover disabled:opacity-50"
          >
            <Icon name="plus" className="h-4 w-4" />
            {isUploading ? 'Uploading…' : 'Add Photo'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
          aria-label="Upload nursery learning activities gallery photo"
        />

        {uploadError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {uploadError}
          </p>
        )}

        {photos.length === 0 ? (
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
                key={photo.id}
                draggable
                onDragStart={() => handleDragStart(photo.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(photo.id)}
                className={`group relative rounded-2xl border-2 overflow-hidden transition-all cursor-move ${
                  draggedId === photo.id
                    ? 'border-school-gold bg-school-gold/5 opacity-50'
                    : 'border-school-navy/10 hover:border-school-gold/40 bg-school-cream'
                } p-3`}
              >
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-school-navy via-school-navy-light to-school-deep">
                  {photo.dataUrl ? (
                    <img
                      src={photo.dataUrl}
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
                  onClick={() => handleDelete(photo.id)}
                  className={`absolute right-4 top-4 rounded-lg p-1.5 transition-colors text-sm font-semibold ${
                    deleteConfirm === photo.id
                      ? 'bg-red-500 text-white'
                      : 'bg-white/80 text-school-navy opacity-0 group-hover:opacity-100'
                  }`}
                  title={deleteConfirm === photo.id ? 'Confirm delete' : 'Delete photo'}
                >
                  <Icon name="trash" className="h-4 w-4" />
                </button>
                {deleteConfirm === photo.id && (
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
            <span className="font-normal text-school-muted">(shown below the gallery on the Nursery page)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => handleDescChange(e.target.value)}
            placeholder="Enter a description for the Learning Activities gallery that will appear below the photographs on the Nursery page."
            rows={4}
            className="w-full rounded-lg border border-school-navy/15 bg-school-cream px-3 py-2.5 text-sm text-school-navy placeholder:text-school-muted/60 focus:border-school-gold focus:outline-none focus:ring-2 focus:ring-school-gold/20 transition-colors resize-y"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveDescription}
            className="inline-flex items-center gap-2 rounded-lg bg-school-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-school-navy-light"
          >
            <Icon name="save" className="h-4 w-4" />
            Save Description
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-school-navy/10 bg-school-cream/60 p-5">
        <p className="text-sm text-school-muted">
          💡 <strong className="text-school-navy">Storage note:</strong> Gallery data is saved to
          your browser's local storage and persists across page refreshes on this device. Changes
          appear immediately on the public Nursery page.
        </p>
      </div>
    </div>
  );
}
