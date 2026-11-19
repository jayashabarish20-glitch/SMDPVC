/**
 * One-time import of photos saved in this browser's localStorage
 * (smdpvc_photo_config_v1) into the backend.
 *
 * - Read-only on localStorage: nothing is deleted or changed there.
 * - Preview first: the notice lists what would be imported.
 * - No duplicates: imported legacy ids are recorded per key.
 * - Backend wins: single-slot keys that already have a backend photo
 *   are never overwritten by legacy data.
 */

import type { PhotoMetadata } from "../data/photoService";

// Same key as photoService. Read directly: photoService caches the config in
// memory after first load, which would hide later localStorage changes.
const LEGACY_CONFIG_KEY = "smdpvc_photo_config_v1";

interface LegacyConfigShape {
  campusImages?: {
    hero?: PhotoMetadata[];
    sports?: PhotoMetadata | null;
    principal?: PhotoMetadata | null;
  };
  schoolPageHeroes?: {
    nursery?: PhotoMetadata[];
    primary?: PhotoMetadata[];
    higherSecondary?: PhotoMetadata[];
  };
  schoolSectionPhotos?: {
    nursery?: PhotoMetadata | null;
    primary?: PhotoMetadata | null;
    higherSecondary?: PhotoMetadata | null;
  };
}

function readRawLegacyConfig(): LegacyConfigShape {
  try {
    const raw = localStorage.getItem(LEGACY_CONFIG_KEY);
    return raw ? (JSON.parse(raw) as LegacyConfigShape) : {};
  } catch {
    return {};
  }
}
import {
  addKeyedPhoto,
  dataUrlToFile,
  listAdminKey,
  nextOrder,
  type KeyedPhoto,
} from "./photoKeyApi";

const IMPORT_RECORD_KEY = "smdpvc_photo_legacy_import_v1";

export interface LegacySlot {
  /** Backend config_key this legacy data maps to. */
  configKey: string;
  /** true when the backend allows only one photo for this key. */
  single: boolean;
  photos: PhotoMetadata[];
}

/** Legacy photos for the given keys, keeping only entries with image data. */
export function readLegacySlots(configKeys: string[]): LegacySlot[] {
  const config = readRawLegacyConfig();
  const source: Record<string, { photos: PhotoMetadata[]; single: boolean }> = {
    "campusImages.hero": { photos: config.campusImages?.hero ?? [], single: false },
    "campusImages.sports": {
      photos: config.campusImages?.sports ? [config.campusImages.sports] : [],
      single: true,
    },
    "campusImages.principal": {
      photos: config.campusImages?.principal ? [config.campusImages.principal] : [],
      single: true,
    },
    "schoolPageHeroes.nursery": { photos: config.schoolPageHeroes?.nursery ?? [], single: false },
    "schoolPageHeroes.primary": { photos: config.schoolPageHeroes?.primary ?? [], single: false },
    "schoolPageHeroes.higherSecondary": {
      photos: config.schoolPageHeroes?.higherSecondary ?? [],
      single: false,
    },
    "schoolSectionPhotos.nursery": {
      photos: config.schoolSectionPhotos?.nursery ? [config.schoolSectionPhotos.nursery] : [],
      single: true,
    },
    "schoolSectionPhotos.primary": {
      photos: config.schoolSectionPhotos?.primary ? [config.schoolSectionPhotos.primary] : [],
      single: true,
    },
    "schoolSectionPhotos.higherSecondary": {
      photos: config.schoolSectionPhotos?.higherSecondary
        ? [config.schoolSectionPhotos.higherSecondary]
        : [],
      single: true,
    },
  };
  return configKeys
    .filter((key) => key in source)
    .map((key) => ({
      configKey: key,
      single: source[key].single,
      photos: source[key].photos.filter((p) => !!p.dataUrl),
    }))
    .filter((slot) => slot.photos.length > 0);
}

function importedIds(): string[] {
  try {
    const raw = localStorage.getItem(IMPORT_RECORD_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function markImported(id: string) {
  const ids = importedIds();
  if (!ids.includes(id)) ids.push(id);
  localStorage.setItem(IMPORT_RECORD_KEY, JSON.stringify(ids));
}

/** Legacy photos not yet imported and not blocked by backend content. */
export async function previewLegacyImport(configKeys: string[]): Promise<LegacySlot[]> {
  const done = importedIds();
  const slots = readLegacySlots(configKeys);
  const result: LegacySlot[] = [];
  for (const slot of slots) {
    const existing: KeyedPhoto[] = await listAdminKey(slot.configKey);
    if (slot.single && existing.length > 0) continue;
    const pending = slot.photos.filter((p) => !done.includes(p.id));
    if (pending.length > 0) result.push({ ...slot, photos: pending });
  }
  return result;
}

/** Import the previewed photos. Stops on the first error; imported ids are kept. */
export async function importLegacySlots(slots: LegacySlot[]): Promise<number> {
  let imported = 0;
  for (const slot of slots) {
    let order = nextOrder(await listAdminKey(slot.configKey));
    for (const photo of slot.photos) {
      const file = await dataUrlToFile(photo.dataUrl as string, photo.filename || "photo.jpg");
      await addKeyedPhoto(file, slot.configKey, order, photo.alt || "");
      markImported(photo.id);
      order += 1;
      imported += 1;
    }
  }
  return imported;
}
