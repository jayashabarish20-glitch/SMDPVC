/**
 * Photo Service - Data access layer (abstracted)
 *
 * This layer abstracts photo data access. Currently uses in-memory state,
 * but can be replaced with localStorage, API, or backend storage later.
 *
 * Do not expose this directly to components. Use usePhotoConfig hook instead.
 */

export interface PhotoMetadata {
  id: string;
  filename: string;
  alt: string;
  updatedAt: string;
  imageUrl?: string;
  dataUrl?: string; // Base64 encoded image for storage/display
}

export interface CampusImagesConfig {
  hero: PhotoMetadata[];
  sports: PhotoMetadata | null;
  principal: PhotoMetadata | null;
  location: PhotoMetadata | null;
  alumni: PhotoMetadata[];
  toppers12: PhotoMetadata[];
}

export interface LeadershipProfileData {
  photo: PhotoMetadata | null;
  name: string;
  designation: string;
  shortBio: string;
  message: string;
}

export interface LeadershipPhotoConfig {
  managementPhoto: PhotoMetadata | null;
  trusteePhoto: PhotoMetadata | null;
  principalPhoto: PhotoMetadata | null;
  /** Full profile data including text fields — keyed by profile id */
  profiles: {
    management: LeadershipProfileData;
    trustee: LeadershipProfileData;
    principal: LeadershipProfileData;
  };
}

export interface SchoolSectionPhotosConfig {
  nursery: PhotoMetadata | null;
  primary: PhotoMetadata | null;
  higherSecondary: PhotoMetadata | null;
}

export interface SchoolPageHeroConfig {
  nursery: PhotoMetadata[];
  primary: PhotoMetadata[];
  higherSecondary: PhotoMetadata[];
}

export interface PrimaryClassesGalleryConfig {
  photos: PhotoMetadata[];
  description: string;
  fullScreen?: boolean;
}

export interface PrimaryAboutConfig {
  photo: PhotoMetadata | null;
  description: string;
}

export interface NurseryAboutConfig {
  photo: PhotoMetadata | null;
  description: string;
}

export interface NurseryClassesGalleryConfig {
  photos: PhotoMetadata[];
  description: string;
  fullScreen?: boolean;
}

export interface NurseryLearningActivitiesGalleryConfig {
  photos: PhotoMetadata[];
  description: string;
  fullScreen?: boolean;
}

export interface NurseryExtracurricularGalleryConfig {
  photos: PhotoMetadata[];
  description: string;
  fullScreen?: boolean;
}

export interface PrimaryLearningActivitiesGalleryConfig {
  photos: PhotoMetadata[];
  description: string;
  fullScreen?: boolean;
}

export interface PrimaryExtracurricularGalleryConfig {
  photos: PhotoMetadata[];
  description: string;
  fullScreen?: boolean;
}

export interface GroupOfSchoolsInfrastructureConfig {
  photos: PhotoMetadata[];
  description: string;
  fullScreen?: boolean;
}

export interface PhotoConfig {
  campusImages: CampusImagesConfig;
  leadershipPhotos: LeadershipPhotoConfig;
  schoolSectionPhotos: SchoolSectionPhotosConfig;
  schoolPageHeroes: SchoolPageHeroConfig;
  primaryClassesGallery: PrimaryClassesGalleryConfig;
  primaryAbout: PrimaryAboutConfig | null;
  nurseryAbout: NurseryAboutConfig | null;
  nurseryClassesGallery: NurseryClassesGalleryConfig;
  nurseryLearningActivitiesGallery: NurseryLearningActivitiesGalleryConfig;
  nurseryExtracurricularGallery: NurseryExtracurricularGalleryConfig;
  primaryLearningActivitiesGallery: PrimaryLearningActivitiesGalleryConfig;
  primaryExtracurricularGallery: PrimaryExtracurricularGalleryConfig;
  groupOfSchoolsInfrastructure: GroupOfSchoolsInfrastructureConfig;
  lastUpdated: string;
}

