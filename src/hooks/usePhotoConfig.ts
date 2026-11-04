import { useState, useCallback } from 'react';
import {
  getPhotoConfig,
  updatePhotoConfig,
  type PhotoConfig,
  type PhotoMetadata,
} from '../data/photoService';

/**
 * Hook for accessing and updating photo configuration
 *
 * Abstracts data access and provides state management for the admin panel.
 * Currently uses in-memory storage; can be updated to use persistent storage.
 *
 * Usage:
 * const { config, updateCampusImages, updateLeadershipPhotos } = usePhotoConfig();
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

  // Update leadership photos (management, trustee, principal)
  const updateLeadershipPhotos = useCallback(
    (updates: Partial<PhotoConfig['leadershipPhotos']>) => {
      const newConfig = updatePhotoConfig({
        leadershipPhotos: { ...config.leadershipPhotos, ...updates },
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
    updateSchoolSectionPhotos,
    updateSchoolPageHeroes,
    addPhoto,
    removePhoto,
    reorderPhotos,
  };
}
