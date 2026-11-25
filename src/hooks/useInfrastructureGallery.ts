import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminInfrastructure,
  fetchPublicInfrastructure,
  type InfrastructureContent,
} from "../services/infrastructureContentApi";

const EMPTY: InfrastructureContent = { photos: [], description: "" };

/**
 * Loads Infrastructure gallery content from the backend.
 * `mode` selects the admin (authenticated) or public endpoints.
 */
export function useInfrastructureGallery(mode: "public" | "admin" = "public") {
  const [content, setContent] = useState<InfrastructureContent>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const next =
        mode === "admin"
          ? await fetchAdminInfrastructure()
          : await fetchPublicInfrastructure();
      setContent(next);
      setError(null);
    } catch (cause) {
      console.error("Failed to load infrastructure gallery:", cause);
      setError(
        cause instanceof Error ? cause.message : "Unable to load the infrastructure gallery.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ...content, isLoading, error, reload };
}
