'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';

interface ImageVariant {
  width: number;
  height: number;
  format: 'webp' | 'jpeg' | 'png';
  quality: number;
  url: string;
}

interface OptimizedImageProps {
  variants: ImageVariant[];
  alt: string;
  productId: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  onImageLoad?: () => void;
  onImageError?: (error: string) => void;
}

interface ImageLoadState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  loadedUrl?: string;
}

// Custom hook for image loading with cache detection
function useImageLoad(src: string, productId: string) {
  const [state, setState] = useState<ImageLoadState>({
    isLoading: true,
    hasError: false,
  });

  const checkImageCache = useCallback((imgSrc: string) => {
    if (!imgSrc) return;
    
    const img = document.createElement('img');
    const startTime = performance.now();
    
    img.onload = () => {
      const loadTime = performance.now() - startTime;
      const fromCache = loadTime < 10; // Likely from cache if < 10ms
      
      logger.logImageServed(imgSrc, fromCache, {
        productId,
        loadTime: Math.round(loadTime),
      });
      
      setState({
        isLoading: false,
        hasError: false,
        loadedUrl: imgSrc,
      });
    };

    img.onerror = () => {
      logger.logError(`Failed to load product image: ${imgSrc}`, undefined, {
        productId,
      });
      
      setState({
        isLoading: false,
        hasError: true,
        errorMessage: 'Failed to load image',
      });
    };

    img.src = imgSrc;
  }, [productId]);

  useEffect(() => {
    if (src) {
      checkImageCache(src);
    }
  }, [src, checkImageCache]);

  return state;
}

// Generate responsive sizes attribute
function generateSizesAttribute(): string {
  return [
    '(max-width: 640px) 100vw',
    '(max-width: 768px) 50vw',
    '(max-width: 1024px) 33vw',
    '25vw'
  ].join(', ');
}

// Get best image variant for current viewport
function getOptimalImageVariant(
  variants: ImageVariant[],
  preferredFormat: 'webp' | 'jpeg' = 'webp'
): ImageVariant | null {
  if (!variants.length) return null;

  // Try to find WebP variant first (better compression)
  const webpVariant = variants.find(v => v.format === preferredFormat);
  if (webpVariant) return webpVariant;

  // Fallback to JPEG
  const jpegVariant = variants.find(v => v.format === 'jpeg');
  if (jpegVariant) return jpegVariant;

  // Return any available variant
  return variants[0] || null;
}

// Generate srcSet for responsive images
function generateSrcSet(variants: ImageVariant[]): string {
  return variants
    .sort((a, b) => a.width - b.width)
    .map(variant => `${variant.url} ${variant.width}w`)
    .join(', ');
}

// Check browser WebP support
function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = document.createElement('img');
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

export default function OptimizedImage({
  variants,
  alt,
  productId,
  className = '',
  priority = false,
  sizes,
  onImageLoad,
  onImageError,
}: OptimizedImageProps): React.JSX.Element {
  const [webpSupported, setWebpSupported] = useState<boolean | null>(null);
  const [currentVariant, setCurrentVariant] = useState<ImageVariant | null>(null);

  // Check WebP support on mount
  useEffect(() => {
    supportsWebP().then(setWebpSupported);
  }, []);

  // Select optimal image variant based on format support
  useEffect(() => {
    if (webpSupported !== null && variants.length > 0) {
      const preferredFormat = webpSupported ? 'webp' : 'jpeg';
      const optimal = getOptimalImageVariant(variants, preferredFormat);
      setCurrentVariant(optimal);
    }
  }, [variants, webpSupported]);

  const imageState = useImageLoad(currentVariant?.url || '', productId);

  // Handle image load success
  useEffect(() => {
    if (!imageState.isLoading && !imageState.hasError && imageState.loadedUrl) {
      onImageLoad?.();
    }
  }, [imageState.isLoading, imageState.hasError, imageState.loadedUrl, onImageLoad]);

  // Handle image load error
  useEffect(() => {
    if (imageState.hasError && imageState.errorMessage) {
      onImageError?.(imageState.errorMessage);
    }
  }, [imageState.hasError, imageState.errorMessage, onImageError]);

  if (!currentVariant) {
    return (
      <div className={`bg-gray-200 animate-pulse ${className}`}>
        <div className="h-full w-full flex items-center justify-center text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  if (imageState.hasError) {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 ${className}`}>
        <div className="h-full w-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">Image not available</p>
          </div>
        </div>
      </div>
    );
  }

  const webpVariants = variants.filter(v => v.format === 'webp');
  const jpegVariants = variants.filter(v => v.format === 'jpeg');
  const responsiveSizes = sizes || generateSizesAttribute();

  return (
    <div className={`relative ${className}`}>
      {imageState.isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      <picture>
        {/* WebP sources for modern browsers */}
        {webpVariants.length > 0 && (
          <source
            srcSet={generateSrcSet(webpVariants)}
            sizes={responsiveSizes}
            type="image/webp"
          />
        )}
        
        {/* JPEG fallback */}
        {jpegVariants.length > 0 && (
          <source
            srcSet={generateSrcSet(jpegVariants)}
            sizes={responsiveSizes}
            type="image/jpeg"
          />
        )}

        {/* Main image element */}
        <img
          src={currentVariant.url}
          alt={alt}
          width={currentVariant.width}
          height={currentVariant.height}
          className={`transition-opacity duration-300 ${
            imageState.isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          sizes={responsiveSizes}
          onLoad={() => {
            logger.logInfo('Product image loaded successfully', {
              productId,
              url: currentVariant.url,
              format: currentVariant.format,
              width: currentVariant.width,
              height: currentVariant.height,
            });
          }}
          onError={() => {
            logger.logError('Product image failed to load', undefined, {
              productId,
              url: currentVariant.url,
            });
          }}
        />
      </picture>
      
      {/* Image optimization badge for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {currentVariant.format.toUpperCase()} • {currentVariant.width}×{currentVariant.height}
        </div>
      )}
    </div>
  );
} 