import sharp from 'sharp';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/utils/logger';

// Image processing configuration
export const ImageConfig = {
  formats: {
    webp: { quality: 80, effort: 6 },
    jpeg: { quality: 85, progressive: true },
    png: { compressionLevel: 8, progressive: true },
  },
  sizes: {
    thumbnail: { width: 300, height: 300, fit: 'cover' as const },
    small: { width: 500, height: 500, fit: 'cover' as const },
    medium: { width: 800, height: 800, fit: 'inside' as const },
    large: { width: 1200, height: 1200, fit: 'inside' as const },
    original: { width: 2000, height: 2000, fit: 'inside' as const },
  },
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
  ],
};

export interface ProcessedImage {
  size: keyof typeof ImageConfig.sizes;
  format: 'webp' | 'jpeg' | 'png';
  url: string;
  path: string;
  width: number;
  height: number;
  fileSize: number;
}

export interface ImageProcessingResult {
  productId: string;
  originalImage: ProcessedImage;
  variants: ProcessedImage[];
  totalSize: number;
  processingTime: number;
}



// Validate image file
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > ImageConfig.maxFileSize) {
    return { 
      valid: false, 
      error: `File size exceeds limit (${ImageConfig.maxFileSize / 1024 / 1024}MB)` 
    };
  }

  if (!ImageConfig.supportedMimeTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Unsupported file type. Supported: ${ImageConfig.supportedMimeTypes.join(', ')}` 
    };
  }

  return { valid: true };
}

// Process single image with multiple size variants
export async function processProductImage(
  file: File,
  productId: string,
  imageIndex = 0
): Promise<ImageProcessingResult> {
  const startTime = Date.now();
  
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const supabase = await createClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  
  const variants: ProcessedImage[] = [];
  let totalSize = 0;

  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    
    // Process each size variant
    for (const [sizeName, sizeConfig] of Object.entries(ImageConfig.sizes)) {
      // Skip processing if original is smaller than target size
      if (sizeName !== 'original' && metadata.width && metadata.height) {
        if (metadata.width < sizeConfig.width && metadata.height < sizeConfig.height) {
          continue;
        }
      }

      // Process WebP version (primary format)
      const webpResult = await processImageVariant(
        buffer,
        productId,
        imageIndex,
        sizeName as keyof typeof ImageConfig.sizes,
        'webp',
        sizeConfig
      );

      if (webpResult) {
        // Upload to Supabase Storage
        const webpPath = `products/${productId}/${imageIndex}_${sizeName}.webp`;
        const { error: webpError } = await supabase.storage
          .from('product-images')
          .upload(webpPath, webpResult.buffer, {
            contentType: 'image/webp',
            cacheControl: '31536000', // 1 year
            upsert: true,
          });

        if (webpError) {
          logger.logError('WebP upload error', webpError as Error, { productId, path: webpPath });
        } else {
          const { data: webpUrl } = supabase.storage
            .from('product-images')
            .getPublicUrl(webpPath);

          variants.push({
            size: sizeName as keyof typeof ImageConfig.sizes,
            format: 'webp',
            url: webpUrl.publicUrl,
            path: webpPath,
            width: webpResult.width,
            height: webpResult.height,
            fileSize: webpResult.buffer.length,
          });
          
          totalSize += webpResult.buffer.length;
        }
      }

      // Process JPEG fallback for better compatibility
      if (sizeName === 'medium' || sizeName === 'large') {
        const jpegResult = await processImageVariant(
          buffer,
          productId,
          imageIndex,
          sizeName as keyof typeof ImageConfig.sizes,
          'jpeg',
          sizeConfig
        );

        if (jpegResult) {
          const jpegPath = `products/${productId}/${imageIndex}_${sizeName}.jpg`;
          const { error: jpegError } = await supabase.storage
            .from('product-images')
            .upload(jpegPath, jpegResult.buffer, {
              contentType: 'image/jpeg',
              cacheControl: '31536000',
              upsert: true,
            });

          if (jpegError) {
            logger.logError('JPEG upload error', jpegError as Error, { productId, path: jpegPath });
          } else {
            const { data: jpegUrl } = supabase.storage
              .from('product-images')
              .getPublicUrl(jpegPath);

            variants.push({
              size: sizeName as keyof typeof ImageConfig.sizes,
              format: 'jpeg',
              url: jpegUrl.publicUrl,
              path: jpegPath,
              width: jpegResult.width,
              height: jpegResult.height,
              fileSize: jpegResult.buffer.length,
            });
            
            totalSize += jpegResult.buffer.length;
          }
        }
      }
    }

    // Find the original/largest variant for the main image
    const originalImage = variants.find(v => v.size === 'original') || 
                         variants.find(v => v.size === 'large') || 
                         variants[0];

    if (!originalImage) {
      throw new Error('Failed to process any image variants');
    }

    const processingTime = Date.now() - startTime;
    
    // Log the image optimization results
    logger.logImageOptimized(file.name, variants.length, {
      productId,
      totalSize,
      processingTime,
      originalSize: file.size,
      compressionRatio: Math.round((1 - totalSize / file.size) * 100)
    });

    return {
      productId,
      originalImage,
      variants,
      totalSize,
      processingTime,
    };

  } catch (error) {
    logger.logError('Image processing error', error as Error, { productId });
    throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Process single image variant
async function processImageVariant(
  buffer: Buffer,
  _productId: string,
  _imageIndex: number,
  sizeName: keyof typeof ImageConfig.sizes,
  format: 'webp' | 'jpeg' | 'png',
  sizeConfig: { width: number; height: number; fit: string }
): Promise<{ buffer: Buffer; width: number; height: number } | null> {
  try {
    let sharpInstance = sharp(buffer)
      .resize(sizeConfig.width, sizeConfig.height, { 
        fit: sizeConfig.fit as keyof sharp.FitEnum,
        withoutEnlargement: true,
      })
      .sharpen()
      .normalize();

    // Apply format-specific options
    switch (format) {
      case 'webp':
        sharpInstance = sharpInstance.webp(ImageConfig.formats.webp);
        break;
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg(ImageConfig.formats.jpeg);
        break;
      case 'png':
        sharpInstance = sharpInstance.png(ImageConfig.formats.png);
        break;
    }

    const processedBuffer = await sharpInstance.toBuffer();
    const metadata = await sharp(processedBuffer).metadata();

    return {
      buffer: processedBuffer,
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (error) {
    logger.logError(`Error processing ${format} variant`, error as Error, { format, sizeName });
    return null;
  }
}

// Batch process multiple images for a product
export async function processProductImages(
  productId: string,
  imageIndex: number,
  file: File
): Promise<ProcessedImage[]> {
  const results: ProcessedImage[] = [];
  
  try {
    const result = await processProductImage(file, productId, imageIndex);
    results.push(result.originalImage);
  } catch (error) {
    logger.logError(`Error processing image ${imageIndex}`, error as Error, { productId, imageIndex });
    // Continue processing other images even if one fails
  }
  
  return results;
}

// Get optimized image URLs for display
export function getOptimizedImageUrl(
  variants: ProcessedImage[],
  preferredSize: keyof typeof ImageConfig.sizes = 'medium',
  preferredFormat: 'webp' | 'jpeg' = 'webp'
): string | null {
  // Try to find exact match
  let image = variants.find(v => v.size === preferredSize && v.format === preferredFormat);
  
  // Fallback to same size, different format
  if (!image) {
    image = variants.find(v => v.size === preferredSize);
  }
  
  // Fallback to any WebP format
  if (!image && preferredFormat === 'jpeg') {
    image = variants.find(v => v.format === 'webp');
  }
  
  // Last resort - any image
  if (!image) {
    image = variants[0];
  }

  return image?.url || null;
}

// Generate responsive image srcSet
export function generateResponsiveSrcSet(variants: ProcessedImage[]): string {
  const webpVariants = variants.filter(v => v.format === 'webp');
  
  return webpVariants
    .map(variant => `${variant.url} ${variant.width}w`)
    .join(', ');
}

// Generate sizes attribute for responsive images
export function generateSizesAttribute(): string {
  return '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw';
}

// Clean up old images when product is deleted
export async function cleanupProductImages(productId: string): Promise<void> {
  try {
    const supabase = await createClient();
    
    // List all files for this product
    const { data: files, error } = await supabase.storage
      .from('product-images')
      .list(`products/${productId}/`);

    if (error) {
      console.error('Error listing files for cleanup:', error);
      return;
    }

    if (files && files.length > 0) {
      const filePaths = files.map(file => `products/${productId}/${file.name}`);
      
      // Delete all files
      const { error: deleteError } = await supabase.storage
        .from('product-images')
        .remove(filePaths);

      if (deleteError) {
        console.error('Error deleting files:', deleteError);
      } else {
        logger.logInfo(`Cleaned up ${filePaths.length} images for product ${productId}`, {
          productId,
          fileCount: filePaths.length
        });
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Image compression utility for existing images
export async function compressExistingImage(
  imageUrl: string,
  targetSize: keyof typeof ImageConfig.sizes = 'medium'
): Promise<Buffer | null> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const sizeConfig = ImageConfig.sizes[targetSize];

    // Compress and resize
    const processedBuffer = await sharp(buffer)
      .resize(sizeConfig.width, sizeConfig.height, { 
        fit: sizeConfig.fit as keyof sharp.FitEnum,
        withoutEnlargement: true,
      })
      .webp(ImageConfig.formats.webp)
      .toBuffer();

    return processedBuffer;
  } catch (error) {
    console.error('Image compression error:', error);
    return null;
  }
} 