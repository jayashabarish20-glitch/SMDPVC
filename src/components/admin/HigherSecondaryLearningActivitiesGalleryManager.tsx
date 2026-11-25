import { KeyedGalleryManager } from './KeyedGalleryManager';
import { GALLERY_KEYS } from '../../hooks/useKeyedGallery';

export function HigherSecondaryLearningActivitiesGalleryManager() {
  return (
    <KeyedGalleryManager
      configKey={GALLERY_KEYS.higherSecondaryLearning}
      badge="HIGHER SECONDARY PAGE"
      title="Higher Secondary – Learning Activities Gallery"
      headerDescription="Upload and manage photographs for the Learning Activities section of the Higher Secondary page. Add a gallery description that appears below all photographs."
      galleryName="Learning Activities"
      pageName="Higher Secondary"
      altLabel="Higher Secondary Learning Activities"
    />
  );
}
