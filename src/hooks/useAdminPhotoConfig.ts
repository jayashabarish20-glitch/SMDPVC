/**
 * Hook for organizing admin photos by config_key
 *
 * Maps backend photo configurations to the PhotoConfig structure
 * for display in photo managers.
 *
 * Usage:
 * const { campusImages, leadershipPhotos } = useAdminPhotoConfig();
 */

import { useMemo } from "react";
import { useAdminPhotos, type AdminPhoto } from "./useAdminPhotos";
import type { PhotoMetadata } from "../data/photoService";

export interface AdminPhotoConfig {
  campusImages: {
    hero: PhotoMetadata[];
    sports: PhotoMetadata | null;
    principal: PhotoMetadata | null;
    location: PhotoMetadata | null;
    alumni: PhotoMetadata[];
    toppers12: PhotoMetadata[];
  };
  leadershipPhotos: {
    managementPhoto: PhotoMetadata | null;
    trusteePhoto: PhotoMetadata | null;
    principalPhoto: PhotoMetadata | null;
    profiles: {
      management: { photo: PhotoMetadata | null };
      trustee: { photo: PhotoMetadata | null };
      principal: { photo: PhotoMetadata | null };
    };
  };
  schoolSectionPhotos: {
    nursery: PhotoMetadata | null;
    primary: PhotoMetadata | null;
    higherSecondary: PhotoMetadata | null;
  };
  schoolPageHeroes: {
    nursery: PhotoMetadata[];
    primary: PhotoMetadata[];
    higherSecondary: PhotoMetadata[];
  };
  primaryClassesGallery: {
    photos: PhotoMetadata[];
  };
  primaryAbout: {
    photo: PhotoMetadata | null;
  };
}

/**
 * Convert AdminPhoto to PhotoMetadata
 */
function adminPhotoToMetadata(photo: AdminPhoto): PhotoMetadata {
  return {
    id: photo.id,
    filename: photo.media?.alt_text || `photo-${photo.media_id}`,
    alt: photo.media?.alt_text || "",
    updatedAt: photo.updated_at || new Date().toISOString(),
    imageUrl: photo.media?.image_url,
  };
}

/**
 * Group photos by config_key and organize into PhotoConfig structure
 */
function organizePhotosByKey(photos: AdminPhoto[]): AdminPhotoConfig {
  const grouped: Record<string, AdminPhoto[]> = {};

  photos.forEach((photo) => {
    if (!grouped[photo.config_key]) {
      grouped[photo.config_key] = [];
    }
    grouped[photo.config_key].push(photo);
  });

  // Sort by display_order
  Object.keys(grouped).forEach((key) => {
    grouped[key].sort((a, b) => a.display_order - b.display_order);
  });

  const metadata = (key: string): PhotoMetadata[] =>
    (grouped[key] || []).map(adminPhotoToMetadata);

  const singlePhoto = (key: string): PhotoMetadata | null => {
    const photo = grouped[key]?.[0];
    return photo ? adminPhotoToMetadata(photo) : null;
  };

  return {
    campusImages: {
      hero: metadata("campusImages.hero"),
      sports: singlePhoto("campusImages.sports"),
      principal: singlePhoto("campusImages.principal"),
      location: singlePhoto("campusImages.location"),
      alumni: metadata("campusImages.alumni"),
      toppers12: metadata("campusImages.toppers12"),
    },
    leadershipPhotos: {
      managementPhoto: singlePhoto("leadershipPhotos.management"),
      trusteePhoto: singlePhoto("leadershipPhotos.trustee"),
      principalPhoto: singlePhoto("leadershipPhotos.principal"),
      profiles: {
        management: {
          photo: singlePhoto("leadershipPhotos.management"),
        },
        trustee: {
          photo: singlePhoto("leadershipPhotos.trustee"),
        },
        principal: {
          photo: singlePhoto("leadershipPhotos.principal"),
        },
      },
    },
    schoolSectionPhotos: {
      nursery: singlePhoto("schoolSectionPhotos.nursery"),
      primary: singlePhoto("schoolSectionPhotos.primary"),
      higherSecondary: singlePhoto("schoolSectionPhotos.higherSecondary"),
    },
    schoolPageHeroes: {
      nursery: metadata("schoolPageHeroes.nursery"),
      primary: metadata("schoolPageHeroes.primary"),
      higherSecondary: metadata("schoolPageHeroes.higherSecondary"),
    },
    primaryClassesGallery: {
      photos: metadata("primaryClassesGallery.photos"),
    },
    primaryAbout: {
      photo: singlePhoto("primaryAbout.photo"),
    },
  };
}

export function useAdminPhotoConfig() {
  const { photos } = useAdminPhotos();

  return useMemo(() => organizePhotosByKey(photos), [photos]);
}
