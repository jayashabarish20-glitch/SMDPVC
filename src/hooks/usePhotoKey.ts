import { useCallback, useEffect, useState } from "react";
import { listAdminKey, type KeyedPhoto } from "../services/photoKeyApi";

/** Admin view of the photos for one backend config_key. */
export function usePhotoKey(configKey: string) {
  const [photos, setPhotos] = useState<KeyedPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      setPhotos(await listAdminKey(configKey));
      setError(null);
    } catch (cause) {
      console.error(`Failed to load photos for ${configKey}:`, cause);
      setError(cause instanceof Error ? cause.message : "Unable to load photos.");
    } finally {
      setIsLoading(false);
    }
  }, [configKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { photos, isLoading, error, reload, setError };
}
