import { KeyedGalleryManager } from './KeyedGalleryManager';
import { GALLERY_KEYS } from '../../hooks/useKeyedGallery';

export function HigherSecondaryExtracurricularGalleryManager() {
  return (
    <KeyedGalleryManager
      configKey={GALLERY_KEYS.higherSecondaryExtracurricular}
      badge="HIGHER SECONDARY PAGE"
      title="Higher Secondary – Extracurricular Gallery"
      headerDescription="Upload and manage photographs for the Extracurricular Activities section of the Higher Secondary page. Add a gallery description that appears below all photographs."
      galleryName="Extracurricular Activities"
      pageName="Higher Secondary"
      altLabel="Higher Secondary Extracurricular"
    />
  );
}
