import { useState, useCallback } from 'react';
import {
  getPhotoConfig,
  updatePhotoConfig,
  type PhotoConfig,
  type PhotoMetadata,
  type LeadershipProfileData,
  type PrimaryClassesGalleryConfig,
  type PrimaryAboutConfig,
  type NurseryClassesGalleryConfig,
  type NurseryLearningActivitiesGalleryConfig,
  type NurseryExtracurricularGalleryConfig,
  type PrimaryLearningActivitiesGalleryConfig,
  type PrimaryExtracurricularGalleryConfig,
} from '../data/photoService';

/**
 * Hook for accessing and updating photo configuration
 *
 * Abstracts data access and provides state management for the admin panel.
 * Currently uses localStorage for persistence; re-reads on every update.
 *
 * Usage:
 * const { config, updateCampusImages, updateLeadershipPhotos, updateLeadershipProfile } = usePhotoConfig();
 */
export function usePhotoConfig() {
  const [config, setConfig] = useState<PhotoConfig>(() => getPhotoConfig());

  // Update campus images (hero, sports, principal, location, alumni, toppers)
  const updateCampusImages = useCallback(
    (updates: Partial<PhotoConfig['campusImages']>) => {
      const newConfig = updatePhotoConfig({
        campusImages: { ...config.campusImages, ...updates },
      });
      setConfig(newConfig);
    },
    [config.campusImages]
  );

  // Update leadership photos only (backward-compatible, preserves profiles text)
  const updateLeadershipPhotos = useCallback(
    (updates: Partial<PhotoConfig['leadershipPhotos']>) => {
      const newConfig = updatePhotoConfig({
        leadershipPhotos: { ...config.leadershipPhotos, ...updates },
      });
      setConfig(newConfig);
    },
    [config.leadershipPhotos]
  );

  // Update a single leadership profile's text + optional photo together
  const updateLeadershipProfile = useCallback(
    (
      key: 'management' | 'trustee' | 'principal',
      data: Partial<LeadershipProfileData>
    ) => {
      const currentProfiles = config.leadershipPhotos.profiles ?? {
        management: { photo: null, name: '', designation: '', shortBio: '', message: '' },
        trustee: { photo: null, name: '', designation: '', shortBio: '', message: '' },
        principal: { photo: null, name: '', designation: '', shortBio: '', message: '' },
      };
      const updated = {
        ...currentProfiles,
        [key]: { ...currentProfiles[key], ...data },
      };

      // Also keep legacy top-level photo fields in sync
      const photoFieldMap: Record<string, keyof PhotoConfig['leadershipPhotos']> = {
        management: 'managementPhoto',
        trustee: 'trusteePhoto',
        principal: 'principalPhoto',
      };
      const legacyUpdate: Partial<PhotoConfig['leadershipPhotos']> = {};
      if (data.photo !== undefined) {
        const field = photoFieldMap[key] as 'managementPhoto' | 'trusteePhoto' | 'principalPhoto';
        legacyUpdate[field] = data.photo;
      }

      const newConfig = updatePhotoConfig({
        leadershipPhotos: {
          ...config.leadershipPhotos,
          ...legacyUpdate,
          profiles: updated,
        },
      });
      setConfig(newConfig);
    },
    [config.leadershipPhotos]
  );

  // Update school section photos (nursery, primary, higher secondary)
  const updateSchoolSectionPhotos = useCallback(
    (updates: Partial<PhotoConfig['schoolSectionPhotos']>) => {
      const newConfig = updatePhotoConfig({
        schoolSectionPhotos: { ...config.schoolSectionPhotos, ...updates },
      });
      setConfig(newConfig);
    },
    [config.schoolSectionPhotos]
  );

  // Update school page hero images
  const updateSchoolPageHeroes = useCallback(
    (updates: Partial<PhotoConfig['schoolPageHeroes']>) => {
      const newConfig = updatePhotoConfig({
        schoolPageHeroes: { ...config.schoolPageHeroes, ...updates },
      });
      setConfig(newConfig);
    },
    [config.schoolPageHeroes]
  );

  // Update the Primary Classes Gallery (photos + description) — independent of Primary Hero
  const updatePrimaryClassesGallery = useCallback(
    (updates: Partial<PrimaryClassesGalleryConfig>) => {
      const current = config.primaryClassesGallery ?? { photos: [], description: '' };
      const newConfig = updatePhotoConfig({
        primaryClassesGallery: { ...current, ...updates },
      });
      setConfig(newConfig);
    },
    [config.primaryClassesGallery]
  );

  // Update the Primary About section independently from the gallery and hero.
  const updatePrimaryAbout = useCallback(
    (updates: Partial<PrimaryAboutConfig>) => {
      const current = config.primaryAbout ?? { photo: null, description: '' };
      const newConfig = updatePhotoConfig({
        primaryAbout: { ...current, ...updates },
      });
      setConfig(newConfig);
    },
    [config.primaryAbout]
  );

  // Update Nursery Classes Gallery (photos + description)
  const updateNurseryClassesGallery = useCallback(
    (updates: Partial<NurseryClassesGalleryConfig>) => {
      const current = config.nurseryClassesGallery ?? { photos: [], description: '' };
      const newConfig = updatePhotoConfig({
        nurseryClassesGallery: { ...current, ...updates },
      });
      setConfig(newConfig);
    },
    [config.nurseryClassesGallery]
  );

  // Update Nursery Learning Activities Gallery (photos + description)
  const updateNurseryLearningActivitiesGallery = useCallback(
    (updates: Partial<NurseryLearningActivitiesGalleryConfig>) => {
      const current = config.nurseryLearningActivitiesGallery ?? { photos: [], description: '' };
      const newConfig = updatePhotoConfig({
        nurseryLearningActivitiesGallery: { ...current, ...updates },
      });
      setConfig(newConfig);
    },
    [config.nurseryLearningActivitiesGallery]
  );

  // Update Nursery Extracurricular Gallery (photos + description)
  const updateNurseryExtracurricularGallery = useCallback(
    (updates: Partial<NurseryExtracurricularGalleryConfig>) => {
      const current = config.nurseryExtracurricularGallery ?? { photos: [], description: '' };
      const newConfig = updatePhotoConfig({
        nurseryExtracurricularGallery: { ...current, ...updates },
      });
      setConfig(newConfig);
    },
    [config.nurseryExtracurricularGallery]
  );

  // Update Primary Learning Activities Gallery (photos + description)
  const updatePrimaryLearningActivitiesGallery = useCallback(
    (updates: Partial<PrimaryLearningActivitiesGalleryConfig>) => {
      const current = config.primaryLearningActivitiesGallery ?? { photos: [], description: '' };
      const newConfig = updatePhotoConfig({
        primaryLearningActivitiesGallery: { ...current, ...updates },
      });
      setConfig(newConfig);
    },
    [config.primaryLearningActivitiesGallery]
  );

  // Update Primary Extracurricular Gallery (photos + description)
  const updatePrimaryExtracurricularGallery = useCallback(
    (updates: Partial<PrimaryExtracurricularGalleryConfig>) => {
      const current = config.primaryExtracurricularGallery ?? { photos: [], description: '' };
      const newConfig = updatePhotoConfig({
        primaryExtracurricularGallery: { ...current, ...updates },
      });
      setConfig(newConfig);
    },
    [config.primaryExtracurricularGallery]
  );

  // Add photo to array (hero, alumni, toppers)
  const addPhoto = useCallback(
    (section: string, photo: PhotoMetadata) => {
      const path = section.split('.');
      const newConfig = { ...config };

      let target: any = newConfig;
      for (let i = 0; i < path.length - 1; i++) {
        target = target[path[i]];
      }

      const lastKey = path[path.length - 1];
      if (Array.isArray(target[lastKey])) {
        target[lastKey] = [...target[lastKey], photo];
      }

      setConfig(updatePhotoConfig(newConfig));
    },
    [config]
  );

  // Remove photo from array
  const removePhoto = useCallback(
    (section: string, id: string) => {
      const path = section.split('.');
      const newConfig = { ...config };

      let target: any = newConfig;
      for (let i = 0; i < path.length - 1; i++) {
        target = target[path[i]];
      }

      const lastKey = path[path.length - 1];
      if (Array.isArray(target[lastKey])) {
        target[lastKey] = target[lastKey].filter((p: PhotoMetadata) => p.id !== id);
      }

      setConfig(updatePhotoConfig(newConfig));
    },
    [config]
  );

  // Reorder photos in array
  const reorderPhotos = useCallback(
    (section: string, photos: PhotoMetadata[]) => {
      const path = section.split('.');
      const newConfig = { ...config };

      let target: any = newConfig;
      for (let i = 0; i < path.length - 1; i++) {
        target = target[path[i]];
      }

      const lastKey = path[path.length - 1];
      target[lastKey] = photos;

      setConfig(updatePhotoConfig(newConfig));
    },
    [config]
  );

  return {
    config,
    updateCampusImages,
    updateLeadershipPhotos,
    updateLeadershipProfile,
    updateSchoolSectionPhotos,
    updateSchoolPageHeroes,
    updatePrimaryClassesGallery,
    updatePrimaryAbout,
    updateNurseryClassesGallery,
    updateNurseryLearningActivitiesGallery,
    updateNurseryExtracurricularGallery,
    updatePrimaryLearningActivitiesGallery,
    updatePrimaryExtracurricularGallery,
    addPhoto,
    removePhoto,
    reorderPhotos,
  };
}
