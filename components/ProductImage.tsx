'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { 
  ProcessedImage
} from '@/lib/image-processor';
import { logger } from '@/utils/logger';

interface ProductImageProps {
  // Basic props
  alt: string;
  className?: string;
  src?: string;
  
  // Advanced props for optimized images
  variants?: ProcessedImage[];
  quality?: number;
  priority?: boolean;
  fill?: boolean;
  
  // Interaction props
  onLoad?: () => void;
  onError?: () => void;
  
  // Performance props
  loading?: 'lazy' | 'eager';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  style?: React.CSSProperties;
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

  const checkImageCache = useCallback((imgSrc: string): boolean => {
    // Create a temporary image to check if it loads from cache
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
    return false; // Initial state
  }, [productId]);

  useEffect(() => {
    if (src) {
      checkImageCache(src);
    }
  }, [src, checkImageCache]);

  return state;
}

// Generate responsive sizes attribute (unused but kept for reference)
// function generateSizesAttribute(): string {
//   return [
//     '(max-width: 640px) 100vw',
//     '(max-width: 768px) 50vw',
//     '(max-width: 1024px) 33vw',
//     '25vw'
//   ].join(', ');
// }

// Get best image variant for current viewport
function getOptimalImageVariant(
  variants: ProcessedImage[],
  preferredFormat: 'webp' | 'jpeg' = 'webp'
): ProcessedImage | null {
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

export function ProductImage({
  alt,
  className,
  variants,
  quality = 80,
  priority = false,
  onLoad,
  onError,
  loading = 'lazy',
  placeholder = 'blur',
  blurDataURL,
}: ProductImageProps) {
  const [webpSupported, setWebpSupported] = useState<boolean | null>(null);
  const [currentVariant, setCurrentVariant] = useState<ProcessedImage | null>(null);

  // Check WebP support on mount
  useEffect(() => {
    supportsWebP().then(setWebpSupported);
  }, []);

  // Select optimal image variant based on format support
  useEffect(() => {
    if (webpSupported !== null && variants && variants.length > 0) {
      const preferredFormat = webpSupported ? 'webp' : 'jpeg';
      const optimal = getOptimalImageVariant(variants, preferredFormat);
      setCurrentVariant(optimal);
    }
  }, [variants, webpSupported]);

  const imageState = useImageLoad(currentVariant?.url || '', 'productImage');

  // Handle image load success
  useEffect(() => {
    if (!imageState.isLoading && !imageState.hasError && imageState.loadedUrl) {
      onLoad?.();
    }
  }, [imageState.isLoading, imageState.hasError, imageState.loadedUrl, onLoad]);

  // Handle image load error
  useEffect(() => {
    if (imageState.hasError && imageState.errorMessage) {
      onError?.();
    }
  }, [imageState.hasError, imageState.errorMessage, onError]);

  // Generate sizes attribute (if needed)

  // Generate blur placeholder
  const getBlurDataURL = () => {
    if (blurDataURL) return blurDataURL;
    if (variants) {
      const thumbnail = variants.find(v => v.size === 'thumbnail');
      if (thumbnail) {
        return `data:image/svg+xml;base64,${Buffer.from(
          `<svg width="${thumbnail.width}" height="${thumbnail.height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f3f4f6"/>
          </svg>`
        ).toString('base64')}`;
      }
    }
    return `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
      </svg>`
    ).toString('base64')}`;
  };

  // If no image source available, show placeholder
  if (!currentVariant) {
    return (
      <div 
        className={cn(
          'bg-gray-100 flex items-center justify-center text-gray-400',
          'w-full h-full',
          className
        )}
      >
        <svg 
          className="w-12 h-12" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'relative overflow-hidden',
        'w-full h-full',
        className
      )}
    >
      {/* Loading indicator */}
      {!imageState.isLoading && !imageState.hasError && (
        <div 
          className={cn(
            'absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center',
            'z-10'
          )}
        >
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Main image */}
      <Image
        src={currentVariant.url}
        alt={alt}
        fill
        quality={quality}
        priority={priority}
        loading={loading}
        placeholder={placeholder}
        {...(placeholder === 'blur' && getBlurDataURL() ? { blurDataURL: getBlurDataURL() } : {})}
        className={cn(
          'object-cover transition-opacity duration-300',
          imageState.isLoading ? 'opacity-0' : 'opacity-100',
          imageState.hasError && 'hidden'
        )}
        onLoad={() => {
          logger.logInfo('Product image loaded successfully', {
            productId: 'productImage',
            url: currentVariant.url,
            format: currentVariant.format,
            size: currentVariant.size,
          });
        }}
        onError={() => {
          logger.logError('Product image failed to load', undefined, {
            productId: 'productImage',
            url: currentVariant.url,
          });
        }}
      />

      {/* Error state */}
      {imageState.hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400">
          <svg 
            className="w-8 h-8" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
      )}
    </div>
  );
}

// Product image gallery component
interface ProductImageGalleryProps {
  images: (string | ProcessedImage[])[];
  alt: string;
  className?: string;
  thumbnailClassName?: string;
  mainImageClassName?: string;
}

export function ProductImageGallery({
  images,
  alt,
  className,
  thumbnailClassName,
  mainImageClassName,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const currentImage = images[selectedIndex];
  const isVariants = Array.isArray(currentImage) && currentImage.length > 0;

  return (
    <div className={cn('flex flex-col space-y-4', className)}>
      {/* Main image */}
      <div className={cn('relative aspect-square w-full', mainImageClassName)}>
        <ProductImage
          {...(isVariants ? { variants: currentImage as ProcessedImage[] } : {})}
          alt={`${alt} - Image ${selectedIndex + 1}`}
          priority={selectedIndex === 0}
          quality={85}
          className="rounded-lg"
          onLoad={() => console.log('Image loaded')}
        />
      </div>

      {/* Thumbnail navigation */}
      {images.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors',
                index === selectedIndex 
                  ? 'border-blue-500' 
                  : 'border-gray-200 hover:border-gray-300',
                thumbnailClassName
              )}
            >
              <ProductImage
                {...(typeof image === 'string' ? { src: image } : {})}
                {...(Array.isArray(image) ? { variants: image as ProcessedImage[] } : {})}
                alt={`${alt} - Thumbnail ${index + 1}`}
                fill
                quality={70}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Product image with zoom functionality
interface ProductImageZoomProps extends ProductImageProps {
  zoomScale?: number;
  zoomClassName?: string;
}

export function ProductImageZoom({
  zoomScale = 2,
  zoomClassName,
  ...props
}: ProductImageZoomProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = () => {
    setIsZoomed(true);
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  return (
    <div
      className={cn('relative overflow-hidden', zoomClassName)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <ProductImage
        {...props}
        className={cn(
          props.className,
          'transition-transform duration-200',
          isZoomed && `scale-${zoomScale}`
        )}
        style={{
          transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
        }}
      />
    </div>
  );
}

// Lazy loading product image grid
interface ProductImageGridProps {
  products: Array<{
    id: string;
    name: string;
    image_urls?: string[];
    variants?: ProcessedImage[][];
  }>;
  className?: string;
  imageClassName?: string;
  onProductClick?: (productId: string) => void;
}

export function ProductImageGrid({
  products,
  className,
  imageClassName,
  onProductClick,
}: ProductImageGridProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
      {products.map((product) => {
        const firstImage = product.image_urls?.[0] || product.variants?.[0];
        
        return (
          <div
            key={product.id}
            className="relative aspect-square cursor-pointer group"
            onClick={() => onProductClick?.(product.id)}
          >
            <ProductImage
              {...(typeof firstImage === 'string' ? { src: firstImage } : {})}
              {...(Array.isArray(firstImage) ? { variants: firstImage } : {})}
              alt={product.name}
              fill
              quality={75}
              loading="lazy"
              className={cn(
                'rounded-lg transition-transform duration-200 group-hover:scale-105',
                imageClassName
              )}
            />
          </div>
        );
      })}
    </div>
  );
}

// Additional hook for image gallery with preloading
export function useImageGallery(variants: ProcessedImage[], productId: string) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());

  const preloadImage = useCallback((url: string) => {
    if (preloadedImages.has(url)) return;

    const img = document.createElement('img');
    img.onload = () => {
      setPreloadedImages(prev => new Set(prev).add(url));
      logger.logImageServed(url, false, { productId, preloaded: true });
    };
    img.src = url;
  }, [preloadedImages, productId]);

  // Preload next and previous images
  useEffect(() => {
    if (variants.length > 1) {
      const nextIndex = (currentIndex + 1) % variants.length;
      const prevIndex = (currentIndex - 1 + variants.length) % variants.length;
      
      preloadImage(variants[nextIndex]?.url || '');
      preloadImage(variants[prevIndex]?.url || '');
    }
  }, [currentIndex, variants, preloadImage]);

  return {
    currentIndex,
    setCurrentIndex,
    preloadedImages,
    currentVariant: variants[currentIndex],
    hasNext: currentIndex < variants.length - 1,
    hasPrev: currentIndex > 0,
    totalImages: variants.length,
  };
} 