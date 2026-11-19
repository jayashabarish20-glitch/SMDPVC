import type { PhotoMetadata } from "../data/photoService";
import {
  addKeyedPhoto,
  dataUrlToFile,
  removeKeyedPhoto,
  replaceKeyedPhoto,
  type KeyedPhoto,
} from "../services/photoKeyApi";
import { usePhotoKey } from "./usePhotoKey";

function toMetadata(photo: KeyedPhoto | undefined): PhotoMetadata | null {
  if (!photo) return null;
  return {
    id: photo.configId,
    filename: photo.filename,
    alt: photo.alt,
    updatedAt: photo.updatedAt,
    imageUrl: photo.imageUrl,
    dataUrl: photo.imageUrl,
  };
}

function errorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Something went wrong. Please try again.";
}

/**
 * One backend photo per config_key (single-slot card). Replace keeps the
 * same link and position; remove unlinks and deletes the Cloudinary asset.
 */
export function useSingleSlot(configKey: string) {
  const { photos, reload, setError } = usePhotoKey(configKey);
  const current = photos[0];

  const update = async (photo: PhotoMetadata) => {
    setError(null);
    try {
      const file = await dataUrlToFile(photo.dataUrl as string, photo.filename || "photo.jpg");
      if (current) {
        await replaceKeyedPhoto(current.mediaId, file);
      } else {
        await addKeyedPhoto(file, configKey, 0);
      }
      await reload();
    } catch (cause) {
      setError(errorMessage(cause));
    }
  };

  const remove = async () => {
    if (!current) return;
    setError(null);
    try {
      await removeKeyedPhoto(current.configId, current.mediaId);
      await reload();
    } catch (cause) {
      setError(errorMessage(cause));
      await reload();
    }
  };

  return { current: toMetadata(current), update, remove, reload };
}
