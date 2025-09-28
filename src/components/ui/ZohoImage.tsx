'use client';

import { useState } from 'react';
import Image from 'next/image';
import { buildImageUrl } from '@/lib/utils/imageUtils';

interface ZohoImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  fallbackClassName?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

export default function ZohoImage({
  src,
  alt,
  className = '',
  fallbackText,
  fallbackClassName = '',
  sizes = '100vw',
  priority = false,
  quality = 75,
  objectFit = 'contain'
}: ZohoImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Build image URL using utility function for consistency
  const processedImageUrl = buildImageUrl(src);
  

  // If no src provided, no processed URL, or error occurred, show fallback
  if (!src || !processedImageUrl || imageError) {
    return (
      <div className={fallbackClassName || `bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center ${className}`}>
        <span className={fallbackClassName?.includes('red') ? 'text-red-600 font-bold text-sm' : 'text-blue-600 font-bold text-sm'}>
          {fallbackText || alt.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading state */}
      {isLoading && (
        <div className={`absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Next.js Image component for optimized loading */}
      <Image
        src={processedImageUrl}
        alt={alt}
        fill
        sizes={sizes}
        className={`object-${objectFit} bg-white rounded-lg ${objectFit === 'contain' ? 'p-1' : ''} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        quality={quality}
        priority={priority}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImageError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
} 