import React, { useState } from 'react';
import { getOptimizedImageUrl } from '@/src/services/cloudinary/cloudinary.service';
import { User, Dog, ImageOff } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  fallbackType?: 'person' | 'pet' | 'generic';
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fallbackType = 'generic',
  className = '',
  loading = 'lazy',
  ...rest
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);

  const optimizedSrc = src ? getOptimizedImageUrl(src, { width, height }) : null;

  if (!optimizedSrc || hasError) {
    return (
      <div
        className={`bg-[#e8ecea] text-[#6d7a77] flex flex-col items-center justify-center p-4 text-center select-none ${className}`}
        style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}
        role="img"
        aria-label={alt || 'Imagen no disponible'}
      >
        {fallbackType === 'person' && <User className="w-1/3 h-1/3 max-w-12 max-h-12 text-[#9ba5a2] mb-1" />}
        {fallbackType === 'pet' && <Dog className="w-1/3 h-1/3 max-w-12 max-h-12 text-[#9ba5a2] mb-1" />}
        {fallbackType === 'generic' && <ImageOff className="w-1/3 h-1/3 max-w-12 max-h-12 text-[#9ba5a2] mb-1" />}
        <span className="text-[10px] font-medium text-[#7c8684] line-clamp-1">
          Sin foto
        </span>
      </div>
    );
  }

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      onError={() => setHasError(true)}
      className={className}
      {...rest}
    />
  );
}
