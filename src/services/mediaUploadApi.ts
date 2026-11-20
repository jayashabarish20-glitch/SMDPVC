import { getToken } from "../utils/storage";

const API_BASE = "/api";

export interface UploadedMedia {
  id: string;
  imageUrl: string;
  alt: string;
  original_filename: string;
}

export async function uploadImage(
  file: File,
  altText: string = "",
): Promise<UploadedMedia> {
  // For now, use the temporary topper endpoint which doesn't require Cloudinary
  return uploadToppingImage(file, altText);
}

export async function uploadToppingImage(
  file: File,
  altText: string = "",
): Promise<UploadedMedia> {
  const token = getToken();
  if (!token) {
    throw new Error("Please log in again to upload images.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("alt_text", altText);

  try {
    // Use temporary topper upload endpoint that uses local storage
    const response = await fetch(`${API_BASE}/media/upload-topper`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error("Unauthorized - please log in again");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        (errorData as Record<string, unknown>).detail ||
        (errorData as Record<string, unknown>).message ||
        `Upload failed with status ${response.status}`;
      throw new Error(String(errorMessage));
    }

    const data = await response.json();
    return {
      id: data.id,
      imageUrl: data.image_url || data.imageUrl,
      alt: data.alt_text || data.alt || altText,
      original_filename: data.original_filename,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred during upload");
  }
}
