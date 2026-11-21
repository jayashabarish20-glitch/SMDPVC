import { useState, useEffect } from 'react';

export function usePublicApi<T>(
  endpoint: string,
  defaultValue: T,
  deps: any[] = []
) {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch data';
        setError(message);
        console.error('Error fetching data:', err);
        setData(defaultValue);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, ...deps]);

  return { data, loading, error };
}
