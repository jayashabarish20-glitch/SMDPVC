import { useState } from 'react';
import { usePhotoKey } from '../../hooks/usePhotoKey';
import type { PhotoMetadata } from '../../data/photoService';
import type { KeyedPhoto } from '../../services/photoKeyApi';
import {
  addKeyedPhoto,
  nextOrder,
  removeKeyedPhoto,
  reorderKeyedPhotos,
} from '../../services/photoKeyApi';
import { SectionHeader } from './SectionHeader';
import { PhotoGridManager } from './PhotoGridManager';
import { UploadPhotoDialog } from './UploadPhotoDialog';
import { LegacyImportNotice } from './LegacyImportNotice';
import { Icon } from '../Icon';

const CONFIG_KEY = 'campusImages.hero';

function toMetadata(photo: KeyedPhoto): PhotoMetadata {
  return {
    id: photo.configId,
    filename: photo.filename,
    alt: photo.alt,
    updatedAt: photo.updatedAt,
    imageUrl: photo.imageUrl,
    dataUrl: photo.imageUrl,
  };
}

export function HomeHeroManager() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const { photos: backendPhotos, reload, error, setError } = usePhotoKey(CONFIG_KEY);
  const photos = backendPhotos.map(toMetadata);

  const run = async (action: () => Promise<void>): Promise<boolean> => {
    setIsBusy(true);
    setError(null);
    try {
      await action();
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Action failed. Please try again.');
      return false;
    } finally {
      await reload();
      setIsBusy(false);
    }
  };

  const handleUploadPhoto = async (file: File, altText: string) => {
    const ok = await run(() =>
      addKeyedPhoto(file, CONFIG_KEY, nextOrder(backendPhotos), altText),
    );
    if (ok) setIsUploadOpen(false);
  };

  const handleRemovePhoto = (id: string) => {
    const target = backendPhotos.find((p) => p.configId === id);
    if (!target) return;
    void run(() => removeKeyedPhoto(target.configId, target.mediaId));
  };

  const handleReorderPhotos = (reordered: PhotoMetadata[]) => {
    void run(() => reorderKeyedPhotos(CONFIG_KEY, reordered.map((p) => p.id)));
  };

  return (
    <div>
      <SectionHeader
        badge="HOME PAGE"
        title="Hero Carousel Images"
        description="Manage the background images for the home page hero carousel. Add, remove, or reorder images that rotate in the hero section."
      />

      <LegacyImportNotice configKeys={[CONFIG_KEY]} onImported={() => void reload()} />

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <Icon name="x" className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs font-medium text-red-600 underline hover:text-red-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-school-navy/10 bg-white p-8">
        <PhotoGridManager
          title="Hero Carousel Images"
          photos={photos}
          onAddPhoto={() => {
            if (!isBusy) setIsUploadOpen(true);
          }}
          onRemovePhoto={handleRemovePhoto}
          onReorderPhotos={handleReorderPhotos}
          emptyMessage="No hero images added yet. Upload images to create the carousel."
          maxPhotos={undefined}
          sectionId="home-hero"
        />
      </div>

      <UploadPhotoDialog
        title="Upload Hero Image"
        isOpen={isUploadOpen}
        isLoading={isBusy}
        onUpload={handleUploadPhoto}
        onClose={() => setIsUploadOpen(false)}
        errorMessage={error ?? undefined}
        onClearError={() => setError(null)}
      />
    </div>
  );
}
