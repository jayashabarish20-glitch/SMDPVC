import { useState, useEffect, useRef } from 'react';
import { getToken } from '../../utils/storage';
import { handleFileInput, type UploadedImage } from '../../utils/imageUpload';
import { Icon } from '../Icon';
import { SectionHeader } from './SectionHeader';

interface Sport {
  id: string;
  name: string;
  description: string;
  display_order: number;
  is_active: boolean;
  media_id: string | null;
  media?: { id: string; image_url: string } | null;
}

interface SportFormData {
  name: string;
  description: string;
  is_active: boolean;
  media_id: string | null;
  imageFile?: File;
  imagePreviewUrl?: string;
}

export function SportsManager() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<SportFormData>({
    name: '',
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
    loadSports();
  }, []);

  const loadSports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/sports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to load sports');
      const data = await response.json();
      setSports(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sports');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt_text', 'Sport photo');

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

  const handleSave = async (data: SportFormData, sportId?: string) => {
    if (!data.name.trim()) {
      setError('Sport name is required');
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
        name: data.name,
        description: data.description,
        is_active: data.is_active,
        media_id: mediaId,
      };

      const url = sportId ? `${API_BASE}/sports/${sportId}` : `${API_BASE}/sports`;
      const method = sportId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
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

      await loadSports();
      setCreateForm({
        name: '',
        description: '',
        is_active: true,
        media_id: null,
      });
      setCreating(false);
      setSuccessMessage('Sport details saved successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleDelete = async (sportId: string) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE}/sports/${sportId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Delete failed');

      await loadSports();
      setSuccessMessage('Sport deleted successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };


  if (loading) return <p className="text-center text-school-muted">Loading sports...</p>;

  return (
    <div>
      <SectionHeader
        badge="HIGHER SECONDARY"
        title="Sports Categories"
        description="Manage individual sports with names, photos, and descriptions."
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

      {!creating ? (
        <button
          onClick={() => setCreating(true)}
          className="mb-6 rounded-lg bg-school-gold px-4 py-2.5 text-sm font-semibold text-school-navy hover:bg-school-gold-hover"
        >
          <Icon name="plus" className="inline h-4 w-4 mr-2" />
          Add Sport
        </button>
      ) : (
        <div className="mb-6 rounded-2xl border border-school-navy/10 bg-white p-6 space-y-4">
          <h3 className="font-serif text-xl font-bold text-school-navy">New Sport</h3>

          <div>
            <label className="block text-sm font-semibold text-school-navy mb-1">Sport Name *</label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full rounded-lg border border-school-navy/15 px-3 py-2 text-school-navy focus:border-school-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-school-navy mb-1">Description</label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              rows={3}
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
              {isUploading ? 'Uploading...' : createForm.imageFile ? 'Replace Photo' : 'Add Photo'}
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

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={createForm.is_active}
              onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })}
              className="rounded border-school-navy/20"
            />
            <span className="text-sm font-semibold text-school-navy">Active</span>
          </label>

          <div className="flex gap-2">
            <button
              onClick={() => handleSave(createForm)}
              className="flex-1 rounded-lg bg-school-gold px-4 py-2.5 text-sm font-semibold text-school-navy hover:bg-school-gold-hover"
            >
              Save Sport
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setCreateForm({
                  name: '',
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

      {/* Sports List */}
      {sports.length > 0 && (
        <div className="rounded-2xl border border-school-navy/10 bg-white p-6 space-y-4">
          <h3 className="font-serif text-xl font-bold text-school-navy">Saved Sports ({sports.length})</h3>
          {sports.map((sport) => (
            <div key={sport.id} className="flex gap-4 pb-4 border-b border-school-navy/10 last:pb-0 last:border-b-0">
              {sport.media?.image_url && (
                <img src={sport.media.image_url} alt={sport.name} className="h-16 w-16 rounded object-cover" />
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-school-navy">{sport.name}</h4>
                {sport.description && <p className="text-sm text-school-muted mt-1">{sport.description}</p>}
              </div>
              <button
                onClick={() => handleDelete(sport.id)}
                className="px-3 py-2 text-sm font-semibold text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
