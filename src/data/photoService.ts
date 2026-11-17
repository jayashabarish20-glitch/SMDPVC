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

export interface PrincipalConfig {
  photo: PhotoMetadata | null;
  name: string;
  message: string;
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

export interface AcademicCalendarData {
  filename: string;
  dataUrl: string; // Base64 encoded PDF
  uploadedAt: string;
}

export interface CourseGroup {
  id: string;
  name: string;
  order: number;
  subjects: string[];
}

export interface HigherSecondaryAboutConfig {
  photo: PhotoMetadata | null;
  description: string;
}

export interface HigherSecondaryClassesGalleryConfig {
  photos: PhotoMetadata[];
  description: string;
  fullScreen?: boolean;
}

export interface HigherSecondaryLearningActivitiesGalleryConfig {
  photos: PhotoMetadata[];
  description: string;
  fullScreen?: boolean;
}

export interface HigherSecondaryExtracurricularGalleryConfig {
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
  primaryPrincipal: PrincipalConfig | null;
  nurseryAbout: NurseryAboutConfig | null;
  nurseryPrincipal: PrincipalConfig | null;
  nurseryClassesGallery: NurseryClassesGalleryConfig;
  nurseryLearningActivitiesGallery: NurseryLearningActivitiesGalleryConfig;
  nurseryExtracurricularGallery: NurseryExtracurricularGalleryConfig;
  primaryLearningActivitiesGallery: PrimaryLearningActivitiesGalleryConfig;
  primaryExtracurricularGallery: PrimaryExtracurricularGalleryConfig;
  groupOfSchoolsInfrastructure: GroupOfSchoolsInfrastructureConfig;
  higherSecondaryAbout: HigherSecondaryAboutConfig | null;
  higherSecondaryPrincipal: PrincipalConfig | null;
  higherSecondaryClassesGallery: HigherSecondaryClassesGalleryConfig;
  higherSecondaryLearningActivitiesGallery: HigherSecondaryLearningActivitiesGalleryConfig;
  higherSecondaryExtracurricularGallery: HigherSecondaryExtracurricularGalleryConfig;
  academicCalendarPrimary: AcademicCalendarData | null;
  academicCalendarNursery: AcademicCalendarData | null;
  academicCalendarHigherSecondary: AcademicCalendarData | null;
  courseGroups: CourseGroup[];
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
  primaryPrincipal: null,
  nurseryAbout: null,
  nurseryPrincipal: null,
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
  higherSecondaryAbout: null,
  higherSecondaryPrincipal: null,
  higherSecondaryClassesGallery: {
    photos: [],
    description: '',
    fullScreen: false,
  },
  higherSecondaryLearningActivitiesGallery: {
    photos: [],
    description: '',
    fullScreen: false,
  },
  higherSecondaryExtracurricularGallery: {
    photos: [],
    description: '',
    fullScreen: false,
  },
  academicCalendarPrimary: null,
  academicCalendarNursery: null,
  academicCalendarHigherSecondary: null,
  courseGroups: [
    { id: 'group-1', name: 'GROUP 1', order: 1, subjects: ['Tamil', 'English', 'Physics', 'Chemistry', 'Mathematics', 'Biology'] },
    { id: 'group-2', name: 'GROUP 2', order: 2, subjects: ['Tamil', 'English', 'Physics', 'Chemistry', 'Mathematics', 'C.S.'] },
    { id: 'group-3-em', name: 'GROUP 3 (EM)', order: 3, subjects: ['Tamil', 'English', 'Commerce', 'Accountancy', 'Economics', 'C.Application'] },
    { id: 'group-4-tm', name: 'GROUP 4 (TM)', order: 4, subjects: ['Tamil', 'English', 'Commerce', 'Accountancy', 'Economics', 'C.Application'] },
    { id: 'group-5', name: 'GROUP 5', order: 5, subjects: ['Tamil', 'English', 'Commerce', 'Accountancy', 'Economics', 'B.Maths'] },
  ],
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
        primaryPrincipal: parsed.primaryPrincipal ?? defaultPhotoConfig.primaryPrincipal,
        nurseryAbout: parsed.nurseryAbout ?? defaultPhotoConfig.nurseryAbout,
        nurseryPrincipal: parsed.nurseryPrincipal ?? defaultPhotoConfig.nurseryPrincipal,
        groupOfSchoolsInfrastructure: parsed.groupOfSchoolsInfrastructure ?? defaultPhotoConfig.groupOfSchoolsInfrastructure,
        higherSecondaryAbout: parsed.higherSecondaryAbout ?? defaultPhotoConfig.higherSecondaryAbout,
        higherSecondaryPrincipal: parsed.higherSecondaryPrincipal ?? defaultPhotoConfig.higherSecondaryPrincipal,
        higherSecondaryClassesGallery: parsed.higherSecondaryClassesGallery ?? defaultPhotoConfig.higherSecondaryClassesGallery,
        higherSecondaryLearningActivitiesGallery: parsed.higherSecondaryLearningActivitiesGallery ?? defaultPhotoConfig.higherSecondaryLearningActivitiesGallery,
        higherSecondaryExtracurricularGallery: parsed.higherSecondaryExtracurricularGallery ?? defaultPhotoConfig.higherSecondaryExtracurricularGallery,
        academicCalendarPrimary: parsed.academicCalendarPrimary ?? defaultPhotoConfig.academicCalendarPrimary,
        academicCalendarNursery: parsed.academicCalendarNursery ?? defaultPhotoConfig.academicCalendarNursery,
        academicCalendarHigherSecondary: parsed.academicCalendarHigherSecondary ?? defaultPhotoConfig.academicCalendarHigherSecondary,
        courseGroups: parsed.courseGroups ?? defaultPhotoConfig.courseGroups,
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
