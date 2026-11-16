import { useState, useRef } from 'react';
import { usePhotoConfig } from '../../hooks/usePhotoConfig';
import type { PhotoMetadata } from '../../data/photoService';
import { handleFileInput, type UploadedImage, type ImageUploadError } from '../../utils/imageUpload';
import { Icon } from '../Icon';
import { SectionHeader } from './SectionHeader';

interface PrincipalManagerProps {
  badge: string;
  title: string;
  description: string;
  sectionKey: 'primary' | 'nursery' | 'higherSecondary';
}

export function PrincipalManager({
  badge,
  title,
  description,
  sectionKey,
}: PrincipalManagerProps) {
  const { config, updatePrimaryPrincipal, updateNurseryPrincipal, updateHigherSecondaryPrincipal } = usePhotoConfig();

  const principal =
    sectionKey === 'primary'
      ? config.primaryPrincipal
      : sectionKey === 'nursery'
        ? config.nurseryPrincipal
        : config.higherSecondaryPrincipal;

  const updatePrincipal =
    sectionKey === 'primary'
      ? updatePrimaryPrincipal
      : sectionKey === 'nursery'
        ? updateNurseryPrincipal
        : updateHigherSecondaryPrincipal;

  // Photo state
  const [photo, setPhoto] = useState<PhotoMetadata | null>(principal?.photo ?? null);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Text fields state
  const [name, setName] = useState<string>(principal?.name ?? '');
  const [message, setMessage] = useState<string>(principal?.message ?? '');
  const [textChanged, setTextChanged] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        id: `${sectionKey}-principal-${Date.now()}`,
        filename,
        alt: `${title} Principal`,
        updatedAt: new Date().toISOString(),
        dataUrl: uploaded.dataUrl,
      });
      setPhotoChanged(true);
      setSuccessMessage(null);
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

  const handleDelete = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    updatePrincipal(null);
    setPhoto(null);
    setName('');
    setMessage('');
    setPhotoChanged(false);
    setTextChanged(false);
    setDeleteConfirm(false);
    setSuccessMessage(null);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setUploadError('Please enter the Principal\'s name.');
      return;
    }
    if (!photo) {
      setUploadError('Please upload a photograph.');
      return;
    }

    setUploadError(null);
    updatePrincipal({ photo, name: name.trim(), message });
    setPhotoChanged(false);
    setTextChanged(false);
    setSuccessMessage('Principal details saved successfully.');
    setDeleteConfirm(false);
  };

  return (
    <div>
      <SectionHeader
        badge={badge}
        title={title}
        description={description}
      />

      <div className="rounded-2xl border border-school-navy/10 bg-white p-6 sm:p-8 space-y-6">
        {/* Photo Section */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-serif text-xl font-bold text-school-navy">Photograph</h3>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-lg bg-school-gold px-4 py-2.5 text-sm font-semibold text-school-navy transition-colors hover:bg-school-gold-hover disabled:opacity-50"
          >
            <Icon name={photo ? 'upload' : 'image'} className="h-4 w-4" />
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
          aria-label="Upload principal photo"
        />

        {uploadError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {uploadError}
          </p>
        )}

        {successMessage && (
          <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </p>
        )}

        {photo ? (
          <div className="rounded-2xl border border-school-navy/10 overflow-hidden bg-school-cream">
            <div className="aspect-[4/3] flex items-center justify-center overflow-hidden bg-gradient-to-br from-school-navy via-school-navy-light to-school-deep">
              {photo.dataUrl ? (
                <img
                  src={photo.dataUrl}
                  alt={photo.alt}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Icon name="image" className="h-12 w-12 text-white/30" />
              )}
            </div>
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

      {/* Name and Message Section */}
      <div className="mt-6 rounded-2xl border border-school-navy/10 bg-white p-6 sm:p-8 space-y-4">
        <h3 className="font-serif text-xl font-bold text-school-navy">Principal Details</h3>

        {/* Name Field */}
        <div>
          <label htmlFor="principal-name" className="block text-sm font-semibold text-school-navy mb-2">
            Principal's Name
          </label>
          <input
            id="principal-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setTextChanged(true);
            }}
            placeholder="Enter the Principal's full name..."
            className="w-full rounded-lg border border-school-navy/15 bg-school-cream px-3 py-2.5 text-sm text-school-navy placeholder:text-school-muted/60 transition-colors focus:border-school-gold focus:outline-none focus:ring-2 focus:ring-school-gold/20"
          />
        </div>

        {/* Message Field */}
        <div>
          <label htmlFor="principal-message" className="block text-sm font-semibold text-school-navy mb-2">
            Message to Students
          </label>
          <textarea
            id="principal-message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setTextChanged(true);
            }}
            placeholder="Enter the Principal's message to students..."
            rows={5}
            className="w-full resize-y rounded-lg border border-school-navy/15 bg-school-cream px-3 py-2.5 text-sm text-school-navy placeholder:text-school-muted/60 transition-colors focus:border-school-gold focus:outline-none focus:ring-2 focus:ring-school-gold/20"
          />
        </div>

        {/* Preview */}
        <div className="rounded-lg border border-school-navy/10 bg-school-cream/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-school-muted">Public preview</p>
          {name ? (
            <div className="mt-2">
              <p className="text-sm font-bold text-school-navy">{name}</p>
              {message && <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-school-navy">{message}</p>}
            </div>
          ) : (
            <p className="mt-2 text-sm italic text-school-muted">No principal details yet.</p>
          )}
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!photoChanged && !textChanged}
          className="w-full rounded-lg bg-school-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-school-navy-light disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Principal
        </button>

        {/* Delete Button */}
        {principal && (
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
            {deleteConfirm ? 'Confirm Delete' : 'Remove Principal'}
          </button>
        )}

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
  );
}
