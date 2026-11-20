import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminKeyedDescription,
  fetchPublicKeyedDescription,
  listAdminKey,
  listPublicKey,
  type KeyedPhoto,
} from "../services/photoKeyApi";

/** config_key for each school-page gallery (photos and description share the key). */
export const GALLERY_KEYS = {
  nurseryClasses: "nursery.classes.gallery",
  nurseryLearning: "nursery.learning.gallery",
  nurseryExtracurricular: "nursery.extracurricular.gallery",
  primaryClasses: "primary.classes.gallery",
  primaryLearning: "primary.learning.gallery",
  primaryExtracurricular: "primary.extracurricular.gallery",
  higherSecondaryClasses: "higher-secondary.classes.gallery",
  higherSecondaryLearning: "higher-secondary.learning.gallery",
  higherSecondaryExtracurricular: "higher-secondary.extracurricular.gallery",
} as const;

/** config_key for each academic calendar PDF (one PDF per key; newest wins). */
export const CALENDAR_KEYS = {
  nursery: "academic-calendar.nursery",
  primary: "academic-calendar.primary",
  higherSecondary: "academic-calendar.higher-secondary",
} as const;

interface Options {
  mode: "public" | "admin";
  /** When false, nothing is fetched (lets a shared page skip galleries it does not show). */
  enabled?: boolean;
}

/**
 * Loads a gallery backed by SQLite: photos from /api/public|admin/photos for one
 * config_key, plus the description stored as a content record under the same key.
 * Nothing is read from browser storage.
 */
export function useKeyedGallery(configKey: string, { mode, enabled = true }: Options) {
  const [photos, setPhotos] = useState<KeyedPhoto[]>([]);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    try {
      const [nextPhotos, nextDescription] = await Promise.all([
        mode === "admin" ? listAdminKey(configKey) : listPublicKey(configKey),
        mode === "admin"
          ? fetchAdminKeyedDescription(configKey)
          : fetchPublicKeyedDescription(configKey),
      ]);
      setPhotos(nextPhotos);
      setDescription(nextDescription);
      setError(null);
    } catch (cause) {
      console.error(`Failed to load gallery ${configKey}:`, cause);
      setError(cause instanceof Error ? cause.message : "Unable to load this gallery.");
    } finally {
      setIsLoading(false);
    }
  }, [configKey, mode, enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { photos, description, isLoading, error, reload, setError };
}
