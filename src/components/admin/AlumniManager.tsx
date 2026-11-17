import { useRef, useState, useEffect, useMemo } from 'react';
import { getToken } from '../../utils/storage';
import { handleFileInput, type UploadedImage } from '../../utils/imageUpload';
import { Icon } from '../Icon';
import { SectionHeader } from './SectionHeader';

interface Alumni {
  id: string;
  name: string;
  batch_year: string;
  description: string;
  display_order: number;
  is_published: boolean;
  media_id: string | null;
  media?: { id: string; image_url: string; alt_text: string } | null;
  created_at?: string;
  updated_at?: string;
}

interface AlumniFormData {
  name: string;
  batch_year: string;
  description: string;
  is_published: boolean;
  media_id: string | null;
  imageFile?: File;
  imagePreviewUrl?: string;
}

const ITEMS_PER_PAGE = 10;

export function AlumniManager() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentEditingData, setCurrentEditingData] = useState<AlumniFormData | null>(null);
  const [createForm, setCreateForm] = useState<AlumniFormData>({
    name: '',
    batch_year: '',
    description: '',
    is_published: false,
    media_id: null,
    imageFile: undefined,
    imagePreviewUrl: undefined,
  });

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'batch_year' | 'created_at'>('batch_year');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const token = getToken();
  const API_BASE = '/api/admin';

  useEffect(() => {
    loadAlumni();
  }, []);

  const loadAlumni = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/alumni`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to load alumni');
      const data = await response.json();
      setAlumni(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alumni');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search logic
  const filteredAndSorted = useMemo(() => {
    let result = alumni.filter((alum) => {
      const matchesSearch = alum.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBatch = filterBatch === '' || alum.batch_year === filterBatch;
      return matchesSearch && matchesBatch;
    });

    // Sort
    result.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      if (sortBy === 'batch_year') {
        aVal = parseInt(a.batch_year) || 0;
        bVal = parseInt(b.batch_year) || 0;
      } else if (sortBy === 'name') {
        aVal = a.name;
        bVal = b.name;
      } else {
        aVal = a.created_at || '';
        bVal = b.created_at || '';
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [alumni, searchQuery, filterBatch, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
  const paginatedAlumni = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSorted.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSorted, currentPage]);

  // Get unique batch years for filter
  const batchYears = useMemo(() => {
    return Array.from(new Set(alumni.map((a) => a.batch_year)))
      .sort()
      .reverse();
  }, [alumni]);

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt_text', 'Alumni photo');

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

  const handleCreateChange = (key: keyof AlumniFormData, value: unknown) => {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEditChange = (key: keyof AlumniFormData, value: unknown) => {
    if (currentEditingData) {
      setCurrentEditingData({ ...currentEditingData, [key]: value });
    }
  };

  const startEdit = (alum: Alumni) => {
    setEditingId(alum.id);
    setCurrentEditingData({
      name: alum.name,
      batch_year: alum.batch_year,
      description: alum.description,
      is_published: alum.is_published,
      media_id: alum.media_id,
      imagePreviewUrl: alum.media?.image_url,
    });
  };

  const handleSave = async (data: AlumniFormData, alumniId?: string) => {
    if (!data.name.trim() || !data.batch_year.trim()) {
      setError('Name and batch year are required');
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
        batch_year: data.batch_year,
        description: data.description,
        is_published: data.is_published,
        media_id: mediaId,
      };

      const url = alumniId ? `${API_BASE}/alumni/${alumniId}` : `${API_BASE}/alumni`;
      const method = alumniId ? 'PATCH' : 'POST';

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

      await loadAlumni();
      setCreateForm({
        name: '',
        batch_year: '',
        description: '',
        is_published: false,
        media_id: null,
      });
      setEditingId(null);
      setCurrentEditingData(null);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleDelete = async (alumniId: string) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE}/alumni/${alumniId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Delete failed');

      await loadAlumni();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) return <p className="text-center text-school-muted">Loading alumni...</p>;

  return (
    <div>
      <SectionHeader
        badge="HIGHER SECONDARY"
        title="Alumni Management"
        description="Manage alumni profiles for the Higher Secondary section. Supports unlimited records with search, filtering, and pagination."
      />

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Add Alumni Form */}
      {!creating ? (
        <button
          onClick={() => setCreating(true)}
          className="mb-6 rounded-lg bg-school-gold px-4 py-2.5 text-sm font-semibold text-school-navy hover:bg-school-gold-hover"
        >
          <Icon name="plus" className="inline h-4 w-4 mr-2" />
          Add Alumni
        </button>
      ) : (
        <div className="mb-6 rounded-2xl border border-school-navy/10 bg-white p-6 space-y-4">
          <h3 className="font-serif text-xl font-bold text-school-navy">New Alumni</h3>

          <div>
            <label className="block text-sm font-semibold text-school-navy mb-1">Name *</label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => handleCreateChange('name', e.target.value)}
              className="w-full rounded-lg border border-school-navy/15 px-3 py-2 text-school-navy focus:border-school-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-school-navy mb-1">Batch Year *</label>
            <input
              type="text"
              placeholder="e.g., 2015"
              value={createForm.batch_year}
              onChange={(e) => handleCreateChange('batch_year', e.target.value)}
              className="w-full rounded-lg border border-school-navy/15 px-3 py-2 text-school-navy focus:border-school-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-school-navy mb-1">Description</label>
            <textarea
              value={createForm.description}
              onChange={(e) => handleCreateChange('description', e.target.value)}
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
                    handleCreateChange('imageFile', file);
                    handleCreateChange('imagePreviewUrl', (result as UploadedImage).dataUrl);
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
              checked={createForm.is_published}
              onChange={(e) => handleCreateChange('is_published', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-school-navy">Publish</span>
          </label>

          <div className="flex gap-2">
            <button
              onClick={() => handleSave(createForm)}
              className="flex-1 rounded-lg bg-school-navy px-4 py-2 text-sm font-semibold text-white hover:bg-school-navy-light"
            >
              Save Alumni
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setCreateForm({ name: '', batch_year: '', description: '', is_published: false, media_id: null });
              }}
              className="flex-1 rounded-lg border border-school-navy/15 px-4 py-2 text-sm font-semibold text-school-navy hover:bg-school-cream"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search, Filter, and Sort Controls */}
      {alumni.length > 0 && (
        <div className="mb-6 space-y-4 rounded-lg border border-school-navy/10 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-school-navy/15 px-3 py-2 text-sm focus:border-school-gold focus:outline-none"
            />

            <select
              value={filterBatch}
              onChange={(e) => {
                setFilterBatch(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-school-navy/15 px-3 py-2 text-sm focus:border-school-gold focus:outline-none"
            >
              <option value="">All Batches</option>
              {batchYears.map((year) => (
                <option key={year} value={year}>
                  Batch {year}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as 'name' | 'batch_year' | 'created_at');
                setCurrentPage(1);
              }}
              className="rounded-lg border border-school-navy/15 px-3 py-2 text-sm focus:border-school-gold focus:outline-none"
            >
              <option value="batch_year">Sort by Batch</option>
              <option value="name">Sort by Name</option>
              <option value="created_at">Sort by Date</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-xs text-school-muted">
            <span>
              Showing {paginatedAlumni.length} of {filteredAndSorted.length} alumni
            </span>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="rounded px-2 py-1 hover:bg-school-cream"
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>
          </div>
        </div>
      )}

      {/* Alumni List */}
      <div className="space-y-3">
        {paginatedAlumni.length === 0 ? (
          <p className="text-center text-school-muted py-8">
            {alumni.length === 0
              ? 'No alumni added yet. Click "Add Alumni" to get started.'
              : 'No results match your search or filter.'}
          </p>
        ) : (
          paginatedAlumni.map((alum) => (
            <div key={alum.id} className="rounded-lg border border-school-navy/10 bg-white p-4">
              {editingId === alum.id && currentEditingData ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={currentEditingData.name}
                    onChange={(e) => handleEditChange('name', e.target.value)}
                    className="w-full rounded border border-school-navy/15 px-2 py-1 text-school-navy"
                  />
                  <input
                    type="text"
                    value={currentEditingData.batch_year}
                    onChange={(e) => handleEditChange('batch_year', e.target.value)}
                    className="w-full rounded border border-school-navy/15 px-2 py-1 text-school-navy"
                  />
                  <textarea
                    value={currentEditingData.description}
                    onChange={(e) => handleEditChange('description', e.target.value)}
                    rows={2}
                    className="w-full rounded border border-school-navy/15 px-2 py-1 text-school-navy"
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={currentEditingData.is_published}
                      onChange={(e) => handleEditChange('is_published', e.target.checked)}
                    />
                    <span className="text-xs text-school-navy">Published</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(currentEditingData, alum.id)}
                      className="rounded bg-school-navy px-3 py-1 text-xs font-semibold text-white"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded border border-school-navy/15 px-3 py-1 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-school-navy">{alum.name}</h4>
                      <p className="text-xs text-school-muted">Batch {alum.batch_year}</p>
                      {alum.description && <p className="mt-1 text-xs text-school-navy">{alum.description}</p>}
                      <div className="mt-2 flex gap-2">
                        {!alum.is_published && (
                          <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            Draft
                          </span>
                        )}
                        <span className="inline-block rounded bg-school-navy/5 px-2 py-0.5 text-xs text-school-muted">
                          ID: {alum.id.substring(0, 8)}
                        </span>
                      </div>
                    </div>
                    {alum.media && (
                      <img src={alum.media.image_url} alt={alum.name} className="h-16 w-16 object-cover rounded ml-4" />
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => startEdit(alum)}
                      className="text-xs text-school-gold hover:text-school-gold-hover font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(deleteConfirm === alum.id ? null : alum.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      {deleteConfirm === alum.id ? 'Confirm Delete' : 'Delete'}
                    </button>
                    {deleteConfirm === alum.id && (
                      <button
                        onClick={() => handleDelete(alum.id)}
                        className="text-xs text-red-600 font-semibold"
                      >
                        Yes, Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="rounded border border-school-navy/15 px-3 py-1 text-xs disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-school-muted">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="rounded border border-school-navy/15 px-3 py-1 text-xs disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
