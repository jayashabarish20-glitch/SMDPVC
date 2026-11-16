import { getToken } from "../utils/storage";

const API_BASE = "/api";

export interface MediaInfo {
  id: string;
  image_url: string;
  alt_text: string;
  original_filename: string;
}

export interface AboutSection {
  id: string;
  section_key: string;
  description: string;
  media_id: string | null;
  media: MediaInfo | null;
  created_at: string;
  updated_at: string;
}

export interface AboutSectionCreate {
  section_key: string;
  description?: string;
  media_id?: string | null;
}

export interface AboutSectionUpdate {
  description?: string;
  media_id?: string | null;
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
      throw new Error("Please log in again to manage about sections.");
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

  return response.json();
}

export const aboutSectionsApi = {
  async getPublicSections(): Promise<AboutSection[]> {
    return request<AboutSection[]>("/public/about-sections");
  },

  async getPublicSection(sectionKey: string): Promise<AboutSection | null> {
    return request<AboutSection | null>(
      `/public/about-sections/${encodeURIComponent(sectionKey)}`,
    );
  },

  async getAdminSections(): Promise<AboutSection[]> {
    return request<AboutSection[]>("/admin/about-sections", {}, true);
  },

  async getAdminSection(sectionKey: string): Promise<AboutSection | null> {
    return request<AboutSection | null>(
      `/admin/about-sections/${encodeURIComponent(sectionKey)}`,
      {},
      true,
    );
  },

  async createSection(data: AboutSectionCreate): Promise<AboutSection> {
    return request<AboutSection>(
      "/admin/about-sections",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true,
    );
  },

  async updateSection(
    sectionKey: string,
    data: AboutSectionUpdate,
  ): Promise<AboutSection> {
    return request<AboutSection>(
      `/admin/about-sections/${encodeURIComponent(sectionKey)}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      true,
    );
  },

  async deleteSection(sectionKey: string): Promise<void> {
    return request<void>(
      `/admin/about-sections/${encodeURIComponent(sectionKey)}`,
      { method: "DELETE" },
      true,
    );
  },
};
