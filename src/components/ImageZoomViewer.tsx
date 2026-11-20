import { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface ImageZoomViewerProps {
  imageUrl: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageZoomViewer({ imageUrl, alt, isOpen, onClose }: ImageZoomViewerProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Zoomed image viewer"
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Image container */}
      <div className="relative z-10 max-h-[90vh] max-w-[90vw] flex items-center justify-center">
        <img
          src={imageUrl}
          alt={alt}
          className={`max-h-[85vh] max-w-[85vw] rounded-lg object-contain transition-transform duration-300 ${
            isAnimating ? 'scale-100' : 'scale-95'
          }`}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-20 rounded-full bg-white/90 p-2 hover:bg-white transition-colors"
        aria-label="Close image viewer"
        type="button"
      >
        <Icon name="close" className="h-6 w-6 text-school-navy" />
      </button>
    </div>
  );
}
