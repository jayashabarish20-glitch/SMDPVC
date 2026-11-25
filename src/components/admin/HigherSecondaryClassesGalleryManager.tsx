import { KeyedGalleryManager } from './KeyedGalleryManager';
import { GALLERY_KEYS } from '../../hooks/useKeyedGallery';

export function HigherSecondaryClassesGalleryManager() {
  return (
    <KeyedGalleryManager
      configKey={GALLERY_KEYS.higherSecondaryClasses}
      badge="HIGHER SECONDARY PAGE"
      title="Higher Secondary – Classes Gallery"
      headerDescription="Upload and manage photographs for the Classes section of the Higher Secondary page. Add a gallery description that appears below all photographs."
      galleryName="Classes"
      pageName="Higher Secondary"
      altLabel="Higher Secondary Classes"
    />
  );
}
