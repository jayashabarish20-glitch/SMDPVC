import { useEffect, useState } from 'react';
import { contentItemsApi, type ContentItem } from '../../services/contentItemsApi';
import { photoAdminApi } from '../../services/photoAdminApi';
import { validateImageFile } from '../../utils/imageUpload';
import { SectionHeader } from './SectionHeader';
import { Icon } from '../Icon';

const PAGE_SLUG = 'nursery';
const SECTION_KEY = 'learning';

interface FormState {
  title: string;
  description: string;
}

export function NurseryLearningActivitiesManager() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState & { mediaId?: string | null }>({ title: '', description: '', mediaId: null });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<FormState & { file?: File | null }>({ title: '', description: '', file: null });
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await contentItemsApi.getAdminItems(PAGE_SLUG, SECTION_KEY);
      setItems(data.sort((a, b) => a.display_order - b.display_order));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load activities';
      setError(message);
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleCreateChange = (key: keyof typeof createForm, value: unknown) => {
    setCreateForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleEditChange = (key: keyof typeof editForm, value: unknown) => {
    setEditForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError.message);
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    if (isEdit) {
      handleEditChange('file', file);
    } else {
      handleCreateChange('file', file);
    }
  };

  const createItem = async () => {
    if (!createForm.title.trim()) {
      setError('Activity name is required');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      let mediaId: string | null = null;
      if (createForm.file) {
        const media = await photoAdminApi.uploadPhoto(createForm.file, createForm.title);
        mediaId = media.id;
      }

      const newItem = await contentItemsApi.createItem({
        page_slug: PAGE_SLUG,
        section_key: SECTION_KEY,
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        is_active: true,
        media_id: mediaId,
      });

      setItems((prev) => [...prev, newItem].sort((a, b) => a.display_order - b.display_order));
      setCreateForm({ title: '', description: '', file: null });
      setPreviewUrl(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create activity';
      setError(message);
      console.error('Failed to create activity:', err);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (item: ContentItem) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title,
      description: item.description,
      mediaId: item.media_id,
    });
    setDeleteConfirm(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: '', description: '', mediaId: null });
    setPreviewUrl(null);
  };

  const saveItem = async (itemId: string) => {
    if (!editForm.title.trim()) {
      setError('Activity name is required');
      return;
    }

    try {
      let mediaId: string | null = editForm.mediaId ?? null;

      if ((editForm as any).file) {
        const media = await photoAdminApi.uploadPhoto((editForm as any).file, editForm.title);
        mediaId = media.id;

        const oldItem = items.find((i) => i.id === itemId);
        if (oldItem?.media_id && oldItem.media_id !== mediaId) {
          try {
            await photoAdminApi.deletePhoto(oldItem.media_id);
          } catch (e) {
            console.error('Failed to delete old photo:', e);
          }
        }
      }

      const updated = await contentItemsApi.updateItem(itemId, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        media_id: mediaId,
        is_active: true,
      });

      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? updated : item)).sort((a, b) => a.display_order - b.display_order)
      );
      setEditingId(null);
      setEditForm({ title: '', description: '', mediaId: null });
      setPreviewUrl(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save activity';
      setError(message);
      console.error('Failed to save activity:', err);
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      await contentItemsApi.deleteItem(itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      setDeleteConfirm(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete activity';
      setError(message);
      console.error('Failed to delete activity:', err);
    }
  };

  const reorderItems = async (newIds: string[]) => {
    try {
      await contentItemsApi.reorderItems(PAGE_SLUG, SECTION_KEY, newIds);
      setItems((prev) => newIds.map((id) => prev.find((item) => item.id === id)!));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reorder activities';
      setError(message);
      console.error('Failed to reorder activities:', err);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const draggedIndex = items.findIndex((item) => item.id === draggedId);
    const targetIndex = items.findIndex((item) => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    const newOrder = [...items];
    [newOrder[draggedIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[draggedIndex]];

    const newIds = newOrder.map((item) => item.id);
    await reorderItems(newIds);
    setDraggedId(null);
  };

  return (
    <div>
      <SectionHeader
        badge="NURSERY"
        title="Nursery Learning Activities"
        description="Manage the learning activities displayed in the Nursery section. Add, edit, delete, and reorder activity cards."
      />

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Create Form */}
      <div className="mb-6 rounded-2xl border border-school-navy/10 bg-white p-8">
        <h3 className="mb-4 text-lg font-semibold text-school-navy">Add New Activity</h3>
        <div className="space-y-4">
          <input
            type="text"
            value={createForm.title}
            onChange={(e) => handleCreateChange('title', e.target.value)}
            placeholder="Activity name"
            disabled={creating}
            className="w-full rounded-lg border border-school-navy/15 bg-school-cream px-3 py-2.5 text-sm text-school-navy placeholder:text-school-muted/60 focus:border-school-gold focus:outline-none focus:ring-2 focus:ring-school-gold/20 transition-colors disabled:opacity-50"
          />
          <textarea
            value={createForm.description}
            onChange={(e) => handleCreateChange('description', e.target.value)}
            placeholder="Activity description"
            disabled={creating}
            rows={3}
            className="w-full rounded-lg border border-school-navy/15 bg-school-cream px-3 py-2.5 text-sm text-school-navy placeholder:text-school-muted/60 focus:border-school-gold focus:outline-none focus:ring-2 focus:ring-school-gold/20 transition-colors resize-none disabled:opacity-50"
          />
          <div>
            <label className="block text-xs font-semibold text-school-navy mb-2">Activity Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e)}
              disabled={creating}
              className="block w-full text-sm text-school-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-school-gold file:text-school-navy hover:file:bg-school-gold-light disabled:opacity-50"
            />
          </div>
          <button
            onClick={createItem}
            disabled={creating || !createForm.title.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-school-gold px-4 py-2 text-sm font-semibold text-school-navy transition-colors hover:bg-school-gold-light disabled:opacity-50"
          >
            <Icon name="plus" className="h-4 w-4" />
            {creating ? 'Creating…' : 'Create Activity'}
          </button>
        </div>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 border-4 border-school-gold/30 border-t-school-gold rounded-full animate-spin" />
            <p className="text-school-muted">Loading activities...</p>
          </div>
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-lg bg-school-cream/50 p-4 text-center text-sm text-school-muted">
          No activities yet. Create one above to get started.
        </p>
      ) : (
        <div className="rounded-2xl border border-school-navy/10 bg-white p-8 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item.id)}
              className={`cursor-move rounded-lg border-2 border-dashed border-school-gold/30 bg-gradient-to-r from-school-gold/5 to-transparent p-4 transition-all ${
                draggedId === item.id ? 'opacity-50' : 'hover:border-school-gold/60'
              }`}
            >
              {editingId === item.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => handleEditChange('title', e.target.value)}
                    className="w-full rounded-lg border border-school-navy/15 bg-school-cream px-3 py-2 text-sm text-school-navy"
                  />
                  <textarea
                    value={editForm.description}
                    onChange={(e) => handleEditChange('description', e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-school-navy/15 bg-school-cream px-3 py-2 text-sm text-school-navy resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveItem(item.id)}
                      className="rounded-lg bg-school-navy px-3 py-2 text-xs font-semibold text-white hover:bg-school-navy-light"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="rounded-lg border border-school-navy/20 px-3 py-2 text-xs font-semibold text-school-navy hover:bg-school-cream"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-school-navy truncate">{item.title}</h4>
                    {item.description && <p className="text-sm text-school-muted line-clamp-2">{item.description}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(item)}
                      className="rounded-lg bg-school-navy/10 p-2 text-school-navy transition-colors hover:bg-school-navy/20"
                      aria-label="Edit"
                    >
                      <Icon name="edit" className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() =>
                        deleteConfirm === item.id ? deleteItem(item.id) : setDeleteConfirm(item.id)
                      }
                      className={`rounded-lg p-2 transition-colors ${
                        deleteConfirm === item.id
                          ? 'bg-red-500 text-white'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                      aria-label="Delete"
                    >
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-school-navy/10 bg-school-cream/60 p-5">
        <p className="text-sm text-school-muted">
          <strong className="text-school-navy">Drag to reorder:</strong> Click and drag items to change their display
          order. Changes are saved automatically.
        </p>
      </div>
    </div>
  );
}