// Mock initial state - matches current empty state of website
const defaultPhotoConfig: PhotoConfig = {
  campusImages: {
    hero: [],
    sports: null,
    principal: null,
    location: null,
    alumni: [],
    toppers12: [],
  },
  leadershipPhotos: {
    managementPhoto: null,
    trusteePhoto: null,
    principalPhoto: null,
    profiles: {
      management: {
        photo: null,
        name: '',
        designation: '',
        shortBio: '',
        message: '',
      },
      trustee: {
        photo: null,
        name: '',
        designation: '',
        shortBio: '',
        message: '',
      },
      principal: {
        photo: null,
        name: '',
        designation: '',
        shortBio: '',
        message: '',
      },
    },
  },
  schoolSectionPhotos: {
    nursery: null,
    primary: null,
    higherSecondary: null,
  },
  schoolPageHeroes: {
    nursery: [],
    primary: [],
    higherSecondary: [],
  },
  primaryClassesGallery: {
    photos: [],
    description: '',
    fullScreen: false,
  },
  primaryAbout: null,
  nurseryAbout: null,
  nurseryClassesGallery: {
    photos: [],
    description: '',
    fullScreen: false,
  },
  nurseryLearningActivitiesGallery: {
    photos: [],
    description: '',
    fullScreen: false,
  },
  nurseryExtracurricularGallery: {
    photos: [],
    description: '',
    fullScreen: false,
  },
  primaryLearningActivitiesGallery: {
    photos: [],
    description: '',
    fullScreen: false,
  },
  primaryExtracurricularGallery: {
    photos: [],
    description: '',
    fullScreen: false,
  },
  groupOfSchoolsInfrastructure: {
    photos: [],
    description: '',
    fullScreen: true,
  },
  lastUpdated: new Date().toISOString(),
};

export function createDefaultPhotoConfig(): PhotoConfig {
  return JSON.parse(JSON.stringify(defaultPhotoConfig));
}

/**
 * localStorage key for persisting photo configuration
 */
const STORAGE_KEY = 'smdpvc_photo_config_v1';

/**
 * In-memory cache for current session
 */
let photoConfigStore: PhotoConfig = loadFromStorage();

/**
 * Load photo configuration from localStorage or use defaults
 */
function loadFromStorage(): PhotoConfig {
  if (typeof window === 'undefined') {
    return JSON.parse(JSON.stringify(defaultPhotoConfig));
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults so new fields exist when loading older stored data.
      return {
        ...JSON.parse(JSON.stringify(defaultPhotoConfig)),
        ...parsed,
        primaryClassesGallery: parsed.primaryClassesGallery ?? defaultPhotoConfig.primaryClassesGallery,
        primaryAbout: parsed.primaryAbout ?? defaultPhotoConfig.primaryAbout,
        nurseryAbout: parsed.nurseryAbout ?? defaultPhotoConfig.nurseryAbout,
        groupOfSchoolsInfrastructure: parsed.groupOfSchoolsInfrastructure ?? defaultPhotoConfig.groupOfSchoolsInfrastructure,
      };
    }
  } catch (error) {
    console.error('Failed to load photo config from localStorage:', error);
  }

  return JSON.parse(JSON.stringify(defaultPhotoConfig));
}

/**
 * Persist photo configuration to localStorage
 */
function persistToStorage(config: PhotoConfig): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to persist photo config to localStorage:', error);
  }
}

/**
 * Get current photo configuration
 */
export function getPhotoConfig(): PhotoConfig {
  return JSON.parse(JSON.stringify(photoConfigStore));
}

/**
 * Update photo configuration and persist to localStorage
 */
export function updatePhotoConfig(updates: Partial<PhotoConfig>): PhotoConfig {
  photoConfigStore = {
    ...photoConfigStore,
    ...updates,
    lastUpdated: new Date().toISOString(),
  };
  persistToStorage(photoConfigStore);
  return getPhotoConfig();
}

/**
 * Reset to defaults for testing
 */
export function resetPhotoConfig(): PhotoConfig {
  photoConfigStore = JSON.parse(JSON.stringify(defaultPhotoConfig));
  persistToStorage(photoConfigStore);
  return getPhotoConfig();
}

/**
 * Clear all stored photos (for testing)
 */
export function clearAllPhotos(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    photoConfigStore = JSON.parse(JSON.stringify(defaultPhotoConfig));
  } catch (error) {
    console.error('Failed to clear photos:', error);
  }
}

/**
 * Export configuration as JSON
 */
export function exportPhotoConfig(): string {
  return JSON.stringify(photoConfigStore, null, 2);
}

/**
 * Import configuration from JSON
 */
export function importPhotoConfig(jsonData: string): PhotoConfig {
  try {
    const imported = JSON.parse(jsonData);
    photoConfigStore = imported;
    persistToStorage(photoConfigStore);
    return getPhotoConfig();
  } catch (error) {
    console.error("Failed to import photo config:", error);
    throw new Error("Invalid JSON format");
  }
}
