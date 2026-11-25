import { useState, type ReactNode } from 'react';

interface MediaImageProps {
  src: string | null;
  alt: string;
  className?: string;
  /** Rendered when there is no URL or the image fails to load. */
  fallback?: ReactNode;
}

/** <img> that shows the fallback instead of a broken image icon. */
export function MediaImage({ src, alt, className, fallback = null }: MediaImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) return <>{fallback}</>;
  return <img src={src} alt={alt} className={className} onError={() => setFailedSrc(src)} />;
}
