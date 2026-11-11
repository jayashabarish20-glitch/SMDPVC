import { useState } from 'react';
import { useAdminPhotos } from '../../hooks/useAdminPhotos';
import { useAdminPhotoConfig } from '../../hooks/useAdminPhotoConfig';
import { SectionHeader } from './SectionHeader';
import { PhotoGridManager } from './PhotoGridManager';
import { UploadPhotoDialog } from './UploadPhotoDialog';
import { Icon } from '../Icon';
import type { PhotoMetadata } from '../../data/photoService';

const CONFIG_KEY = 'campusImages.hero';

export function HomeHeroManager() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { uploadAndAssign, deletePhoto, reorderPhotos, loading, error, clearError } =
    useAdminPhotos();
  const photoConfig = useAdminPhotoConfig();
  const heroPhotos = photoConfig.campusImages.hero;

  const handleUploadPhoto = async (file: File, altText: string) => {
    try {
      const displayOrder = heroPhotos.length;
      await uploadAndAssign(file, CONFIG_KEY, displayOrder, altText);
      setIsUploadOpen(false);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleRemovePhoto = async (id: string) => {
    try {
      // Find the media_id from the AdminPhoto list
      const allPhotos = photoConfig.campusImages.hero;
      const photoToDelete = allPhotos.find((p) => p.id === id);
      if (photoToDelete?.imageUrl) {
        // Extract media_id - for now we'll use the id as media_id
        // In a real scenario, we'd store media_id in PhotoMetadata
        await deletePhoto(id);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleReorderPhotos = async (reorderedPhotos: PhotoMetadata[]) => {
    try {
      const mediaIds = reorderedPhotos.map((p) => p.id);
      await reorderPhotos(CONFIG_KEY, mediaIds);
    } catch (err) {
      console.error('Reorder failed:', err);
    }
  };

  return (
    <div>
      <SectionHeader
        badge="HOME PAGE"
        title="Hero Carousel Images"
        description="Manage the background images for the home page hero carousel. Add, remove, or reorder images that rotate in the hero section."
      />

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <Icon name="x" className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={clearError}
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
          photos={heroPhotos}
          onAddPhoto={() => setIsUploadOpen(true)}
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
        isLoading={loading}
        onUpload={handleUploadPhoto}
        onClose={() => setIsUploadOpen(false)}
        errorMessage={error ?? undefined}
        onClearError={clearError}
      />
    </div>
  );
}
