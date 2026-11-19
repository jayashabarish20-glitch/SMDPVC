/**
 * Generic API for photo slots keyed by config_key (Home hero, school page
 * heroes, Hero 3D cards). Uses only existing backend endpoints:
 * - POST /api/media/upload, PUT /api/media/{id}, DELETE /api/media/{id}
 * - /api/admin/photos (list, assign, reorder-batch, delete)
 * - /api/public/photos (public read)
 */

import { getToken } from "../utils/storage";

const API_BASE = "/api";

export interface KeyedPhoto {
  /** PhotoConfiguration id: used for ordering and unlinking. */
  configId: string;
  /** Media id: used for replace and delete. */
  mediaId: string;
  displayOrder: number;
  imageUrl: string;
  alt: string;
  filename: string;
  updatedAt: string;
}

interface MediaBody {
  id: string;
  image_url: string;
  alt_text: string;
  original_filename: string;
  updated_at: string;
}

interface PhotoConfigBody {
  id: string;
  media_id: string;
  config_key: string;
  display_order: number;
  media: MediaBody;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  authenticated = false,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (authenticated) {
    const token = getToken();
    if (!token) {
      throw new Error("Please log in again to manage website photos.");
    }
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail =
      typeof body?.detail === "string"
        ? body.detail
        : `Request failed with status ${response.status}`;
    throw new Error(detail);
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

function toKeyedPhoto(item: PhotoConfigBody): KeyedPhoto {
  return {
    configId: item.id,
    mediaId: item.media.id,
    displayOrder: item.display_order,
    imageUrl: item.media.image_url,
    alt: item.media.alt_text || "",
    filename: item.media.original_filename,
    updatedAt: item.media.updated_at,
  };
}

/** Public: photos for one key, in display order. */
export async function listPublicKey(configKey: string): Promise<KeyedPhoto[]> {
  const all = await request<PhotoConfigBody[]>("/public/photos");
  return all
    .filter((item) => item.config_key === configKey)
    .sort((a, b) => a.display_order - b.display_order)
    .map(toKeyedPhoto);
}

/** Admin: photos for one key, in display order. */
export async function listAdminKey(configKey: string): Promise<KeyedPhoto[]> {
  const items = await request<PhotoConfigBody[]>(
    `/admin/photos?config_key=${encodeURIComponent(configKey)}`,
    {},
    true,
  );
  return items
    .sort((a, b) => a.display_order - b.display_order)
    .map(toKeyedPhoto);
}

/** Next free display_order (max + 1), so gaps never collide. */
export function nextOrder(photos: KeyedPhoto[]): number {
  return photos.reduce((max, p) => Math.max(max, p.displayOrder + 1), 0);
}

/** Upload to Cloudinary via FastAPI, then link to the key. */
export async function addKeyedPhoto(
  file: File,
  configKey: string,
  displayOrder: number,
  altText = "",
): Promise<void> {
  const form = new FormData();
  form.append("file", file);
  if (altText) form.append("alt_text", altText);
  const media = await request<MediaBody>(
    "/media/upload",
    { method: "POST", body: form },
    true,
  );
  await request(
    "/admin/photos/assign",
    {
      method: "POST",
      body: JSON.stringify({
        media_id: media.id,
        config_key: configKey,
        display_order: displayOrder,
      }),
    },
    true,
  );
}

/** Replace the file of an existing photo, keeping its link and order. */
export async function replaceKeyedPhoto(mediaId: string, file: File): Promise<void> {
  const form = new FormData();
  form.append("file", file);
  await request(`/media/${mediaId}`, { method: "PUT", body: form }, true);
}

/** Unlink from the key, then delete the Cloudinary asset. */
export async function removeKeyedPhoto(configId: string, mediaId: string): Promise<void> {
  await request(`/admin/photos/${configId}`, { method: "DELETE" }, true);
  await request(`/media/${mediaId}`, { method: "DELETE" }, true);
}

/** Save a new order (PhotoConfiguration ids, in display order). */
export async function reorderKeyedPhotos(configKey: string, configIds: string[]): Promise<void> {
  await request(
    "/admin/photos/reorder-batch",
    {
      method: "POST",
      body: JSON.stringify({ config_key: configKey, photo_ids: configIds }),
    },
    true,
  );
}

/** Convert a data URL (from a file reader preview) into a File for upload. */
export async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}
