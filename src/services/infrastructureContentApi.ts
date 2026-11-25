/**
 * Infrastructure gallery content API.
 *
 * Uses the existing backend APIs only:
 * - Photos: POST /api/media/upload (Cloudinary), PUT /api/media/{id} (replace),
 *   DELETE /api/media/{id}, and /api/admin/photos for assignment, ordering and
 *   removal, all under the config key INFRASTRUCTURE_CONFIG_KEY.
 * - Description: /api/admin/content-records/{key} (SQLite text record).
 * Public reads use /api/public/photos and /api/public/content-records/{key}.
 */

import { getToken } from "../utils/storage";

const API_BASE = "/api";
export const INFRASTRUCTURE_CONFIG_KEY = "infrastructure.gallery";

export interface InfrastructurePhoto {
  /** PhotoConfiguration id (used for ordering and removal). */
  configId: string;
  /** Media id (used for replacement and deletion). */
  mediaId: string;
  displayOrder: number;
  imageUrl: string;
  alt: string;
  filename: string;
  updatedAt: string;
}

export interface InfrastructureContent {
  photos: InfrastructurePhoto[];
  description: string;
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

interface ContentRecordBody {
  payload: Record<string, unknown>;
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
      throw new Error("Please log in again to manage the infrastructure gallery.");
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

function toPhoto(item: PhotoConfigBody): InfrastructurePhoto {
  return {
    configId: item.id,
    mediaId: item.media.id,
    displayOrder: item.display_order,
    imageUrl: item.media.image_url,
    alt: item.media.alt_text || "Infrastructure",
    filename: item.media.original_filename,
    updatedAt: item.media.updated_at,
  };
}

function descriptionFrom(record: ContentRecordBody | null): string {
  const value = record?.payload?.description;
  return typeof value === "string" ? value : "";
}

/** Public: load photos (ordered) and description for the Infrastructure section. */
export async function fetchPublicInfrastructure(): Promise<InfrastructureContent> {
  const [photos, record] = await Promise.all([
    request<PhotoConfigBody[]>("/public/photos"),
    request<ContentRecordBody | null>(
      `/public/content-records/${INFRASTRUCTURE_CONFIG_KEY}`,
    ),
  ]);
  return {
    photos: photos
      .filter((item) => item.config_key === INFRASTRUCTURE_CONFIG_KEY)
      .sort((a, b) => a.display_order - b.display_order)
      .map(toPhoto),
    description: descriptionFrom(record),
  };
}

/** Admin: load photos and description. */
export async function fetchAdminInfrastructure(): Promise<InfrastructureContent> {
  const [photos, record] = await Promise.all([
    request<PhotoConfigBody[]>(
      `/admin/photos?config_key=${encodeURIComponent(INFRASTRUCTURE_CONFIG_KEY)}`,
      {},
      true,
    ),
    request<ContentRecordBody | null>(
      `/admin/content-records/${INFRASTRUCTURE_CONFIG_KEY}`,
      {},
      true,
    ),
  ]);
  return {
    photos: photos.map(toPhoto),
    description: descriptionFrom(record),
  };
}

function fileForm(file: File): FormData {
  const form = new FormData();
  form.append("file", file);
  return form;
}

/** Next free display_order (max + 1), so gaps left by deletes never collide. */
export function nextDisplayOrder(photos: InfrastructurePhoto[]): number {
  return photos.reduce((max, photo) => Math.max(max, photo.displayOrder + 1), 0);
}

/** Upload to Cloudinary via FastAPI, then append to the gallery. */
export async function addInfrastructurePhoto(
  file: File,
  displayOrder: number,
): Promise<void> {
  const media = await request<MediaBody>(
    "/media/upload",
    { method: "POST", body: fileForm(file) },
    true,
  );
  await request(
    "/admin/photos/assign",
    {
      method: "POST",
      body: JSON.stringify({
        media_id: media.id,
        config_key: INFRASTRUCTURE_CONFIG_KEY,
        display_order: displayOrder,
      }),
    },
    true,
  );
}

/** Replace the image file of an existing gallery item (keeps its position). */
export async function replaceInfrastructurePhoto(
  mediaId: string,
  file: File,
): Promise<void> {
  await request(`/media/${mediaId}`, { method: "PUT", body: fileForm(file) }, true);
}

/**
 * Remove a photo from the gallery and delete its Cloudinary asset.
 * The link is removed first, so the media is no longer in use when deleted.
 */
export async function removeInfrastructurePhoto(
  configId: string,
  mediaId: string,
): Promise<void> {
  await request(`/admin/photos/${configId}`, { method: "DELETE" }, true);
  await request(`/media/${mediaId}`, { method: "DELETE" }, true);
}

/** Persist a new order. Sends PhotoConfiguration ids, as the backend expects. */
export async function reorderInfrastructurePhotos(configIds: string[]): Promise<void> {
  await request(
    "/admin/photos/reorder-batch",
    {
      method: "POST",
      body: JSON.stringify({
        config_key: INFRASTRUCTURE_CONFIG_KEY,
        photo_ids: configIds,
      }),
    },
    true,
  );
}

/** Save the gallery description as a SQLite content record. */
export async function saveInfrastructureDescription(description: string): Promise<void> {
  await request(
    `/admin/content-records/${INFRASTRUCTURE_CONFIG_KEY}`,
    {
      method: "PUT",
      body: JSON.stringify({ payload: { description }, media: [] }),
    },
    true,
  );
}
