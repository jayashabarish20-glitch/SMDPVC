import { useState, useEffect } from 'react';
import { getPublicToppers } from '../services/toppersApi';

export interface Topper {
  id: string;
  student_name: string;
  grade_level: string;
  academic_year: string | null;
  score: string;
  stream: string;
  subject: string | null;
  class_name: string | null;
  section: string | null;
  rank: number | null;
  achievement: string | null;
  centums_scored: number;
  centum_subjects: string[];
  display_order: number;
  is_published: boolean;
  media_id: string | null;
  media: {
    id: string;
    imageUrl: string;
    alt: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export function useToppers(gradeLevel?: string) {
  const [toppers, setToppers] = useState<Topper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchToppers = async () => {
      try {
        setLoading(true);
        const data = await getPublicToppers(gradeLevel);
        setToppers(data as Topper[]);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setToppers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchToppers();
  }, [gradeLevel]);

  return { toppers, loading, error };
}

export function useAdminToppers(gradeLevel?: string) {
  const [toppers, setToppers] = useState<Topper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToppers = async () => {
    try {
      setLoading(true);
      const { getAdminToppers } = await import('../services/toppersApi');
      const data = await getAdminToppers(gradeLevel);
      setToppers(data as Topper[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addTopper = async (topperData: {
    student_name: string;
    grade_level: string;
    academic_year: string | null;
    score: string;
    stream: string;
    centums_scored: number;
    centum_subjects: string[];
    media_id: string | null;
    is_published: boolean;
  }) => {
    try {
      setLoading(true);
      const { createTopper } = await import('../services/toppersApi');
      const newTopper = await createTopper(topperData);
      setToppers((prev) => [...prev, newTopper as Topper]);
      setError(null);
      return newTopper;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTopper = async (
    topperId: string,
    updates: Partial<Omit<Topper, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      setLoading(true);
      const { updateTopper: updateTopperApi } = await import('../services/toppersApi');
      const updatedTopper = await updateTopperApi(topperId, updates);
      setToppers((prev) =>
        prev.map((t) => (t.id === topperId ? (updatedTopper as Topper) : t))
      );
      setError(null);
      return updatedTopper;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTopper = async (topperId: string) => {
    try {
      setLoading(true);
      const { deleteTopper: deleteTopperApi } = await import('../services/toppersApi');
      await deleteTopperApi(topperId);
      setToppers((prev) => prev.filter((t) => t.id !== topperId));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reorderToppers = async (gradeLevel: string, topperIds: string[]) => {
    try {
      setLoading(true);
      const { reorderToppers: reorderToppersApi } = await import('../services/toppersApi');
      const reorderedToppers = await reorderToppersApi(gradeLevel, topperIds);
      setToppers(reorderedToppers as Topper[]);
      setError(null);
      return reorderedToppers;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gradeLevel) {
      fetchToppers();
    }
  }, [gradeLevel]);

  return {
    toppers,
    loading,
    error,
    fetchToppers,
    addTopper,
    updateTopper,
    deleteTopper,
    reorderToppers,
  };
}
