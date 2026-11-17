import { useState, useEffect } from 'react';

export interface Alumni {
  id: string;
  name: string;
  batch_year: string;
  description: string;
  display_order: number;
  is_published: boolean;
  media_id: string | null;
  media: {
    id: string;
    image_url: string;
    alt_text: string;
  } | null;
}

export function useAlumni() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/public/alumni`);
        if (!response.ok) {
          throw new Error(`Failed to fetch alumni: ${response.statusText}`);
        }
        const data = await response.json();
        setAlumni(data);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch alumni';
        setError(message);
        console.error('Error fetching alumni:', err);
        setAlumni([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlumni();
  }, []);

  return { alumni, loading, error };
}
