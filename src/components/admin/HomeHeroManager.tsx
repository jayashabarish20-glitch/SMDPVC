import { usePhotoConfig } from '../../hooks/usePhotoConfig';
import { SectionHeader } from './SectionHeader';
import { PhotoGridManager } from './PhotoGridManager';

export function HomeHeroManager() {
  const { config, addPhoto, removePhoto, reorderPhotos } =
    usePhotoConfig();

  return (
    <div>
      <SectionHeader
        badge="HOME PAGE"
        title="Hero Carousel Images"
        description="Manage the background images for the home page hero carousel. Add, remove, or reorder images that rotate in the hero section."
      />

      <div className="rounded-2xl border border-school-navy/10 bg-white p-8">
        <PhotoGridManager
          title="Hero Carousel Images"
          photos={config.campusImages.hero}
          onAddPhoto={(photo) => addPhoto('campusImages.hero', photo)}
          onRemovePhoto={(id) => removePhoto('campusImages.hero', id)}
          onReorderPhotos={(photos) => reorderPhotos('campusImages.hero', photos)}
          emptyMessage="No hero images added yet. Upload images to create the carousel."
          maxPhotos={undefined}
        />
      </div>

      {/* Mocked Features Coming Soon */}
      <div className="mt-6 rounded-2xl border border-school-gold/20 bg-school-gold/5 p-6">
        <p className="text-sm font-medium text-school-navy">
          💡 <strong>Features not yet implemented:</strong>
        </p>
        <ul className="mt-2 space-y-1 text-sm text-school-muted">
          <li>• Photo upload and validation</li>
          <li>• Image compression and optimization</li>
          <li>• Drag-to-reorder functionality</li>
          <li>• Live carousel preview</li>
          <li>• Save to persistent storage</li>
        </ul>
      </div>
    </div>
  );
}
