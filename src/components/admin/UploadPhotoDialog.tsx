/**
 * Reusable photo upload dialog component
 *
 * Provides:
 * - File picker with drag-drop support
 * - File validation
 * - Alt text input
 * - Upload progress indication
 * - Error handling
 */

import { useState, useRef } from "react";
import { Icon } from "../Icon";
import { validatePhotoUpload, formatFileSize, getAllowedFileTypesString } from "../../utils/photoValidation";

interface UploadPhotoDialogProps {
  title?: string;
  isOpen: boolean;
  isLoading: boolean;
  onUpload: (file: File, altText: string) => Promise<void>;
  onClose: () => void;
  errorMessage?: string;
  onClearError?: () => void;
}

export function UploadPhotoDialog({
  title = "Upload Photo",
  isOpen,
  isLoading,
  onUpload,
  onClose,
  errorMessage,
  onClearError,
}: UploadPhotoDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setValidationError(null);

    // Validate
    const validation = validatePhotoUpload(file, altText || "Photo from admin");
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid file");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const finalAltText = altText.trim() || "Photo from admin";
    const validation = validatePhotoUpload(selectedFile, finalAltText);

    if (!validation.valid) {
      setValidationError(validation.error || "Invalid file");
      return;
    }

    try {
      await onUpload(selectedFile, finalAltText);
      // Reset form on success
      setSelectedFile(null);
      setAltText("");
      setPreview(null);
      setValidationError(null);
    } catch (error) {
      // Error is handled by parent component
      console.error("Upload failed:", error);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setAltText("");
    setPreview(null);
    setValidationError(null);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-school-navy">{title}</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-lg p-2 text-school-navy/50 transition-colors hover:bg-school-navy/10 disabled:opacity-50"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        {/* Error from parent */}
        {errorMessage && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <Icon name="x" className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{errorMessage}</p>
              {onClearError && (
                <button
                  onClick={onClearError}
                  className="mt-2 text-xs font-medium text-red-600 underline hover:text-red-700"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}

        {/* Validation Error */}
        {validationError && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <Icon name="x" className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{validationError}</p>
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="mb-6 rounded-lg border border-school-navy/10 bg-school-cream p-4">
            <img
              src={preview}
              alt="Preview"
              className="max-h-64 w-full rounded-lg object-contain"
            />
            <p className="mt-3 text-xs text-school-muted">
              {selectedFile && `${selectedFile.name} (${formatFileSize(selectedFile.size)})`}
            </p>
          </div>
        )}

        {/* File Input Area */}
        {!selectedFile ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={getAllowedFileTypesString()}
              onChange={handleFileInput}
              disabled={isLoading}
              className="hidden"
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mb-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                isDragOver
                  ? "border-school-gold bg-school-gold/10"
                  : "border-school-navy/20 hover:border-school-gold/40"
              } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
            >
              <Icon name="image" className="mb-3 h-10 w-10 text-school-gold" />
              <p className="text-center text-sm font-medium text-school-navy">
                Drag photo here or click to browse
              </p>
              <p className="mt-1 text-center text-xs text-school-muted">
                Supported: JPG, PNG, WebP (max 5MB)
              </p>
            </div>
          </>
        ) : null}

        {/* Alt Text Input */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-school-navy">
            Alt Text (for accessibility)
          </label>
          <textarea
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            disabled={isLoading}
            placeholder="Describe what the photo shows..."
            maxLength={500}
            className="w-full rounded-lg border border-school-navy/10 px-3 py-2 text-sm placeholder-school-muted/50 focus:border-school-gold focus:outline-none disabled:opacity-50"
            rows={3}
          />
          <p className="mt-1 text-xs text-school-muted">
            {altText.length}/500 characters
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-school-navy/20 px-4 py-2.5 text-sm font-medium text-school-navy transition-colors hover:bg-school-navy/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !altText.trim() || isLoading}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${
              !selectedFile || !altText.trim() || isLoading
                ? "cursor-not-allowed bg-school-gold/50"
                : "bg-school-gold hover:bg-school-gold-hover"
            }`}
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Uploading...
              </>
            ) : (
              <>
                <Icon name="upload" className="h-4 w-4" />
                Upload Photo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
