import { useEffect, useState } from "react";
import {
  contentItemsApi,
  type ContentItem,
} from "../services/contentItemsApi";

interface UsePublicContentItemsOptions {
  pageName?: string;
  sectionKey?: string;
}

export function usePublicContentItems(options: UsePublicContentItemsOptions = {}) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    setLoading(true);
    contentItemsApi
      .getPublicItems(options.pageName, options.sectionKey)
      .then((result) => {
        if (active) {
          setItems(result);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const message =
          cause instanceof Error
            ? cause.message
            : "Unable to load content items.";
        console.error("Failed to load public content items:", cause);
        setError(message);
        setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [options.pageName, options.sectionKey]);

  return { items, error, loading };
}
