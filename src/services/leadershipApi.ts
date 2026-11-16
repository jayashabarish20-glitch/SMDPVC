import { getToken } from "../utils/storage";

const API_BASE = "/api";

export interface LeadershipProfile {
  id: string;
  profile_key: string;
  name: string;
  designation: string;
  category: string;
  short_bio: string;
  message: string;
  display_order: number;
  is_active: boolean;
  media_id: string | null;
  media: {
    id: string;
    image_url: string;
    alt_text: string;
    original_filename: string;
  } | null;
}

export interface LeadershipProfileInput {
  profile_key: string;
  name: string;
  designation: string;
  category: string;
  short_bio: string;
  message: string;
  display_order: number;
  is_active: boolean;
  media_id: string | null;
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
      throw new Error("Please log in again to manage leadership profiles.");
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

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

export interface LeadershipProfileCreateNew {
  name: string;
  designation: string;
  category?: string;
  short_bio?: string;
  message?: string;
  is_active?: boolean;
  media_id?: string | null;
}

export interface ReorderRequest {
  ids: string[];
}

export const leadershipApi = {
  getPublicProfiles(): Promise<LeadershipProfile[]> {
    return request<LeadershipProfile[]>("/public/leadership-profiles");
  },

  getAdminProfiles(): Promise<LeadershipProfile[]> {
    return request<LeadershipProfile[]>(
      "/admin/leadership-profiles",
      { method: "GET" },
      true,
    );
  },

  saveProfile(profile: LeadershipProfileInput): Promise<LeadershipProfile> {
    return request<LeadershipProfile>(
      `/admin/leadership-profiles/${encodeURIComponent(profile.profile_key)}`,
      {
        method: "PUT",
        body: JSON.stringify(profile),
      },
      true,
    );
  },

  createProfile(
    data: LeadershipProfileCreateNew,
  ): Promise<LeadershipProfile> {
    return request<LeadershipProfile>(
      "/admin/leadership-profiles",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true,
    );
  },

  deleteProfile(profileKey: string): Promise<void> {
    return request<void>(
      `/admin/leadership-profiles/${encodeURIComponent(profileKey)}`,
      { method: "DELETE" },
      true,
    );
  },

  reorderProfiles(ids: string[]): Promise<LeadershipProfile[]> {
    return request<LeadershipProfile[]>(
      "/admin/leadership-profiles/reorder",
      {
        method: "POST",
        body: JSON.stringify({ ids }),
      },
      true,
    );
  },
};
