import { useState } from 'react';
import { Icon } from '../Icon';
import { SectionHeader } from './SectionHeader';

export interface CardItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  displayOrder: number;
}

interface MultiItemCardManagerProps {
  badge: string;
  title: string;
  description: string;
  items: CardItem[];
  loading: boolean;
  error: string | null;
  onAdd: () => void;
  onEdit: (item: CardItem) => void;
  onDelete: (id: string) => Promise<void>;
  onReorder: (ids: string[]) => Promise<void>;
  renderForm?: (isEditing: boolean) => React.ReactNode;
  onRetry?: () => void;
}

export function MultiItemCardManager({
  badge,
  title,
  description,
  items,
  loading,
  error,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
  renderForm,
  onRetry,
}: MultiItemCardManagerProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

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
    [newOrder[draggedIndex], newOrder[targetIndex]] = [
      newOrder[targetIndex],
      newOrder[draggedIndex],
    ];

    const newIds = newOrder.map((item) => item.id);
    await onReorder(newIds);
    setDraggedId(null);
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    await onDelete(id);
    setDeleteConfirm(null);
  };

  return (
    <div>
      <SectionHeader badge={badge} title={title} description={description} />

      <div className="space-y-6">
        {/* Form Section */}
        {renderForm && <div className="rounded-2xl border border-school-navy/10 bg-white p-8">{renderForm(false)}</div>}

        {/* Items Section */}
        <div className="rounded-2xl border border-school-navy/10 bg-white p-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-school-navy">{title}</h3>
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-school-gold px-4 py-2 text-sm font-semibold text-school-navy transition-colors hover:bg-school-gold-light"
            >
              <Icon name="plus" className="h-4 w-4" />
              Add Item
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 border-4 border-school-gold/30 border-t-school-gold rounded-full animate-spin" />
                <p className="text-school-muted">Loading items...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-center">
              <p className="text-red-700">{error}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 underline"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {!loading && items.length === 0 && !error && (
            <p className="py-12 text-center text-school-muted">No items yet. Click "Add Item" to create one.</p>
          )}

          {!loading && items.length > 0 && (
            <div className="space-y-4">
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
                  <div className="flex items-start gap-4">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-16 w-16 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-school-navy truncate">{item.title}</h4>
                      {item.description && (
                        <p className="text-sm text-school-muted line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(item)}
                        className="rounded-lg bg-school-navy/10 p-2 text-school-navy transition-colors hover:bg-school-navy/20"
                        aria-label="Edit"
                      >
                        <Icon name="edit" className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
