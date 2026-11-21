import { useState, useEffect, useRef } from 'react';
import { getToken } from '../../utils/storage';
import { handleFileInput, type UploadedImage } from '../../utils/imageUpload';
import { Icon } from '../Icon';
import { SectionHeader } from './SectionHeader';

interface Achievement {
  id: string;
  description: string;
  display_order: number;
  is_active: boolean;
  media_id: string | null;
  media?: { id: string; image_url: string } | null;
}

interface AchievementFormData {
  description: string;
  is_active: boolean;
  media_id: string | null;
  imageFile?: File;
  imagePreviewUrl?: string;
}

export function SportsAchievementsManager() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<AchievementFormData>({
    description: '',
    is_active: true,
    media_id: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = getToken();
  const API_BASE = '/api/admin';

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/sports-achievements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to load achievements');
      const data = await response.json();
      setAchievements(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt_text', 'Sports achievement photo');

      const response = await fetch('/api/media/upload-topper', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData as any).detail || 'Upload failed');
      }

      const data = await response.json();
      return data.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (data: AchievementFormData) => {
    if (!data.imageFile && !data.media_id) {
      setError('Please upload a photo');
      return;
    }

    try {
      setError(null);
      let mediaId = data.media_id;

      if (data.imageFile) {
        const uploadedId = await handleImageUpload(data.imageFile);
        if (!uploadedId) return;
        mediaId = uploadedId;
      }

      const payload = {
        description: data.description,
        is_active: data.is_active,
        media_id: mediaId,
      };

      const response = await fetch(`${API_BASE}/sports-achievements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData as any).detail || 'Save failed');
      }

      await loadAchievements();
      setCreateForm({
        description: '',
        is_active: true,
        media_id: null,
      });
      setCreating(false);
      setSuccessMessage('Sports achievement photo uploaded successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleDelete = async (achievementId: string) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE}/sports-achievements/${achievementId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Delete failed');

      await loadAchievements();
      setSuccessMessage('Photo deleted successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) return <p className="text-center text-school-muted">Loading achievements...</p>;

  return (
    <div>
      <SectionHeader
        badge="HIGHER SECONDARY"
        title="Sports Achievements"
        description="Upload and manage sports achievement photos."
      />

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

      {!creating && (
        <button
          onClick={() => setCreating(true)}
          className="mb-6 rounded-lg bg-school-gold px-4 py-2.5 text-sm font-semibold text-school-navy hover:bg-school-gold-hover"
        >
          <Icon name="plus" className="inline h-4 w-4 mr-2" />
          Upload Photo
        </button>
      )}

      {creating && (
        <div className="mb-6 rounded-2xl border border-school-navy/10 bg-white p-6 space-y-4">
          <h3 className="font-serif text-xl font-bold text-school-navy">Upload Achievement Photo</h3>

          <div>
            <label className="block text-sm font-semibold text-school-navy mb-1">Photo Description</label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-school-navy/15 px-3 py-2 text-school-navy focus:border-school-gold focus:outline-none"
            />
          </div>

          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="rounded-lg bg-school-gold px-3 py-2 text-sm font-semibold text-school-navy hover:bg-school-gold-hover disabled:opacity-50"
            >
              <Icon name={createForm.imageFile ? 'upload' : 'image'} className="inline h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : createForm.imageFile ? 'Replace Photo' : 'Select Photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const result = await handleFileInput(e);
                  if ('dataUrl' in result) {
                    setCreateForm({
                      ...createForm,
                      imageFile: file,
                      imagePreviewUrl: (result as UploadedImage).dataUrl,
                    });
                  }
                }
              }}
              className="hidden"
            />
            {createForm.imagePreviewUrl && (
              <div className="mt-2 rounded-lg overflow-hidden bg-school-cream-alt">
                <img src={createForm.imagePreviewUrl} alt="Preview" className="max-h-48 object-cover" />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleSave(createForm)}
              className="flex-1 rounded-lg bg-school-gold px-4 py-2.5 text-sm font-semibold text-school-navy hover:bg-school-gold-hover"
            >
              Upload
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setCreateForm({
                  description: '',
                  is_active: true,
                  media_id: null,
                });
              }}
              className="flex-1 rounded-lg border border-school-navy/15 px-4 py-2.5 text-sm font-semibold text-school-navy hover:bg-school-cream"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Achievements Grid */}
      {achievements.length > 0 && (
        <div className="rounded-2xl border border-school-navy/10 bg-white p-6">
          <h3 className="font-serif text-xl font-bold text-school-navy mb-4">Achievement Photos ({achievements.length})</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="rounded-lg overflow-hidden border border-school-navy/10">
                {achievement.media?.image_url && (
                  <img src={achievement.media.image_url} alt="Achievement" className="w-full h-40 object-cover" />
                )}
                <div className="p-3">
                  <p className="text-sm text-school-muted">{achievement.description || 'No description'}</p>
                  <button
                    onClick={() => handleDelete(achievement.id)}
                    className="mt-2 w-full rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
