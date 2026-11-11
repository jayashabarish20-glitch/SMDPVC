/**
 * Photo validation utilities
 *
 * Provides validation for image files and metadata
 */

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ALT_TEXT_LENGTH = 500;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate image file format and size
 */
export function validateImageFile(file: File): ValidationResult {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed formats: JPG, JPEG, PNG, WebP. Got: ${file.type || ext || 'unknown'}`,
      };
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    return {
      valid: false,
      error: `File is too large. Maximum size is 5MB. Your file is ${sizeMB}MB.`,
    };
  }

  return { valid: true };
}

/**
 * Validate alt text for accessibility
 */
export function validateAltText(text: string): ValidationResult {
  if (!text || text.trim().length === 0) {
    return {
      valid: false,
      error: 'Alt text is required for accessibility',
    };
  }

  if (text.length > MAX_ALT_TEXT_LENGTH) {
    return {
      valid: false,
      error: `Alt text is too long. Maximum ${MAX_ALT_TEXT_LENGTH} characters. Got: ${text.length}`,
    };
  }

  return { valid: true };
}

/**
 * Validate both file and alt text together
 */
export function validatePhotoUpload(
  file: File,
  altText: string
): ValidationResult {
  const fileValidation = validateImageFile(file);
  if (!fileValidation.valid) {
    return fileValidation;
  }

  const altValidation = validateAltText(altText);
  if (!altValidation.valid) {
    return altValidation;
  }

  return { valid: true };
}

/**
 * Get allowed file types string for file input accept attribute
 */
export function getAllowedFileTypesString(): string {
  return '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
