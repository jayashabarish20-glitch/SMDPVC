import { useState, useRef, useEffect } from 'react';
import { aboutSectionsApi, type AboutSection } from '../../services/aboutSectionsApi';
import { uploadImage } from '../../services/mediaUploadApi';
import { Icon } from '../Icon';
import { SectionHeader } from './SectionHeader';

interface AboutSectionManagerProps {
  sectionKey: 'nursery' | 'primary' | 'higher-secondary';
  badge: string;
  title: string;
  description: string;
}

export function AboutSectionManager({
  sectionKey,
  badge,
  title,
  description: headerDescription,
}: AboutSectionManagerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [aboutData, setAboutData] = useState<AboutSection | null>(null);

  // Form states
  const [description, setDescription] = useState('');
  const [descChanged, setDescChanged] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removePhotoPending, setRemovePhotoPending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await aboutSectionsApi.getAdminSection(sectionKey);
      if (data) {
        setAboutData(data);
        setDescription(data.description || '');
      } else {
        setAboutData(null);
        setDescription('');
      }
      setPendingFile(null);
      setPreviewUrl(null);
      setRemovePhotoPending(false);
      setDescChanged(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load about section');
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
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let mediaId = aboutData?.media_id ?? null;

      // If user uploaded a new photo, upload to Cloudinary via backend
      if (pendingFile) {
        const uploaded = await uploadImage(pendingFile, `${title} photo`);
        mediaId = uploaded.id;
      } else if (removePhotoPending) {
        mediaId = null;
      }

      await aboutSectionsApi.createSection({
        section_key: sectionKey,
        description: description.trim(),
        media_id: mediaId,
      });

      setSuccessMessage('About section saved successfully to backend & Cloudinary.');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save about section');
    } finally {
      setIsSaving(false);
    }
  };

  const currentImageUrl = previewUrl || (removePhotoPending ? null : (aboutData?.media?.image_url ?? (aboutData?.media as any)?.imageUrl));

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

      {/* Photo Section */}
      <div className="rounded-2xl border border-school-navy/10 bg-white p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-serif text-xl font-bold text-school-navy">About Photograph</h3>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSaving || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-school-gold px-4 py-2.5 text-sm font-semibold text-school-navy transition-colors hover:bg-school-gold-hover disabled:opacity-50"
          >
            <Icon name={currentImageUrl ? 'upload' : 'image'} className="h-4 w-4" />
            {isSaving ? 'Uploading…' : currentImageUrl ? 'Replace Photo' : 'Add Photo'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={isSaving || loading}
          className="hidden"
          aria-label="Upload about photo"
        />

        {currentImageUrl ? (
          <div className="rounded-2xl border border-school-navy/10 overflow-hidden bg-school-cream">
            <div className="aspect-[4/3] flex items-center justify-center overflow-hidden bg-gradient-to-br from-school-navy via-school-navy-light to-school-deep">
              <img src={currentImageUrl} alt={title} className="h-full w-full object-cover" />
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

      {/* Description Section */}
      <div className="mt-6 rounded-2xl border border-school-navy/10 bg-white p-6 sm:p-8 space-y-4">
        <h3 className="font-serif text-xl font-bold text-school-navy">About Description</h3>
        <div>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setDescChanged(true);
            }}
            placeholder="Enter the about section description..."
            rows={5}
            className="w-full resize-y rounded-lg border border-school-navy/15 bg-school-cream px-3 py-2.5 text-sm text-school-navy placeholder:text-school-muted/60 transition-colors focus:border-school-gold focus:outline-none focus:ring-2 focus:ring-school-gold/20"
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || (!descChanged && !pendingFile && !removePhotoPending)}
          className="w-full rounded-lg bg-school-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-school-navy-light disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving to Database & Cloudinary…' : `Save ${title}`}
        </button>
      </div>
    </div>
  );
}
