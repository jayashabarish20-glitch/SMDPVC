import { useState, useRef } from 'react';
import { Icon } from '../Icon';
import type { PhotoMetadata } from '../../data/photoService';
import {
  handleFileInput,
  generateSemanticFilename,
  type UploadedImage,
  type ImageUploadError,
} from '../../utils/imageUpload';

interface SinglePhotoManagerProps {
  title: string;
  description: string;
  currentPhoto: PhotoMetadata | null;
  onUpdate: (photo: PhotoMetadata) => void;
  onRemove: () => void;
  sectionId?: string; // For semantic filename generation
}

export function SinglePhotoManager({
  title,
  description,
  currentPhoto,
  onUpdate,
  onRemove,
  sectionId = 'photo',
}: SinglePhotoManagerProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
        setPreviewUrl(null);
      } else {
        // Success
        const uploaded = result as UploadedImage;
        setPreviewUrl(uploaded.dataUrl);

        // Auto-save if user confirms
        setTimeout(() => {
          if (
            window.confirm(
              `Save this image? File: ${uploaded.filename} (${(uploaded.size / 1024).toFixed(0)}KB)`
            )
          ) {
            handleSave(uploaded);
          }
        }, 100);
      }
    } catch (error) {
      setUploadError('Failed to upload image');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = (uploaded: UploadedImage) => {
    const filename = generateSemanticFilename(
      uploaded.filename,
      sectionId
    );

    const photoMetadata: PhotoMetadata = {
      id: filename.replace(/\.[^/.]+$/, ''),
      filename: filename,
      alt: title,
      updatedAt: new Date().toISOString(),
    };

    // Store the data URL as the image reference
    // In a real app, this would be uploaded to a server and we'd store the server URL
    photoMetadata.dataUrl = uploaded.dataUrl;

    onUpdate(photoMetadata);
    setPreviewUrl(null);
    setUploadError(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="font-serif text-lg font-bold text-school-navy">
          {title}
        </h3>
        <p className="mt-1 text-sm text-school-muted">{description}</p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={isUploading}
        className="hidden"
        aria-label="Upload image"
      />

      {/* Error message */}
      {uploadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}

      {/* Preview before save */}
      {previewUrl && !currentPhoto && (
        <div className="mb-4 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">Preview</p>
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <p className="text-xs text-amber-800">
            Click "Replace Photo" to save this image
          </p>
        </div>
      )}

      {currentPhoto ? (
        <div className="space-y-4">
          {/* Current Photo Preview */}
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden group">
            {currentPhoto.dataUrl ? (
              <img
                src={currentPhoto.dataUrl}
                alt={currentPhoto.filename}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-school-navy via-school-navy-light to-school-deep flex items-center justify-center">
                <div className="text-center text-white/60">
                  <Icon name="image" className="mx-auto mb-2 h-8 w-8" />
                  <p className="text-sm">{currentPhoto.filename}</p>
                </div>
              </div>
            )}

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="space-y-2">
                <p className="text-center text-white text-sm font-medium">
                  {currentPhoto.filename}
                </p>
                <p className="text-center text-white/80 text-xs">
                  {new Date(currentPhoto.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1 min-w-[150px] rounded-lg bg-school-gold px-4 py-2.5 text-sm font-medium text-school-navy transition-colors hover:bg-school-gold-hover disabled:opacity-50"
            >
              <Icon name="upload" className="mr-2 inline h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Replace Photo'}
            </button>
            <button
              onClick={() =>
                deleteConfirm ? onRemove() : setDeleteConfirm(true)
              }
              disabled={isUploading}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                deleteConfirm
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'border border-red-500/30 text-red-600 hover:bg-red-50'
              }`}
            >
              <Icon name="trash" className="mr-2 inline h-4 w-4" />
              {deleteConfirm ? 'Confirm Delete' : 'Remove'}
            </button>
            {deleteConfirm && (
              <button
                onClick={() => setDeleteConfirm(false)}
                className="rounded-lg border border-school-navy/20 px-4 py-2.5 text-sm font-medium text-school-navy transition-colors hover:bg-school-cream"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-school-navy/20 py-12 text-center hover:border-school-gold/40 hover:bg-school-gold/5 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Icon name="image" className="mx-auto mb-3 h-10 w-10 text-school-gold/40" />
          <p className="text-sm text-school-muted mb-4">
            No photo uploaded yet
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-lg bg-school-gold px-4 py-2.5 text-sm font-medium text-school-navy transition-colors hover:bg-school-gold-hover disabled:opacity-50"
          >
            <Icon name="upload" className="h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Choose Photo'}
          </button>
          <p className="mt-2 text-xs text-school-muted">
            Supported: JPG, PNG, WebP (Max 5MB)
          </p>
        </div>
      )}
    </div>
  );
}
