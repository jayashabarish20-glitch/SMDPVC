import { useState, useRef } from 'react';
import { Icon } from '../Icon';
import type { PhotoMetadata } from '../../data/photoService';
import {
  handleFileInput,
  generateSemanticFilename,
  type UploadedImage,
  type ImageUploadError,
} from '../../utils/imageUpload';

interface PhotoGridManagerProps {
  title: string;
  photos: PhotoMetadata[];
  onAddPhoto?: (photo: PhotoMetadata) => void;
  onRemovePhoto: (id: string) => void;
  onReorderPhotos: (photos: PhotoMetadata[]) => void;
  emptyMessage: string;
  maxPhotos?: number;
  sectionId?: string;
}

export function PhotoGridManager({
  title,
  photos,
  onAddPhoto,
  onRemovePhoto,
  onReorderPhotos,
  emptyMessage,
  maxPhotos,
  sectionId = 'photo',
}: PhotoGridManagerProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setIsUploading(true);

    try {
      const result = await handleFileInput(e);

      if ('type' in result && result.type) {
        // Error
        setUploadError((result as ImageUploadError).message);
      } else {
        // Success
        const uploaded = result as UploadedImage;
        const filename = generateSemanticFilename(
          uploaded.filename,
          sectionId,
          photos.length
        );

        const photoMetadata: PhotoMetadata = {
          id: filename.replace(/\.[^/.]+$/, ''),
          filename: filename,
          alt: title,
          updatedAt: new Date().toISOString(),
        };

        // Store the data URL for display
        photoMetadata.dataUrl = uploaded.dataUrl;

        if (onAddPhoto) {
          onAddPhoto(photoMetadata);
          setUploadError(null);
        }
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddPhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragStart = (id: string) => {
    setDraggedItem(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = photos.findIndex((p) => p.id === draggedItem);
    const targetIndex = photos.findIndex((p) => p.id === targetId);

    const reordered = [...photos];
    [reordered[draggedIndex], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[draggedIndex],
    ];

    onReorderPhotos(reordered);
    setDraggedItem(null);
  };

  const isFull = Boolean(maxPhotos && photos.length >= maxPhotos);

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={isFull || isUploading}
        className="hidden"
        aria-label="Upload image"
      />

      {/* Error message */}
      {uploadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-serif text-xl font-bold text-school-navy">
          {title}
        </h3>
        <button
          onClick={handleAddPhotoClick}
          disabled={isFull || isUploading}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            isFull || isUploading
              ? 'cursor-not-allowed bg-school-navy/10 text-school-navy/50'
              : 'bg-school-gold text-school-navy hover:bg-school-gold-hover'
          }`}
        >
          <Icon name="plus" className="h-4 w-4" />
          {isUploading ? 'Uploading...' : 'Add Photo'}
        </button>
      </div>

      {photos.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-school-navy/20 py-12 text-center">
          <Icon name="image" className="mx-auto mb-3 h-10 w-10 text-school-gold/40" />
          <p className="text-sm text-school-muted">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              draggable
              onDragStart={() => handleDragStart(photo.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(photo.id)}
              className={`group relative rounded-2xl border-2 border-dashed transition-all ${
                draggedItem === photo.id
                  ? 'border-school-gold bg-school-gold/5 opacity-50'
                  : 'border-school-navy/10 hover:border-school-gold/40'
              } overflow-hidden bg-school-cream p-3 cursor-move`}
            >
              {/* Placeholder Image */}
              <div className="relative aspect-[16/10] rounded-lg bg-gradient-to-br from-school-navy via-school-navy-light to-school-deep flex items-center justify-center overflow-hidden">
                {photo.dataUrl ? (
                  <img
                    src={photo.dataUrl}
                    alt={photo.filename}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center text-white/60">
                    <Icon name="image" className="mx-auto mb-2 h-6 w-6" />
                    <p className="text-xs">{photo.filename}</p>
                  </div>
                )}
              </div>

              {/* Photo Info */}
              <div className="mt-3">
                <p className="truncate text-xs font-bold text-school-navy">
                  {photo.filename}
                </p>
                <p className="mt-1 truncate text-[11px] text-school-muted">
                  {photo.alt}
                </p>
                <p className="mt-1 text-[10px] text-school-muted/60">
                  {new Date(photo.updatedAt).toLocaleDateString()}
                </p>
              </div>

              {/* Delete Button */}
              <button
                onClick={() =>
                  deleteConfirm === photo.id
                    ? onRemovePhoto(photo.id)
                    : setDeleteConfirm(photo.id)
                }
                className={`absolute right-2 top-2 rounded-lg p-2 transition-colors ${
                  deleteConfirm === photo.id
                    ? 'bg-red-500 text-white'
                    : 'bg-white/80 text-school-navy opacity-0 group-hover:opacity-100'
                }`}
              >
                <Icon name="trash" className="h-4 w-4" />
              </button>

              {deleteConfirm === photo.id && (
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="absolute left-2 top-2 rounded-lg bg-white/80 px-2 py-1 text-xs font-medium text-school-navy transition-colors hover:bg-white"
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {maxPhotos && (
        <p className="mt-3 text-xs text-school-muted">
          {photos.length} / {maxPhotos} photos
        </p>
      )}
    </div>
  );
}
