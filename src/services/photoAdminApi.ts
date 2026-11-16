/**
 * Photo Administration API client
 *
 * Handles all photo-related API calls with proper authentication.
 * Uses adminApi.ts for auth header management.
 */

import { getToken } from '../utils/storage';

const API_BASE = '/api';

export interface MediaResponse {
  id: string;
  image_url: string;
  alt_text?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PhotoAssignResponse {
  id: string;
  media_id: string;
  config_key: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface PhotoConfigResponse {
  id: string;
  media_id: string;
  config_key: string;
  display_order: number;
  media?: MediaResponse;
  created_at?: string;
  updated_at?: string;
}

export interface ListPhotosResponse {
  photos: PhotoConfigResponse[];
  total: number;
}

class PhotoAdminApiClient {
  /**
   * Make authenticated API request for file uploads (FormData)
   */
  private async requestFormData<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      ...Object.fromEntries(
        Object.entries(options.headers || {}).map(([key, value]) => [key, String(value)])
      ),
    };

    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401/403 as authentication errors
      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized - please log in again');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.detail || errorData.message || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Make authenticated API request for JSON
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...Object.fromEntries(
        Object.entries(options.headers || {}).map(([key, value]) => [key, String(value)])
      ),
    };

    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401/403 as authentication errors
      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized - please log in again');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.detail || errorData.message || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Upload a photo to media library
   * POST /api/media/upload
   */
  async uploadPhoto(file: File, altText?: string): Promise<MediaResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (altText) {
      formData.append('alt_text', altText);
    }

    return this.requestFormData<MediaResponse>('/media/upload', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Replace an existing photo in media library
   * PUT /api/media/{media_id}
   */
  async replacePhoto(mediaId: string, file: File, altText?: string): Promise<MediaResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (altText) {
      formData.append('alt_text', altText);
    }

    return this.requestFormData<MediaResponse>(`/media/${mediaId}`, {
      method: 'PUT',
      body: formData,
    });
  }

  /**
   * Delete a photo from media library
   * DELETE /api/media/{media_id}
   */
  async deletePhoto(mediaId: string): Promise<void> {
    return this.request<void>(`/media/${mediaId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Assign a photo to a configuration
   * POST /api/admin/photos/assign
   */
  async assignPhotoToConfig(
    mediaId: string,
    configKey: string,
    displayOrder: number
  ): Promise<PhotoAssignResponse> {
    return this.request<PhotoAssignResponse>('/admin/photos/assign', {
      method: 'POST',
      body: JSON.stringify({
        media_id: mediaId,
        config_key: configKey,
        display_order: displayOrder,
      }),
    });
  }

  /**
   * Remove a photo from configuration
   * DELETE /api/admin/photos/{config_id}
   */
  async removePhotoFromConfig(photoConfigId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/admin/photos/${photoConfigId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Reorder photos in a configuration
   * POST /api/admin/photos/reorder-batch
   */
  async reorderPhotosInKey(
    configKey: string,
    mediaIds: string[]
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/admin/photos/reorder-batch', {
      method: 'POST',
      body: JSON.stringify({
        config_key: configKey,
        media_ids: mediaIds,
      }),
    });
  }

  /**
   * List all photo configurations
   * GET /api/admin/photos
   */
  async listPhotos(): Promise<ListPhotosResponse> {
    const response = await this.request<ListPhotosResponse | PhotoConfigResponse[]>('/admin/photos', {
      method: 'GET',
    });
    return Array.isArray(response)
      ? { photos: response, total: response.length }
      : response;
  }

  /**
   * Get photos for a specific configuration key
   * GET /api/admin/photos?config_key={key}
   */
  async getPhotosByConfigKey(configKey: string): Promise<PhotoConfigResponse[]> {
    const url = new URL(`${API_BASE}/admin/photos`, window.location.origin);
    url.searchParams.append('config_key', configKey);

    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized - please log in again');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data.photos || [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }
}

export const photoAdminApi = new PhotoAdminApiClient();
