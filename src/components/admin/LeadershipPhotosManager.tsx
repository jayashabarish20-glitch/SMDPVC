import { useEffect, useRef, useState } from 'react';
import { leadershipApi, type LeadershipProfile } from '../../services/leadershipApi';
import { photoAdminApi } from '../../services/photoAdminApi';
import { SectionHeader } from './SectionHeader';
import { Icon } from '../Icon';
import type { PhotoMetadata } from '../../data/photoService';
import { validateImageFile } from '../../utils/imageUpload';

// ─── Types ───────────────────────────────────────────────────────────────────

type ProfileKey = 'management' | 'trustee' | 'principal';

interface ProfileFormState {
  name: string;
  designation: string;
  shortBio: string;
  message: string;
}

// ─── Default placeholders ────────────────────────────────────────────────────

const PLACEHOLDERS: Record<ProfileKey, ProfileFormState> = {
  management: {
    name: 'Name to be added',
    designation: 'Designation to be confirmed',
    shortBio: 'Add a school-approved introduction for this leader.',
    message: 'Add an approved message from this leader here once the author and wording are confirmed.',
  },
  trustee: {
    name: 'Name to be added',
    designation: 'Designation to be confirmed',
    shortBio: 'Add a school-approved introduction for this leader.',
    message: 'Add an approved message from this leader here once the author and wording are confirmed.',
  },
  principal: {
    name: 'Name to be added',
    designation: 'Designation to be confirmed',
    shortBio: 'Add a school-approved introduction for this leader.',
    message: 'Add an approved message from this leader here once the author and wording are confirmed.',
  },
};

// ─── Single Profile Card ─────────────────────────────────────────────────────

interface ProfileCardProps {
  profileKey: ProfileKey;
  title: string;
  currentPhoto: PhotoMetadata | null;
  savedText: ProfileFormState;
  onSave: (key: ProfileKey, text: ProfileFormState, photo?: File | null) => Promise<void>;
}

