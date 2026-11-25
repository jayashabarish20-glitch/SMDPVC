import { useEffect, useState } from 'react';
import {
  fetchPublicKeyedDescription,
  listPublicKey,
} from '../services/photoKeyApi';

export interface PublicPrincipal {
  name: string;
  message: string;
  imageUrl: string | null;
}

/**
 * Content-record key for a principal's name/message. The backend only accepts
 * lowercase record keys (^[a-z0-9][a-z0-9._-]*$), so "higherSecondary" must be
 * lowercased; "primary"/"nursery" are unchanged. Photo config keys are not
 * pattern-restricted and keep the original `principal.${sectionKey}` form.
 */
export function principalRecordKey(sectionKey: 'primary' | 'nursery' | 'higherSecondary'): string {
  return `principal.${sectionKey.toLowerCase()}`;
}

export function usePublicPrincipal(sectionKey: 'primary' | 'nursery' | 'higherSecondary', enabled = true) {
  const [principal, setPrincipal] = useState<PublicPrincipal | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setLoading(true);

    const configKey = `principal.${sectionKey}`;
    const recordKey = principalRecordKey(sectionKey);

    Promise.all([
      listPublicKey(configKey).catch(() => []),
      fetchPublicKeyedDescription(recordKey).catch(() => ''),
    ])
      .then(([photos, desc]) => {
        if (!active) return;
        const imageUrl = photos.length > 0 ? photos[photos.length - 1].imageUrl : null;
        let name = '';
        let message = '';
        if (desc) {
          try {
            const parsed = JSON.parse(desc);
            name = parsed.name || '';
            message = parsed.message || '';
          } catch {
            name = desc;
          }
        }
        if (name || imageUrl || message) {
          setPrincipal({ name, message, imageUrl });
        } else {
          setPrincipal(null);
        }
      })
      .catch((err) => {
        console.warn(`Failed to fetch principal for ${sectionKey}:`, err);
        if (active) setPrincipal(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sectionKey, enabled]);

  return { principal, loading };
}
