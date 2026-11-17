import { useState, useEffect } from 'react';

export interface Achievement {
  id: string;
  category: 'academic' | 'sports';
  title: string;
  description: string;
  sport?: string;
  level?: string;
  academic_year?: string;
  display_order: number;
  is_published: boolean;
}

export function useAchievements(category?: string) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (category) {
          params.append('category', category);
        }
        const response = await fetch(`/api/public/achievements?${params}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch achievements: ${response.statusText}`);
        }
        const data = await response.json();
        setAchievements(data);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch achievements';
        setError(message);
        console.error('Error fetching achievements:', err);
        // Fall back to empty array on error
        setAchievements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [category]);

  return { achievements, loading, error };
}
