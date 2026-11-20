import { KeyedGalleryManager } from './KeyedGalleryManager';
import { GALLERY_KEYS } from '../../hooks/useKeyedGallery';

export function PrimaryExtracurricularGalleryManager() {
  return (
    <KeyedGalleryManager
      configKey={GALLERY_KEYS.primaryExtracurricular}
      badge="PRIMARY PAGE"
      title="Primary – Extracurricular Gallery"
      headerDescription="Upload and manage photographs for the Extracurricular section of the Primary page. Add a gallery description that appears below all photographs."
      galleryName="Extracurricular"
      pageName="Primary"
      altLabel="Primary Extracurricular"
    />
  );
}
