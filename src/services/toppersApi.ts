import { getToken } from "../utils/storage";

const API_BASE = "/api";

export interface MediaInfo {
  id: string;
  imageUrl: string;
  alt: string;
}

export interface TopperData {
  id: string;
  student_name: string;
  grade_level: string;
  academic_year: string | null;
  score: string;
  stream: string;
  subject: string | null;
  rank: number | null;
  achievement: string | null;
  centums_scored: number;
  centum_subjects: string[];
  display_order: number;
  is_published: boolean;
  media_id: string | null;
  media: MediaInfo | null;
  created_at: string;
  updated_at: string;
}

export interface TopperCreate {
  student_name: string;
  grade_level: string;
  academic_year: string | null;
  score: string;
  stream: string;
  subject?: string | null;
  class_name?: string | null;
  section?: string | null;
  rank?: number | null;
  achievement?: string | null;
  centums_scored: number;
  centum_subjects: string[];
  media_id: string | null;
  is_published: boolean;
}

export interface TopperUpdate {
  student_name?: string;
  grade_level?: string;
  academic_year?: string | null;
  score?: string;
  stream?: string;
  subject?: string | null;
  class_name?: string | null;
  section?: string | null;
  rank?: number | null;
  achievement?: string | null;
  centums_scored?: number;
  centum_subjects?: string[];
  media_id?: string | null;
  is_published?: boolean;
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
      throw new Error("Please log in again to manage toppers.");
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error("Unauthorized - please log in again");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        (errorData as Record<string, unknown>).detail ||
        (errorData as Record<string, unknown>).message ||
        `Request failed with status ${response.status}`;
      throw new Error(String(errorMessage));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred");
  }
}

// Public API - no authentication required
export async function getPublicToppers(gradeLevel?: string): Promise<TopperData[]> {
  const params = new URLSearchParams();
  if (gradeLevel) {
    params.append("grade_level", gradeLevel);
  }
  return request<TopperData[]>(`/public/toppers?${params.toString()}`);
}

// Admin API - authentication required
export async function getAdminToppers(gradeLevel?: string): Promise<TopperData[]> {
  const params = new URLSearchParams();
  if (gradeLevel) {
    params.append("grade_level", gradeLevel);
  }
  return request<TopperData[]>(`/admin/toppers?${params.toString()}`, {}, true);
}

export async function createTopper(data: TopperCreate): Promise<TopperData> {
  return request<TopperData>(
    "/admin/toppers",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    true,
  );
}

export async function updateTopper(id: string, data: TopperUpdate): Promise<TopperData> {
  return request<TopperData>(
    `/admin/toppers/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    true,
  );
}

export async function deleteTopper(id: string): Promise<void> {
  return request<void>(
    `/admin/toppers/${id}`,
    {
      method: "DELETE",
    },
    true,
  );
}

export async function reorderToppers(
  gradeLevel: string,
  ids: string[],
): Promise<TopperData[]> {
  return request<TopperData[]>(
    "/admin/toppers/reorder",
    {
      method: "POST",
      body: JSON.stringify({
        grade_level: gradeLevel,
        ids,
      }),
    },
    true,
  );
}
