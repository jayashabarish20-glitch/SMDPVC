import { useEffect, useState } from 'react';
import {
  createDefaultPhotoConfig,
  type PhotoConfig,
  type PhotoMetadata,
} from '../data/photoService';

interface ApiMedia {
  id: string;
  image_url: string;
  original_filename: string;
  alt_text: string;
  updated_at: string;
}

interface ApiPhotoConfiguration {
  config_key: string;
  display_order: number;
  media: ApiMedia;
}

let inFlightRequest: Promise<PhotoConfig> | null = null;

async function fetchSharedPhotoConfig(): Promise<PhotoConfig> {
  if (inFlightRequest) return inFlightRequest;

  inFlightRequest = (async () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL ?? '';
    const response = await fetch(`${apiBase}/api/public/photos`);
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `Shared photo configuration request failed (${response.status}): ${detail}`,
      );
    }

    const rows = (await response.json()) as ApiPhotoConfiguration[];
    if (!Array.isArray(rows)) {
      throw new Error('Shared photo configuration response was not a list');
    }

    const config = createDefaultPhotoConfig();
    const byKey = new Map<string, PhotoMetadata[]>();

    for (const row of rows) {
      if (
        typeof row.config_key !== 'string' ||
        typeof row.display_order !== 'number' ||
        !row.media ||
        typeof row.media.id !== 'string' ||
        typeof row.media.image_url !== 'string' ||
        !row.media.image_url.startsWith('https://') ||
        typeof row.media.original_filename !== 'string' ||
        typeof row.media.alt_text !== 'string' ||
        typeof row.media.updated_at !== 'string'
      ) {
        throw new Error('Shared photo configuration contains invalid media metadata');
      }

      const photo: PhotoMetadata = {
        id: row.media.id,
        filename: row.media.original_filename,
        alt: row.media.alt_text,
        updatedAt: row.media.updated_at,
        imageUrl: row.media.image_url,
      };
      const keyPhotos = byKey.get(row.config_key) ?? [];
      keyPhotos[row.display_order] = photo;
      byKey.set(row.config_key, keyPhotos);
    }

    const photos = (key: string) => (byKey.get(key) ?? []).filter(Boolean);
    const firstPhoto = (key: string) => photos(key)[0] ?? null;

    config.campusImages.hero = photos('campusImages.hero');
    config.campusImages.sports = firstPhoto('campusImages.sports');
    config.campusImages.principal = firstPhoto('campusImages.principal');
    config.campusImages.location = firstPhoto('campusImages.location');
    config.campusImages.alumni = photos('campusImages.alumni');
    config.campusImages.toppers12 = photos('campusImages.toppers12');

    config.leadershipPhotos.managementPhoto = firstPhoto('leadershipPhotos.managementPhoto');
    config.leadershipPhotos.trusteePhoto = firstPhoto('leadershipPhotos.trusteePhoto');
    config.leadershipPhotos.principalPhoto = firstPhoto('leadershipPhotos.principalPhoto');
    config.leadershipPhotos.profiles.management.photo = firstPhoto('leadershipPhotos.profiles.management');
    config.leadershipPhotos.profiles.trustee.photo = firstPhoto('leadershipPhotos.profiles.trustee');
    config.leadershipPhotos.profiles.principal.photo = firstPhoto('leadershipPhotos.profiles.principal');

    config.schoolSectionPhotos.nursery = firstPhoto('schoolSectionPhotos.nursery');
    config.schoolSectionPhotos.primary = firstPhoto('schoolSectionPhotos.primary');
    config.schoolSectionPhotos.higherSecondary = firstPhoto('schoolSectionPhotos.higherSecondary');

    config.schoolPageHeroes.nursery = photos('schoolPageHeroes.nursery');
    config.schoolPageHeroes.primary = photos('schoolPageHeroes.primary');
    config.schoolPageHeroes.higherSecondary = photos('schoolPageHeroes.higherSecondary');
    config.primaryClassesGallery.photos = photos('primaryClassesGallery.photos');
    config.primaryAbout = {
      photo: firstPhoto('primaryAbout.photo'),
      description: '',
    };

    const timestamps = rows.map((row) => row.media.updated_at).sort();
    config.lastUpdated = timestamps.at(-1) ?? config.lastUpdated;
    return config;
  })();

  try {
    return await inFlightRequest;
  } finally {
    inFlightRequest = null;
  }
}

/**
 * Public pages read shared image metadata from the backend, never browser storage.
 */
export function usePhotoConfig(): PhotoConfig {
  const [config, setConfig] = useState<PhotoConfig>(createDefaultPhotoConfig);

  useEffect(() => {
    let active = true;
    const load = () => {
      fetchSharedPhotoConfig().then(
        (sharedConfig) => {
          if (!active) return;
          setConfig(sharedConfig);
        },
        (error: unknown) => {
          if (!active) return;
          console.error('Failed to load shared school photos:', error);
        },
      );
    };

    load();
    window.addEventListener('focus', load);
    return () => {
      active = false;
      window.removeEventListener('focus', load);
    };
  }, []);

  return config;
}

/**
 * Returns image URLs in the legacy shape consumed by the homepage hero.
 */
export function useAdminPhotos() {
  const config = usePhotoConfig();
  return {
    hero: config.campusImages.hero.map((photo) => photo.imageUrl ?? ''),
    sports: config.campusImages.sports?.imageUrl ?? '',
    principal: config.campusImages.principal?.imageUrl ?? '',
    location: config.campusImages.location?.imageUrl ?? '',
    alumni: config.campusImages.alumni.map((photo) => ({
      ...photo,
      image: photo.imageUrl ?? '',
    })),
    toppers12: config.campusImages.toppers12.map((photo) => ({
      ...photo,
      image: photo.imageUrl ?? '',
    })),
  };
}
