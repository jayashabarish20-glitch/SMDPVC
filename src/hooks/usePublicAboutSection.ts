import { useEffect, useState } from 'react';
import { aboutSectionsApi, type AboutSection } from '../services/aboutSectionsApi';

export function usePublicAboutSection(sectionKey: string, enabled = true) {
  const [section, setSection] = useState<AboutSection | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setLoading(true);

    aboutSectionsApi
      .getPublicSection(sectionKey)
      .then((data) => {
        if (active) setSection(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load about section');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sectionKey, enabled]);

  return { section, loading, error };
}
