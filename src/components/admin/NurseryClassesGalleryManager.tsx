import { KeyedGalleryManager } from './KeyedGalleryManager';
import { GALLERY_KEYS } from '../../hooks/useKeyedGallery';

export function NurseryClassesGalleryManager() {
  return (
    <KeyedGalleryManager
      configKey={GALLERY_KEYS.nurseryClasses}
      badge="NURSERY PAGE"
      title="Nursery – Classes Gallery"
      headerDescription="Upload and manage photographs for the Classes section of the Nursery page. Add a gallery description that appears below all photographs."
      galleryName="Classes"
      pageName="Nursery"
      altLabel="Nursery Classes"
    />
  );
}
