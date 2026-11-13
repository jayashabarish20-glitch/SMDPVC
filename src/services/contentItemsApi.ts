import { getToken } from "../utils/storage";

const API_BASE = "/api";

export interface Media {
  id: string;
  image_url: string;
  alt_text: string;
  original_filename: string;
}

export interface ContentItem {
  id: string;
  page_slug: string;
  section_key: string;
  title: string;
  description: string;
  display_order: number;
  is_active: boolean;
  media_id: string | null;
  media: Media | null;
}

export interface ContentItemCreate {
  page_slug: string;
  section_key: string;
  title: string;
  description?: string;
  is_active?: boolean;
  media_id?: string | null;
}

export interface ContentItemUpdate {
  title?: string;
  description?: string;
  is_active?: boolean;
  media_id?: string | null;
}

export interface ContentItemReorder {
  page_slug: string;
  section_key: string;
  ids: string[];
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
      throw new Error("Please log in again to manage content items.");
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const detail =
      typeof errorBody?.detail === "string"
        ? errorBody.detail
        : typeof errorBody?.message === "string"
          ? errorBody.message
          : `Request failed with status ${response.status}`;
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

export const contentItemsApi = {
  getPublicItems(
    pageName?: string,
    sectionKey?: string,
  ): Promise<ContentItem[]> {
    const params = new URLSearchParams();
    if (pageName) params.append("page", pageName);
    if (sectionKey) params.append("section", sectionKey);
    const qs = params.toString();
    return request<ContentItem[]>(
      `/public/content-items${qs ? `?${qs}` : ""}`,
    );
  },

  getAdminItems(
    pageName?: string,
    sectionKey?: string,
  ): Promise<ContentItem[]> {
    const params = new URLSearchParams();
    if (pageName) params.append("page", pageName);
    if (sectionKey) params.append("section", sectionKey);
    const qs = params.toString();
    return request<ContentItem[]>(
      `/admin/content-items${qs ? `?${qs}` : ""}`,
      { method: "GET" },
      true,
    );
  },

  createItem(data: ContentItemCreate): Promise<ContentItem> {
    return request<ContentItem>(
      "/admin/content-items",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true,
    );
  },

  updateItem(id: string, data: ContentItemUpdate): Promise<ContentItem> {
    return request<ContentItem>(
      `/admin/content-items/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      true,
    );
  },

  deleteItem(id: string): Promise<void> {
    return request<void>(
      `/admin/content-items/${id}`,
      { method: "DELETE" },
      true,
    );
  },

  reorderItems(data: ContentItemReorder): Promise<ContentItem[]> {
    return request<ContentItem[]>(
      "/admin/content-items/reorder",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true,
    );
  },
};
