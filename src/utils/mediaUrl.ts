/**
 * Media URL helpers.
 *
 * The backend MediaRead schema serializes `image_url` with the alias `imageUrl`
 * (backend/app/schemas/media.py), so API JSON carries `media.imageUrl`.
 * `image_url` is accepted as a fallback for older payloads.
 */
export interface MediaRef {
  imageUrl?: string | null;
  image_url?: string | null;
}

/** Returns a usable http(s) URL for the media, or null if missing/invalid. */
export function mediaUrl(media?: MediaRef | null): string | null {
  const url = media?.imageUrl || media?.image_url;
  return typeof url === 'string' && /^https?:\/\//i.test(url) ? url : null;
}

/**
 * Cloudinary forced-download URL (adds the `fl_attachment` delivery flag).
 * Returns null for non-Cloudinary or unrecognised URLs, so callers can hide the option.
 */
export function cloudinaryDownloadUrl(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|raw|video)\/upload\/)(.+)$/);
  if (!match) return null;
  if (match[2].startsWith('fl_attachment')) return url;
  return `${match[1]}fl_attachment/${match[2]}`;
}
