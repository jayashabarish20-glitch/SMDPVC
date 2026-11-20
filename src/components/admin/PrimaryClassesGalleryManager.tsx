import { KeyedGalleryManager } from './KeyedGalleryManager';
import { GALLERY_KEYS } from '../../hooks/useKeyedGallery';

export function PrimaryClassesGalleryManager() {
  return (
    <KeyedGalleryManager
      configKey={GALLERY_KEYS.primaryClasses}
      badge="PRIMARY PAGE"
      title="Primary – Classes Gallery"
      headerDescription="Upload and manage photographs for the Classes section of the Primary page. Add a gallery description that appears below all photographs. This gallery is completely independent from the Primary Page Hero carousel."
      galleryName="Classes"
      pageName="Primary"
      altLabel="Primary Classes"
    />
  );
}
