import { useState, useRef, useEffect } from 'react';
import {
  fetchAdminKeyedDescription,
  fetchPublicKeyedDescription,
  saveKeyedDescription,
  listAdminKey,
  listPublicKey,
  replaceSinglePhoto,
  clearSinglePhoto,
} from '../../services/photoKeyApi';
import { principalRecordKey } from '../../hooks/usePublicPrincipal';
import { Icon } from '../Icon';
import { SectionHeader } from './SectionHeader';

export interface PrincipalData {
  name: string;
  message: string;
  photoUrl: string | null;
}

interface PrincipalManagerProps {
  badge: string;
  title: string;
  description: string;
  sectionKey: 'primary' | 'nursery' | 'higherSecondary';
}

export function PrincipalManager({
  badge,
  title,
  description: headerDescription,
  sectionKey,
}: PrincipalManagerProps) {
  const configKey = `principal.${sectionKey}`;
  const recordKey = principalRecordKey(sectionKey);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Photo state
  const [currentConfigId, setCurrentConfigId] = useState<string | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removePhotoPending, setRemovePhotoPending] = useState(false);

  // Text state
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [textChanged, setTextChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyPhotos = (photos: Awaited<ReturnType<typeof listAdminKey>>) => {
    if (photos.length > 0) {
      const p = photos[photos.length - 1];
      setCurrentConfigId(p.configId);
      setCurrentPhotoUrl(p.imageUrl);
    } else {
      setCurrentConfigId(null);
      setCurrentPhotoUrl(null);
    }
  };

  /** Re-sync only the photo with the server (keeps unsaved text edits). */
  const refreshPhoto = async () => {
    try {
      applyPhotos(await listAdminKey(configKey));
      setPendingFile(null);
      setPreviewUrl(null);
      setRemovePhotoPending(false);
    } catch {
      // Leave current state; next save re-reads server state anyway.
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [photos, desc] = await Promise.all([
        listAdminKey(configKey).catch(() => listPublicKey(configKey)),
        fetchAdminKeyedDescription(recordKey).catch(() => fetchPublicKeyedDescription(recordKey)),
      ]);

      applyPhotos(photos);

      // Payload JSON holds name and message
      try {
        const parsed = JSON.parse(desc);
        setName(parsed.name || '');
        setMessage(parsed.message || '');
      } catch {
        setName(desc || '');
        setMessage('');
      }

      setPendingFile(null);
      setPreviewUrl(null);
      setRemovePhotoPending(false);
      setTextChanged(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load principal details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [sectionKey]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    setError(null);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRemovePhotoPending(false);
    setDeleteConfirm(false);
  };

  const handleRemovePhoto = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setPendingFile(null);
    setPreviewUrl(null);
    setRemovePhotoPending(true);
    setDeleteConfirm(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Please enter the Principal's name.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    let photoChanged = false;
    try {
      // 1. Photo: replace/clear based on fresh server state (never cached config ids).
      //    The old photo stays linked until the new one is fully assigned.
      let warnings: string[] = [];
      if (pendingFile) {
        ({ warnings } = await replaceSinglePhoto(pendingFile, configKey, `${title} photo`));
        photoChanged = true;
      } else if (removePhotoPending && currentConfigId) {
        ({ warnings } = await clearSinglePhoto(configKey));
        photoChanged = true;
      }
      warnings.forEach((w) => console.warn('Principal photo:', w));

      // 2. Save text in SQLite content_records
      const payloadString = JSON.stringify({ name: name.trim(), message: message.trim() });
      await saveKeyedDescription(recordKey, payloadString);

      setSuccessMessage(
        warnings.length
          ? `Principal details saved. Note: ${warnings.join(' ')}`
          : 'Principal details saved to database & Cloudinary.',
      );
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save principal details';
      if (photoChanged) {
        // Photo step succeeded; sync photo state with the server but keep the typed text.
        await refreshPhoto();
        setError(`Photo saved, but principal details could not be saved: ${msg}`);
      } else {
        setError(msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const photoToShow = previewUrl || (removePhotoPending ? null : currentPhotoUrl);

  return (
    <div>
      <SectionHeader badge={badge} title={title} description={headerDescription} />

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <div className="rounded-2xl border border-school-navy/10 bg-white p-6 sm:p-8 space-y-6">
        {/* Photo Section */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-serif text-xl font-bold text-school-navy">Photograph</h3>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSaving || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-school-gold px-4 py-2.5 text-sm font-semibold text-school-navy transition-colors hover:bg-school-gold-hover disabled:opacity-50"
          >
            <Icon name={photoToShow ? 'upload' : 'image'} className="h-4 w-4" />
            {isSaving ? 'Uploading…' : photoToShow ? 'Replace Photo' : 'Upload Photo'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={isSaving || loading}
          className="hidden"
          aria-label="Upload principal photo"
        />

        {photoToShow ? (
          <div className="rounded-2xl border border-school-navy/10 overflow-hidden bg-school-cream">
            <div className="aspect-[4/3] flex items-center justify-center overflow-hidden bg-gradient-to-br from-school-navy via-school-navy-light to-school-deep">
              <img src={photoToShow} alt={title} className="h-full w-full object-cover" />
            </div>

            <div className="p-4 space-y-3">
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={isSaving}
                className={`w-full rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  deleteConfirm
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'border border-red-200 text-red-700 hover:bg-red-50'
                }`}
              >
                <Icon name={deleteConfirm ? 'x' : 'trash'} className="inline h-4 w-4 mr-2" />
                {deleteConfirm ? 'Confirm Remove' : 'Remove Photo'}
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
            <p className="text-sm text-school-muted">No photo yet. Click to upload to Cloudinary.</p>
          </div>
        )}
        <p className="text-[11px] text-school-muted">Cloudinary upload · JPG, PNG, WebP · Max 5 MB</p>
      </div>

      {/* Name and Message Section */}
      <div className="mt-6 rounded-2xl border border-school-navy/10 bg-white p-6 sm:p-8 space-y-4">
        <h3 className="font-serif text-xl font-bold text-school-navy">Principal Details</h3>

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

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || (!textChanged && !pendingFile && !removePhotoPending)}
          className="w-full rounded-lg bg-school-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-school-navy-light disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving to Database & Cloudinary…' : `Save ${title}`}
        </button>
      </div>
    </div>
  );
}
