import { KeyedGalleryManager } from './KeyedGalleryManager';
import { GALLERY_KEYS } from '../../hooks/useKeyedGallery';

export function NurseryExtracurricularGalleryManager() {
  return (
    <KeyedGalleryManager
      configKey={GALLERY_KEYS.nurseryExtracurricular}
      badge="NURSERY PAGE"
      title="Nursery – Extracurricular Gallery"
      headerDescription="Upload and manage photographs for the Extracurricular section of the Nursery page. Add a gallery description that appears below all photographs."
      galleryName="Extracurricular"
      pageName="Nursery"
      altLabel="Nursery Extracurricular"
    />
  );
}
