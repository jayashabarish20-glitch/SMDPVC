import { KeyedGalleryManager } from './KeyedGalleryManager';
import { GALLERY_KEYS } from '../../hooks/useKeyedGallery';

export function NurseryLearningActivitiesGalleryManager() {
  return (
    <KeyedGalleryManager
      configKey={GALLERY_KEYS.nurseryLearning}
      badge="NURSERY PAGE"
      title="Nursery – Learning Activities Gallery"
      headerDescription="Upload and manage photographs for the Learning Activities section of the Nursery page. Add a gallery description that appears below all photographs."
      galleryName="Learning Activities"
      pageName="Nursery"
      altLabel="Nursery Learning Activities"
    />
  );
}
