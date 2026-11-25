import { KeyedGalleryManager } from './KeyedGalleryManager';
import { GALLERY_KEYS } from '../../hooks/useKeyedGallery';

export function PrimaryLearningActivitiesGalleryManager() {
  return (
    <KeyedGalleryManager
      configKey={GALLERY_KEYS.primaryLearning}
      badge="PRIMARY PAGE"
      title="Primary – Learning Activities Gallery"
      headerDescription="Upload and manage photographs for the Learning Activities section of the Primary page. Add a gallery description that appears below all photographs."
      galleryName="Learning Activities"
      pageName="Primary"
      altLabel="Primary Learning Activities"
    />
  );
}
