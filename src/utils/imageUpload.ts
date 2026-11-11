/**
 * Image upload utilities
 * Handles file validation, conversion, and preview
 */

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface ImageUploadError {
  type: 'invalid-type' | 'file-too-large' | 'read-error' | 'invalid-image';
  message: string;
}

export interface UploadedImage {
  dataUrl: string;
  filename: string;
  mimeType: string;
  size: number;
}

/**
 * Validate file before upload
 */
export function validateImageFile(file: File): ImageUploadError | null {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        type: 'invalid-type',
        message: `Invalid file type. Allowed formats: JPG, JPEG, PNG, WebP. Got: ${file.type || ext || 'unknown'}`,
      };
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      type: 'file-too-large',
      message: `File is too large. Maximum size is 5MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
    };
  }

  return null;
}

/**
 * Convert file to base64 data URL
 */
export async function fileToDataUrl(file: File): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;

      // Verify it's a valid data URL
      if (!dataUrl.startsWith('data:')) {
        reject({
          type: 'read-error',
          message: 'Failed to read file as data URL',
        } as ImageUploadError);
        return;
      }

      resolve({
        dataUrl,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      });
    };

    reader.onerror = () => {
      reject({
        type: 'read-error',
        message: 'Failed to read file',
      } as ImageUploadError);
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Handle file input change event
 * Returns uploaded image or error
 */
export async function handleFileInput(
  event: React.ChangeEvent<HTMLInputElement>
): Promise<UploadedImage | ImageUploadError> {
  const file = event.target.files?.[0];

  if (!file) {
    return {
      type: 'invalid-type',
      message: 'No file selected',
    };
  }

  // Validate
  const validationError = validateImageFile(file);
  if (validationError) {
    return validationError;
  }

  try {
    return await fileToDataUrl(file);
  } catch (error) {
    if (error instanceof Object && 'type' in error && 'message' in error) {
      return error as ImageUploadError;
    }
    return {
      type: 'read-error',
      message: 'Unknown error occurred',
    };
  }
}

/**
 * Generate semantic filename from original
 */
export function generateSemanticFilename(
  originalFilename: string,
  section: string,
  index?: number
): string {
  const ext = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = new Date().getTime();
  const name = index !== undefined ? `${section}-${index}` : section;
  return `${name}-${timestamp}.${ext}`;
}

/**
 * Create preview URL for display
 * (same as dataUrl for base64 images)
 */
export function createPreviewUrl(dataUrl: string): string {
  return dataUrl;
}
