import { useState, useEffect, useRef } from 'react';
import { getToken } from '../../utils/storage';
import { Icon } from '../Icon';
import { mediaUrl, type MediaRef } from '../../utils/mediaUrl';
import { SectionHeader } from './SectionHeader';

interface AcademicInfo {
  id: string;
  title: string;
  description: string;
  display_order: number;
  is_active: boolean;
  media_id: string | null;
  media?: { id: string } & MediaRef | null;
}

interface InfoFormData {
  title: string;
  description: string;
  is_active: boolean;
  media_id: string | null;
  pdfFile?: File;
}

export function AcademicInformationManager() {
  const [infos, setInfos] = useState<AcademicInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<InfoFormData>({
    title: '',
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
    loadInfo();
  }, []);

  const loadInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/academic-information`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to load academic information');
      const data = await response.json();
      setInfos(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt_text', 'Academic PDF');

      const response = await fetch('/api/media/upload', {
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

  const handleSave = async (data: InfoFormData) => {
    if (!data.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!data.pdfFile && !data.media_id) {
      setError('Please upload a PDF');
      return;
    }

    try {
      setError(null);
      let mediaId = data.media_id;

      if (data.pdfFile) {
        const uploadedId = await handlePdfUpload(data.pdfFile);
        if (!uploadedId) return;
        mediaId = uploadedId;
      }

      const payload = {
        title: data.title,
        description: data.description,
        is_active: data.is_active,
        media_id: mediaId,
      };

      const response = await fetch(`${API_BASE}/academic-information`, {
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

      await loadInfo();
      setCreateForm({
        title: '',
        description: '',
        is_active: true,
        media_id: null,
      });
      setCreating(false);
      setSuccessMessage('Academic information saved successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleDelete = async (infoId: string) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE}/academic-information/${infoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Delete failed');

      await loadInfo();
      setSuccessMessage('Information deleted successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) return <p className="text-center text-school-muted">Loading information...</p>;

  return (
    <div>
      <SectionHeader
        badge="HIGHER SECONDARY"
        title="Academic Information"
        description="Upload academic documents and PDFs."
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
          Add Information
        </button>
      )}

      {creating && (
        <div className="mb-6 rounded-2xl border border-school-navy/10 bg-white p-6 space-y-4">
          <h3 className="font-serif text-xl font-bold text-school-navy">New Academic Information</h3>

          <div>
            <label className="block text-sm font-semibold text-school-navy mb-1">Title *</label>
            <input
              type="text"
              placeholder="e.g., Time Table"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full rounded-lg border border-school-navy/15 px-3 py-2 text-school-navy focus:border-school-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-school-navy mb-1">Description</label>
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
              <Icon name={createForm.pdfFile ? 'upload' : 'book'} className="inline h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : createForm.pdfFile ? 'Replace PDF' : 'Select PDF'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCreateForm({ ...createForm, pdfFile: file });
                }
              }}
              className="hidden"
            />
            {createForm.pdfFile && (
              <p className="mt-2 text-sm text-school-muted">📄 {createForm.pdfFile.name}</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleSave(createForm)}
              className="flex-1 rounded-lg bg-school-gold px-4 py-2.5 text-sm font-semibold text-school-navy hover:bg-school-gold-hover"
            >
              Save
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setCreateForm({
                  title: '',
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

      {infos.length > 0 && (
        <div className="rounded-2xl border border-school-navy/10 bg-white p-6 space-y-4">
          <h3 className="font-serif text-xl font-bold text-school-navy">Saved Information ({infos.length})</h3>
          {infos.map((info) => (
            <div key={info.id} className="flex items-center justify-between pb-4 border-b border-school-navy/10 last:pb-0 last:border-b-0">
              <div>
                <h4 className="font-semibold text-school-navy">{info.title}</h4>
                {info.description && <p className="text-sm text-school-muted mt-1">{info.description}</p>}
              </div>
              <div className="flex gap-2">
                {mediaUrl(info.media) && (
                  <a
                    href={mediaUrl(info.media) ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 text-sm font-semibold text-school-gold hover:text-school-gold-hover"
                  >
                    Download
                  </a>
                )}
                <button
                  onClick={() => handleDelete(info.id)}
                  className="px-3 py-2 text-sm font-semibold text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
