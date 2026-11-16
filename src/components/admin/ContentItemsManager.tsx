import { useEffect, useState } from "react";
import {
  contentItemsApi,
  type ContentItem,
  type ContentItemUpdate,
} from "../../services/contentItemsApi";
import { Icon } from "../Icon";
import { SectionHeader } from "./SectionHeader";

const ALLOWED_SECTIONS: Record<string, string[]> = {
  home: ["infrastructure"],
  nursery: ["classes", "learning", "extracurricular"],
  primary: ["classes", "learning", "extracurricular"],
};

interface ContentItemFormState {
  page_slug: string;
  section_key: string;
  title: string;
  description: string;
  is_active: boolean;
  media_id: string | null;
}

export function ContentItemsManager() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState("home");
  const [selectedSection, setSelectedSection] = useState("infrastructure");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ContentItemFormState | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<ContentItemFormState>({
    page_slug: "home",
    section_key: "infrastructure",
    title: "",
    description: "",
    is_active: true,
    media_id: null,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await contentItemsApi.getAdminItems(
        selectedPage,
        selectedSection,
      );
      setItems(data);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load content items";
      setError(message);
      console.error("Failed to load content items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [selectedPage, selectedSection]);

  const handleCreateChange = (
    key: keyof ContentItemFormState,
    value: unknown,
  ) => {
    setCreateForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleEditChange = (key: keyof ContentItemFormState, value: unknown) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [key]: value,
      });
    }
  };

  const startEdit = (item: ContentItem) => {
    setEditingId(item.id);
    setEditForm({
      page_slug: item.page_slug,
      section_key: item.section_key,
      title: item.title,
      description: item.description,
      is_active: item.is_active,
      media_id: item.media_id,
    });
    setDeleteConfirm(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveItem = async (itemId: string) => {
    if (!editForm) return;

    try {
      const updates: ContentItemUpdate = {
        title: editForm.title,
        description: editForm.description,
        is_active: editForm.is_active,
        media_id: editForm.media_id,
      };

      const updated = await contentItemsApi.updateItem(itemId, updates);
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? updated : item)),
      );
      setEditingId(null);
      setEditForm(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      alert(message);
      console.error("Failed to save item:", err);
    }
  };

  const createItem = async () => {
    if (!createForm.title.trim()) {
      alert("Title is required");
      return;
    }

    try {
      const newItem = await contentItemsApi.createItem({
        page_slug: createForm.page_slug,
        section_key: createForm.section_key,
        title: createForm.title,
        description: createForm.description,
        is_active: createForm.is_active,
        media_id: createForm.media_id,
      });

      setItems((prev) => [...prev, newItem]);
      setCreateForm({
        page_slug: selectedPage,
        section_key: selectedSection,
        title: "",
        description: "",
        is_active: true,
        media_id: null,
      });
      setCreating(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create";
      alert(message);
      console.error("Failed to create item:", err);
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      await contentItemsApi.deleteItem(itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      setDeleteConfirm(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete";
      alert(message);
      console.error("Failed to delete item:", err);
    }
  };

  const sections = ALLOWED_SECTIONS[selectedPage] || [];
  const currentItems = items.filter(
    (item) => item.section_key === selectedSection,
  );

  return (
    <div>
      <SectionHeader
        badge="CONTENT MANAGEMENT"
        title="Manage Content Items"
        description="Create, edit, and organize content for different school sections."
      />

      <div className="space-y-6">
        {/* Page and Section Selector */}
        <div className="rounded-2xl border border-school-navy/10 bg-white p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-school-navy">
                Page
              </label>
              <select
                value={selectedPage}
                onChange={(e) => {
                  setSelectedPage(e.target.value);
                  const newSection = ALLOWED_SECTIONS[e.target.value]?.[0];
                  if (newSection) {
                    setSelectedSection(newSection);
                  }
                }}
                className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy"
              >
                <option value="home">Home (Group of Schools)</option>
                <option value="nursery">Nursery</option>
                <option value="primary">Primary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-school-navy">
                Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2 text-school-navy"
              >
                {sections.map((section) => (
                  <option key={section} value={section}>
                    {section.charAt(0).toUpperCase() +
                      section.slice(1).replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content Items List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="text-school-muted">Loading items...</div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadItems}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {currentItems.map((item, index) => (
              <div
                key={item.id}
                className="rounded-2xl border border-school-navy/10 bg-white p-6"
              >
                {editingId === item.id && editForm ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-school-navy">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) =>
                          handleEditChange("title", e.target.value)
                        }
                        className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-school-navy">
                        Description
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) =>
                          handleEditChange("description", e.target.value)
                        }
                        rows={4}
                        className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={editForm.is_active}
                        onChange={(e) =>
                          handleEditChange("is_active", e.target.checked)
                        }
                        id={`edit-active-${item.id}`}
                        className="h-4 w-4"
                      />
                      <label
                        htmlFor={`edit-active-${item.id}`}
                        className="text-sm font-medium text-school-navy"
                      >
                        Active
                      </label>
                    </div>
                    {item.media && (
                      <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
                        <img
                          src={item.media.image_url}
                          alt={item.media.alt_text}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => saveItem(item.id)}
                        className="flex-1 rounded-lg bg-school-gold px-4 py-2 font-semibold text-white hover:bg-school-gold-hover"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 rounded-lg border border-school-navy/20 px-4 py-2 font-semibold text-school-navy hover:bg-school-navy/5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-school-muted">
                          {index + 1}.
                        </span>
                        <div>
                          <h3 className="text-lg font-bold text-school-navy">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="mt-1 text-sm text-school-muted">
                              {item.description.substring(0, 100)}
                              {item.description.length > 100 ? "..." : ""}
                            </p>
                          )}
                          {item.media && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-school-muted">
                              <Icon name="book" className="h-3 w-3" />
                              Image attached
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="rounded-lg bg-school-gold/20 px-3 py-2 text-xs font-semibold text-school-gold hover:bg-school-gold/30"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm(
                            deleteConfirm === item.id ? null : item.id,
                          )
                        }
                        className="rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
                {deleteConfirm === item.id && editingId !== item.id && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-700">
                      Are you sure? This action cannot be undone.
                    </p>
                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {currentItems.length === 0 && !creating && (
              <div className="rounded-2xl border border-school-navy/10 bg-white p-8 text-center">
                <p className="text-school-muted">No items in this section yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Create Item Form */}
        {creating ? (
          <div className="rounded-2xl border border-school-navy/10 bg-white p-8">
            <h3 className="mb-6 text-lg font-bold text-school-navy">
              Create New Item
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-school-navy">
                  Title *
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => handleCreateChange("title", e.target.value)}
                  className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2"
                  placeholder="Enter item title"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-school-navy">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) =>
                    handleCreateChange("description", e.target.value)
                  }
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-school-navy/20 px-4 py-2"
                  placeholder="Enter description"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={createForm.is_active}
                  onChange={(e) =>
                    handleCreateChange("is_active", e.target.checked)
                  }
                  id="create-active"
                  className="h-4 w-4"
                />
                <label htmlFor="create-active" className="text-sm font-medium">
                  Active
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={createItem}
                  className="flex-1 rounded-lg bg-school-gold px-4 py-2 font-semibold text-white hover:bg-school-gold-hover"
                >
                  Create
                </button>
                <button
                  onClick={() => setCreating(false)}
                  className="flex-1 rounded-lg border border-school-navy/20 px-4 py-2 font-semibold text-school-navy hover:bg-school-navy/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="w-full rounded-2xl border border-school-gold/50 bg-school-gold/10 px-6 py-4 font-semibold text-school-gold hover:bg-school-gold/20"
          >
            + Add New Item
          </button>
        )}
      </div>
    </div>
  );
}
