import { useEffect, useState } from 'react';
import { fetchPublicKeyedDescription } from '../services/photoKeyApi';
import type { CourseGroup } from '../data/photoService';
import { COURSE_GROUPS_RECORD_KEY, DEFAULT_COURSE_GROUPS } from '../components/admin/CoursesOfferedManager';

export function usePublicCourseGroups(enabled = true) {
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    fetchPublicKeyedDescription(COURSE_GROUPS_RECORD_KEY)
      .then((raw) => {
        if (!active) return;
        // Defaults only apply before the admin has ever saved; a saved empty list is authoritative.
        if (!raw) {
          setGroups(DEFAULT_COURSE_GROUPS);
          return;
        }
        try {
          const parsed = JSON.parse(raw);
          setGroups(Array.isArray(parsed.groups) ? parsed.groups : []);
        } catch {
          setGroups([]);
        }
      })
      .catch(() => {
        if (active) setGroups([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled]);

  return { groups, loading };
}
