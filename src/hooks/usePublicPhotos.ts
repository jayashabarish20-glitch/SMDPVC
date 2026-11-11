import { useEffect, useState } from "react";
import type { PhotoConfigResponse } from "../services/photoAdminApi";

export function usePublicPhotos() {
  const [photos, setPhotos] = useState<PhotoConfigResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/public/photos")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Public photo request failed with status ${response.status}`);
        }
        return (await response.json()) as PhotoConfigResponse[];
      })
      .then((result) => {
        if (active) setPhotos(result);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const message =
          cause instanceof Error ? cause.message : "Unable to load public photos.";
        console.error("Failed to load public photos:", cause);
        setError(message);
      });

    return () => {
      active = false;
    };
  }, []);

  return { photos, error };
}
