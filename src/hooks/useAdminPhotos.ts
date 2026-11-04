import { useEffect, useState } from 'react';
import { getPhotoConfig, type PhotoConfig } from '../data/photoService';

/**
 * Hook to provide reactive photo config from photoService
 * Polls localStorage every 500ms for changes and triggers re-renders
 */
export function usePhotoConfig(): PhotoConfig {
  const [config, setConfig] = useState<PhotoConfig>(() => getPhotoConfig());

  useEffect(() => {
    // Poll for changes to localStorage
    const handleStorageChange = () => {
      const newConfig = getPhotoConfig();
      setConfig(newConfig);
    };

    const interval = setInterval(handleStorageChange, 500);

    return () => clearInterval(interval);
  }, []);

  return config;
}

/**
 * Hook to provide photo URLs from photoService
 * This merges photoService data with the existing campusImages structure
 */
export function useAdminPhotos() {
  const config = usePhotoConfig();
  return extractPhotosFromConfig(config);
}

/**
 * Extract photo URLs from photoService config
 * Returns an object compatible with the existing campusImages structure
 */
function extractPhotosFromConfig(config: any) {
  return {
    hero: (config.campusImages.hero || []).map((p: any) => p.dataUrl || p.filename),
    sports: config.campusImages.sports?.dataUrl || config.campusImages.sports?.filename || '',
    principal: config.campusImages.principal?.dataUrl || config.campusImages.principal?.filename || '',
    location: config.campusImages.location?.dataUrl || config.campusImages.location?.filename || '',
    alumni: (config.campusImages.alumni || []).map((p: any) => ({
      ...p,
      image: p.dataUrl || p.filename,
    })),
    toppers12: (config.campusImages.toppers12 || []).map((p: any) => ({
      ...p,
      image: p.dataUrl || p.filename,
    })),
  };
}
