import { useState } from 'react';
import { usePhotoKey } from '../../hooks/usePhotoKey';
import type { PhotoMetadata } from '../../data/photoService';
import type { KeyedPhoto } from '../../services/photoKeyApi';
import {
  addKeyedPhoto,
  dataUrlToFile,
  nextOrder,
  removeKeyedPhoto,
  reorderKeyedPhotos,
} from '../../services/photoKeyApi';
import { SectionHeader } from './SectionHeader';
import { PhotoGridManager } from './PhotoGridManager';
import { LegacyImportNotice } from './LegacyImportNotice';

interface SchoolPageHeroManagerProps {
  pageKey: 'nursery' | 'primary' | 'higherSecondary';
  pageTitle: string;
  pagePath: string;
  description: string;
}

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

export function SchoolPageHeroManager({
  pageKey,
  pageTitle,
  pagePath,
  description,
}: SchoolPageHeroManagerProps) {
  const configKey = `schoolPageHeroes.${pageKey}`;
  const { photos: backendPhotos, reload, setError, error } = usePhotoKey(configKey);
  const [busy, setBusy] = useState(false);
  const photos = backendPhotos.map(toMetadata);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Action failed. Please try again.');
    } finally {
      await reload();
      setBusy(false);
    }
  };

  return (
    <div>
      <SectionHeader
        badge={pageTitle.toUpperCase()}
        title={`${pageTitle} Page Hero Carousel`}
        description={description}
      />

      <LegacyImportNotice configKeys={[configKey]} onImported={() => void reload()} />

      <div className="rounded-2xl border border-school-navy/10 bg-white p-8">
        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <PhotoGridManager
          title={`${pageTitle} Hero Images`}
          photos={photos}
          onAddPhoto={(photo) => {
            if (busy) return;
            void run(async () => {
              const file = await dataUrlToFile(photo.dataUrl as string, photo.filename || 'photo.jpg');
              await addKeyedPhoto(file, configKey, nextOrder(backendPhotos));
            });
          }}
          onRemovePhoto={(id) => {
            const target = backendPhotos.find((p) => p.configId === id);
            if (!target || busy) return;
            void run(() => removeKeyedPhoto(target.configId, target.mediaId));
          }}
          onReorderPhotos={(reordered) => {
            if (busy) return;
            void run(() => reorderKeyedPhotos(configKey, reordered.map((p) => p.id)));
          }}
          emptyMessage={`No hero images added for ${pageTitle} yet.`}
          maxPhotos={3}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-school-gold/20 bg-school-gold/5 p-6">
        <p className="text-sm font-medium text-school-navy">
          💡 <strong>Features not yet implemented:</strong>
        </p>
        <ul className="mt-2 space-y-1 text-sm text-school-muted">
          <li>• Photo upload and validation</li>
          <li>• Drag-to-reorder images</li>
          <li>• Live carousel preview</li>
          <li>• Save to persistent storage</li>
          <li>
            • View page at <code className="text-xs">{pagePath}</code>
          </li>
        </ul>
      </div>
    </div>
  );
}
