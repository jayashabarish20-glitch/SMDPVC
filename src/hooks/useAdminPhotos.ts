/**
 * Hook for managing photos in the admin dashboard
 *
 * Handles:
 * - Loading photos from backend
 * - Uploading new photos
 * - Replacing existing photos
 * - Deleting photos
 * - Reordering photos
 * - Optimistic UI updates with rollback on error
 * - Loading states and error handling
 *
 * Usage:
 * const { photos, loading, error, uploadAndAssign, deletePhoto, reorderPhotos } = useAdminPhotos();
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { photoAdminApi, type MediaResponse } from "../services/photoAdminApi";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

export interface AdminPhoto {
  id: string;
  media_id: string;
  config_key: string;
  display_order: number;
  media?: {
    id: string;
    image_url: string;
    alt_text?: string;
    created_at?: string;
    updated_at?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export function useAdminPhotos() {
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousPhotosRef = useRef<AdminPhoto[]>([]);

  /**
   * Fetch all photos from backend
   */
  const refreshPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await photoAdminApi.listPhotos();
      const photosData = (response.photos || []) as AdminPhoto[];
      setPhotos(photosData);
      previousPhotosRef.current = photosData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load photos";
      setError(errorMessage);
      console.error("Error loading photos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load photos on mount
   */
  useEffect(() => {
    refreshPhotos();
  }, [refreshPhotos]);

  /**
   * Upload photo and immediately assign to a config_key
   */
  const uploadAndAssign = useCallback(
    async (file: File, configKey: string, displayOrder: number, altText?: string) => {
      try {
        setError(null);
        setLoading(true);

        // Optimistic update with a temporary ID
        const tempId = `temp-${Date.now()}`;
        const optimisticPhoto: AdminPhoto = {
          id: tempId,
          media_id: tempId,
          config_key: configKey,
          display_order: displayOrder,
          media: {
            id: tempId,
            image_url: URL.createObjectURL(file),
            alt_text: altText,
          },
        };

        previousPhotosRef.current = photos;
        setPhotos([...photos, optimisticPhoto]);

        // Upload the photo
        let uploadedMedia: MediaResponse | undefined;
        let retries = 0;

        while (retries < MAX_RETRIES) {
          try {
            uploadedMedia = await photoAdminApi.uploadPhoto(file, altText);
            break;
          } catch (err) {
            retries++;
            if (retries >= MAX_RETRIES) throw err;
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          }
        }

        if (!uploadedMedia) {
          throw new Error("Photo upload did not return media details.");
        }

        // Assign to config
        const assigned = await photoAdminApi.assignPhotoToConfig(
          uploadedMedia.id,
          configKey,
          displayOrder
        );

        // Replace optimistic update with actual response
        const actualPhoto: AdminPhoto = {
          id: assigned.id,
          media_id: assigned.media_id,
          config_key: assigned.config_key,
          display_order: assigned.display_order,
          media: uploadedMedia,
          created_at: assigned.created_at,
          updated_at: assigned.updated_at,
        };

        setPhotos((prev) =>
          prev.map((p) => (p.id === tempId ? actualPhoto : p))
        );
        previousPhotosRef.current = photos.map((p) => (p.id === tempId ? actualPhoto : p));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to upload photo";
        setError(errorMessage);
        // Rollback optimistic update
        setPhotos(previousPhotosRef.current);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [photos]
  );

  /**
   * Replace an existing media item
   */
  const replacePhoto = useCallback(
    async (mediaId: string, file: File, altText?: string) => {
      try {
        setError(null);
        setLoading(true);

        previousPhotosRef.current = photos;

        // Replace the photo
        const updatedMedia = await photoAdminApi.replacePhoto(mediaId, file, altText);

        // Update the photos list with new media
        setPhotos((prev) =>
          prev.map((p) =>
            p.media_id === mediaId
              ? { ...p, media: updatedMedia, updated_at: new Date().toISOString() }
              : p
          )
        );

        previousPhotosRef.current = photos.map((p) =>
          p.media_id === mediaId
            ? { ...p, media: updatedMedia, updated_at: new Date().toISOString() }
            : p
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to replace photo";
        setError(errorMessage);
        setPhotos(previousPhotosRef.current);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [photos]
  );

  /**
   * Delete a media item
   */
  const deletePhoto = useCallback(
    async (mediaId: string) => {
      try {
        setError(null);
        setLoading(true);

        previousPhotosRef.current = photos;

        // Find and remove photo from config
        const photoToDelete = photos.find((p) => p.media_id === mediaId);
        if (photoToDelete) {
          await photoAdminApi.removePhotoFromConfig(photoToDelete.id);
        }

        // Delete the media
        await photoAdminApi.deletePhoto(mediaId);

        // Update UI
        setPhotos((prev) => prev.filter((p) => p.media_id !== mediaId));
        previousPhotosRef.current = photos.filter((p) => p.media_id !== mediaId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete photo";
        setError(errorMessage);
        setPhotos(previousPhotosRef.current);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [photos]
  );

  /**
   * Reorder photos in a configuration key
   */
  const reorderPhotos = useCallback(
    async (configKey: string, mediaIds: string[]) => {
      try {
        setError(null);
        setLoading(true);

        previousPhotosRef.current = photos;

        // Optimistic reorder
        const reordered = photos.map((p) => {
          const newIndex = mediaIds.indexOf(p.media_id);
          return newIndex >= 0 ? { ...p, display_order: newIndex } : p;
        });
        setPhotos(reordered);

        // Update backend
        await photoAdminApi.reorderPhotosInKey(configKey, mediaIds);

        previousPhotosRef.current = reordered;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to reorder photos";
        setError(errorMessage);
        setPhotos(previousPhotosRef.current);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [photos]
  );

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get photos filtered by config key
   */
  const getPhotosByConfigKey = useCallback(
    (configKey: string): AdminPhoto[] => {
      return photos.filter((p) => p.config_key === configKey);
    },
    [photos]
  );

  return {
    photos,
    loading,
    error,
    uploadAndAssign,
    replacePhoto,
    deletePhoto,
    reorderPhotos,
    refreshPhotos,
    clearError,
    getPhotosByConfigKey,
  };
}