function ProfileCard({ profileKey, title, currentPhoto, savedText, onSave }: ProfileCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProfileFormState>(savedText);
  const [pendingPhoto, setPendingPhoto] = useState<File | null | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleField = (field: keyof ProfileFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setUploadError(validationError.message);
    } else {
      setPendingPhoto(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDeleteConfirm(false);
      setSaved(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setPendingPhoto(null);
    setPreviewUrl(null);
    setDeleteConfirm(false);
    setSaved(false);
  };

  const handleSave = async () => {
    setIsUploading(true);
    setUploadError(null);
    try {
      await onSave(profileKey, form, pendingPhoto);
      setSaved(true);
      setPendingPhoto(undefined);
      setPreviewUrl(null);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : 'Failed to save profile.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const photoToShow =
    pendingPhoto === undefined
      ? currentPhoto?.imageUrl ?? null
      : pendingPhoto instanceof File
        ? previewUrl
        : null;
  const hasUnsavedChanges =
    form.name !== savedText.name ||
    form.designation !== savedText.designation ||
    form.shortBio !== savedText.shortBio ||
    form.message !== savedText.message ||
    pendingPhoto !== undefined;

  return (
    <div className="rounded-2xl border border-school-navy/10 bg-white p-6 sm:p-8 space-y-6">
      {/* Card Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="font-serif text-xl font-bold text-school-navy">{title}</h3>
        {hasUnsavedChanges && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            Unsaved changes
          </span>
        )}
        {saved && !hasUnsavedChanges && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            ✓ Saved
          </span>
        )}
      </div>

      {/* Two-column layout: photo | text fields */}
      <div className="grid gap-6 sm:grid-cols-[200px_1fr]">

        {/* ── Photo Panel ── */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-school-navy/60">
            Photograph
          </p>

          {/* Photo preview */}
          <div
            className="relative aspect-[4/3] overflow-hidden rounded-xl border-2 border-dashed border-school-navy/20 bg-gradient-to-br from-school-navy via-school-navy-light to-school-deep cursor-pointer hover:border-school-gold/40 transition-colors group"
            onClick={() => fileInputRef.current?.click()}
          >
            {photoToShow ? (
              <img
                src={photoToShow}
                alt={title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-white/60 px-3 text-center">
                <Icon name="image" className="h-8 w-8 text-school-gold/40" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Click to upload
                </span>
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold text-school-navy">
                {photoToShow ? 'Replace photo' : 'Upload photo'}
              </span>
            </div>
            {/* Pending badge */}
            {pendingPhoto !== undefined && pendingPhoto !== null && (
              <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                Pending save
              </span>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
            aria-label={`Upload photo for ${title}`}
          />

          {/* Upload error */}
          {uploadError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {uploadError}
            </p>
          )}

          {/* Photo action buttons */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full rounded-lg bg-school-gold px-3 py-2 text-xs font-semibold text-school-navy transition-colors hover:bg-school-gold-hover disabled:opacity-50"
            >
              <Icon name="upload" className="mr-1.5 inline h-3.5 w-3.5" />
              {isUploading ? 'Uploading…' : photoToShow ? 'Replace Photo' : 'Choose Photo'}
            </button>

            {photoToShow !== null && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className={`w-full rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  deleteConfirm
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'border border-red-400/30 text-red-600 hover:bg-red-50'
                }`}
              >
                <Icon name="trash" className="mr-1.5 inline h-3.5 w-3.5" />
                {deleteConfirm ? 'Confirm Remove' : 'Remove Photo'}
              </button>
            )}
            {deleteConfirm && (
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="w-full rounded-lg border border-school-navy/20 px-3 py-2 text-xs font-semibold text-school-navy hover:bg-school-cream transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
          <p className="text-[10px] text-school-muted">JPG, PNG, WebP · Max 5 MB</p>
        </div>

        {/* ── Text Fields ── */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-school-navy/60">
            Profile Information
          </p>

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-school-navy">
              Name <span className="text-school-muted font-normal">(displayed on card)</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleField('name', e.target.value)}
              placeholder={PLACEHOLDERS[profileKey].name}
              className="w-full rounded-lg border border-school-navy/15 bg-school-cream px-3 py-2.5 text-sm text-school-navy placeholder:text-school-muted/60 focus:border-school-gold focus:outline-none focus:ring-2 focus:ring-school-gold/20 transition-colors"
            />
          </div>

          {/* Designation */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-school-navy">
              Designation <span className="text-school-muted font-normal">(title / role)</span>
            </label>
            <input
              type="text"
              value={form.designation}
              onChange={(e) => handleField('designation', e.target.value)}
              placeholder={PLACEHOLDERS[profileKey].designation}
              className="w-full rounded-lg border border-school-navy/15 bg-school-cream px-3 py-2.5 text-sm text-school-navy placeholder:text-school-muted/60 focus:border-school-gold focus:outline-none focus:ring-2 focus:ring-school-gold/20 transition-colors"
            />
          </div>

          {/* Short Bio */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-school-navy">
              Short Biography{' '}
              <span className="text-school-muted font-normal">(2–3 sentences)</span>
            </label>
            <textarea
              value={form.shortBio}
              onChange={(e) => handleField('shortBio', e.target.value)}
              placeholder={PLACEHOLDERS[profileKey].shortBio}
              rows={3}
              className="w-full rounded-lg border border-school-navy/15 bg-school-cream px-3 py-2.5 text-sm text-school-navy placeholder:text-school-muted/60 focus:border-school-gold focus:outline-none focus:ring-2 focus:ring-school-gold/20 transition-colors resize-y"
            />
          </div>

          {/* Leadership Message */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-school-navy">
              Leadership Message{' '}
              <span className="text-school-muted font-normal">(quote shown on card)</span>
            </label>
            <textarea
              value={form.message}
              onChange={(e) => handleField('message', e.target.value)}
              placeholder={PLACEHOLDERS[profileKey].message}
              rows={3}
              className="w-full rounded-lg border border-school-navy/15 bg-school-cream px-3 py-2.5 text-sm text-school-navy placeholder:text-school-muted/60 focus:border-school-gold focus:outline-none focus:ring-2 focus:ring-school-gold/20 transition-colors resize-y"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4 border-t border-school-navy/8 pt-4">
        {saved && !hasUnsavedChanges && (
          <p className="text-xs text-green-600">
            ✓ Changes saved and visible on the homepage.
          </p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={isUploading}
          className="inline-flex items-center gap-2 rounded-lg bg-school-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-school-navy-light disabled:opacity-50"
        >
          <Icon name="save" className="h-4 w-4" />
          {isUploading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Manager ─────────────────────────────────────────────────────────────

export function LeadershipPhotosManager() {
  const [profiles, setProfiles] = useState<Partial<Record<ProfileKey, LeadershipProfile>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const leaders: {
    key: ProfileKey;
    title: string;
    category: string;
    displayOrder: number;
  }[] = [
    { key: 'management', title: 'Management Profile', category: 'Management', displayOrder: 1 },
    { key: 'trustee', title: 'Trustee Profile', category: 'Trustee', displayOrder: 2 },
    { key: 'principal', title: 'School Head / Principal Profile', category: 'School Head / Principal', displayOrder: 3 },
  ];

  useEffect(() => {
    let active = true;
    leadershipApi
      .getAdminProfiles()
      .then((result) => {
        if (!active) return;
        setProfiles(
          Object.fromEntries(
            result.map((profile) => [profile.profile_key, profile]),
          ) as Partial<Record<ProfileKey, LeadershipProfile>>,
        );
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const message =
          cause instanceof Error ? cause.message : 'Failed to load leadership profiles.';
        console.error('Failed to load admin leadership profiles:', cause);
        setError(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSave = async (
    key: ProfileKey,
    text: ProfileFormState,
    photo: File | null | undefined,
    category: string,
    displayOrder: number,
  ) => {
    setError(null);
    const previous = profiles[key];
    let mediaId = previous?.media_id ?? null;
    let uploadedMediaId: string | null = null;

    try {
      if (photo instanceof File) {
        const media = await photoAdminApi.uploadPhoto(photo, `${text.name || category} profile`);
        mediaId = media.id;
        uploadedMediaId = media.id;
      } else if (photo === null) {
        mediaId = null;
      }

      const saved = await leadershipApi.saveProfile({
        profile_key: key,
        name: text.name.trim() || `Name to be added`,
        designation: text.designation.trim(),
        category,
        short_bio: text.shortBio.trim(),
        message: text.message.trim(),
        display_order: displayOrder,
        is_active: true,
        media_id: mediaId,
      });

      setProfiles((current) => ({ ...current, [key]: saved }));

      if (previous?.media_id && previous.media_id !== saved.media_id) {
        try {
          await photoAdminApi.deletePhoto(previous.media_id);
        } catch (cleanupError) {
          console.error('Profile saved, but old photo cleanup failed:', cleanupError);
          setError(
            'Profile saved, but the previous photo could not be removed from media storage.',
          );
        }
      }
    } catch (saveError) {
      if (uploadedMediaId) {
        try {
          await photoAdminApi.deletePhoto(uploadedMediaId);
        } catch (cleanupError) {
          console.error('Failed to clean up an unassigned leadership photo:', cleanupError);
        }
      }
      throw saveError;
    }
  };

  return (
    <div>
      <SectionHeader
        badge="HOME PAGE"
        title="Leadership Profiles"
        description="Manage photographs and profile information for the three leadership cards displayed on the home page. Each profile is saved independently."
      />

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {loading ? (
        <p className="py-8 text-center text-sm text-school-muted">Loading leadership profiles…</p>
      ) : (
      <div className="space-y-6">
        {leaders.map(({ key, title, category, displayOrder }) => {
          const saved = profiles[key];
          const currentPhoto: PhotoMetadata | null = saved?.media
            ? {
                id: saved.media_id ?? saved.media.id,
                filename: saved.media.original_filename,
                alt: saved.media.alt_text,
                updatedAt: '',
                imageUrl: saved.media.image_url,
              }
            : null;
          const savedText: ProfileFormState = {
            name: saved?.name ?? '',
            designation: saved?.designation ?? '',
            shortBio: saved?.short_bio ?? '',
            message: saved?.message ?? '',
          };
          return (
            <ProfileCard
              key={key}
              profileKey={key}
              title={title}
              currentPhoto={currentPhoto}
              savedText={savedText}
              onSave={(profileKey, text, photo) =>
                handleSave(profileKey, text, photo, category, displayOrder)
              }
            />
          );
        })}
      </div>
      )}

      <div className="mt-6 rounded-2xl border border-school-navy/10 bg-school-cream/60 p-5">
        <p className="text-sm text-school-muted">
          <strong className="text-school-navy">Storage note:</strong> Profile details and photos
          are saved to the school database and shared with public visitors.
        </p>
      </div>
    </div>
  );
}
