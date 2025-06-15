import { RedisUtils, CacheTTL } from '@/lib/redis';
import { logger } from '@/utils/logger';

// Generic cache interface
export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  skipCache?: boolean;
  forceRefresh?: boolean;
}

// Cache miss/hit tracking for monitoring
let cacheStats = {
  hits: 0,
  misses: 0,
  errors: 0,
};

export const getCacheStats = () => ({ ...cacheStats });
export const resetCacheStats = () => {
  cacheStats = { hits: 0, misses: 0, errors: 0 };
};

// Main cache utility function - getOrSet pattern
export async function getOrSetCache<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = CacheTTL.MEDIUM, skipCache = false, forceRefresh = false } = options;

  // Skip cache entirely if requested
  if (skipCache) {
    try {
      return await fetchFunction();
    } catch (error) {
      logger.logError(`Cache skip - fetch error for key ${key}`, error as Error);
      throw error;
    }
  }

  // Force refresh - delete existing cache and fetch new data
  if (forceRefresh) {
    await RedisUtils.del(key);
  }

  try {
    // Try to get from cache first
    const cachedValue = await RedisUtils.get<T>(key);
    
    if (cachedValue !== null) {
      cacheStats.hits++;
      logger.logCacheHit(key, { ttl, tags: options.tags });
      return cachedValue;
    }
  } catch (error) {
    logger.logError(`Cache GET error for key ${key}`, error as Error);
    cacheStats.errors++;
    // Continue to fetch from source if cache fails
  }

  // Cache miss - fetch from source
  cacheStats.misses++;
  logger.logCacheMiss(key, { ttl, tags: options.tags });
  
  try {
    const freshValue = await fetchFunction();
    
    // Store in cache (fire and forget)
    RedisUtils.set(key, freshValue, ttl).then(() => {
      logger.logCacheSet(key, ttl, { tags: options.tags });
    }).catch(error => {
      logger.logError(`Cache SET error for key ${key}`, error as Error);
      cacheStats.errors++;
    });

    // Store tags for invalidation (if provided)
    if (options.tags && options.tags.length > 0) {
      storeCacheTags(key, options.tags).catch(error => {
        logger.logError(`Cache tags storage error for key ${key}`, error as Error);
      });
    }

    return freshValue;
  } catch (error) {
    logger.logError(`Data fetch error for key ${key}`, error as Error);
    throw error;
  }
}

// Store cache key associations with tags for easy invalidation
async function storeCacheTags(cacheKey: string, tags: string[]): Promise<void> {
  try {
    const promises = tags.map(tag => 
      RedisUtils.sadd(`cache:tag:${tag}`, cacheKey)
    );
    await Promise.all(promises);
  } catch (error) {
    logger.logError('Error storing cache tags', error as Error);
  }
}

// Invalidate cache by tags
export async function invalidateCacheByTags(tags: string[]): Promise<number> {
  try {
    let totalDeleted = 0;

    for (const tag of tags) {
      const tagKey = `cache:tag:${tag}`;
      const associatedKeys = await RedisUtils.smembers(tagKey);
      
      if (associatedKeys.length > 0) {
        // Delete the cached data
        const deleted = await RedisUtils.del(associatedKeys);
        totalDeleted += deleted;
        
        // Delete the tag association
        await RedisUtils.del(tagKey);
      }
    }

    return totalDeleted;
  } catch (error) {
    logger.logError('Error invalidating cache by tags', error as Error);
    return 0;
  }
}

// Invalidate cache by pattern
export async function invalidateCacheByPattern(pattern: string): Promise<number> {
  try {
    return await RedisUtils.delByPattern(pattern);
  } catch (error) {
    logger.logError(`Error invalidating cache by pattern ${pattern}`, error as Error);
    return 0;
  }
}

// Specific cache utilities for common e-commerce operations
export const CacheUtils = {
  // Product caching utilities
  async getProduct<T>(productId: string, fetchFn: () => Promise<T>): Promise<T> {
    return getOrSetCache(
      `cache:product:${productId}`,
      fetchFn,
      { ttl: CacheTTL.PRODUCT, tags: ['products', `product:${productId}`] }
    );
  },

  async getProducts<T>(cacheKey: string, fetchFn: () => Promise<T>, tags: string[] = []): Promise<T> {
    return getOrSetCache(
      cacheKey,
      fetchFn,
      { ttl: CacheTTL.MEDIUM, tags: ['products', ...tags] }
    );
  },

  async getCategory<T>(categoryId: string, fetchFn: () => Promise<T>): Promise<T> {
    return getOrSetCache(
      `cache:category:${categoryId}`,
      fetchFn,
      { ttl: CacheTTL.LONG, tags: ['categories', `category:${categoryId}`] }
    );
  },

  async getCategories<T>(
    arg1: string | (() => Promise<T>),
    arg2?: (() => Promise<T>) | string[],
    arg3: string[] = []
  ): Promise<T> {
    let cacheKey: string;
    let fetchFn: () => Promise<T>;
    let extraTags: string[];

    if (typeof arg1 === 'string') {
      // Signature: (cacheKey, fetchFn, tags?)
      cacheKey = arg1;
      fetchFn = arg2 as () => Promise<T>;
      extraTags = arg3;
    } else {
      // Signature: (fetchFn)
      cacheKey = 'cache:categories:all';
      fetchFn = arg1;
      extraTags = (arg2 as string[]) ?? [];
    }

    return getOrSetCache(
      cacheKey,
      fetchFn,
      { ttl: CacheTTL.LONG, tags: ['categories', ...extraTags] }
    );
  },

  async getBrand<T>(brandId: string, fetchFn: () => Promise<T>): Promise<T> {
    return getOrSetCache(
      `cache:brand:${brandId}`,
      fetchFn,
      { ttl: CacheTTL.LONG, tags: ['brands', `brand:${brandId}`] }
    );
  },

  async getBanners<T>(bannerType: string, fetchFn: () => Promise<T>): Promise<T> {
    return getOrSetCache(
      `cache:banners:${bannerType}`,
      fetchFn,
      { ttl: CacheTTL.BANNERS, tags: ['banners', `banners:${bannerType}`] }
    );
  },

  async getHomepageContent<T>(fetchFn: () => Promise<T>): Promise<T> {
    return getOrSetCache(
      'cache:homepage:content',
      fetchFn,
      { ttl: CacheTTL.HOMEPAGE, tags: ['homepage', 'banners', 'products'] }
    );
  },

  // Search results caching
  async getSearchResults<T>(
    query: string,
    filters: Record<string, unknown>,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const filtersHash = Buffer.from(JSON.stringify(filters)).toString('base64');
    const cacheKey = `cache:search:${query}:${filtersHash}`;
    
    return getOrSetCache(
      cacheKey,
      fetchFn,
      { ttl: CacheTTL.SEARCH, tags: ['search', 'products'] }
    );
  },
};

// Cache warming utilities
export const CacheWarmer = {
  // Pre-load critical homepage data
  async warmHomepageCache(): Promise<void> {
    logger.logInfo('Starting homepage cache warming...');
    
    try {
      // These would be your actual data fetching functions
      const warmingTasks: Promise<unknown>[] = [
        // Warm featured products
        // CacheUtils.getProducts('cache:products:featured', fetchFeaturedProducts),
        // Warm categories
        // CacheUtils.getCategories(fetchAllCategories),
        // Warm hero banners
        // CacheUtils.getBanners('hero', fetchHeroBanners),
      ];

      await Promise.allSettled(warmingTasks);
      logger.logInfo('Homepage cache warming completed');
    } catch (error) {
      logger.logError('Error during cache warming', error as Error);
    }
  },

  // Pre-load category data
  async warmCategoryCache(categoryId: string): Promise<void> {
    logger.logInfo(`Warming cache for category: ${categoryId}`);
    
    try {
      // These would be your actual category data fetching functions
      const warmingTasks: Promise<unknown>[] = [
        // CacheUtils.getCategory(categoryId, () => fetchCategoryById(categoryId)),
        // CacheUtils.getProducts(`cache:products:category:${categoryId}`, () => fetchProductsByCategory(categoryId)),
      ];

      await Promise.allSettled(warmingTasks);
      logger.logInfo(`Category cache warming completed for: ${categoryId}`);
    } catch (error) {
      logger.logError(`Error warming category cache for ${categoryId}`, error as Error);
    }
  },
};

// Cache invalidation utilities for common scenarios
export const CacheInvalidator = {
  // Invalidate all product-related caches
  async invalidateProductCaches(productId?: string): Promise<void> {
    const tags = ['products'];
    if (productId) {
      tags.push(`product:${productId}`);
    }
    await invalidateCacheByTags(tags);
  },

  // Invalidate category-related caches
  async invalidateCategoryCaches(categoryId?: string): Promise<void> {
    const tags = ['categories'];
    if (categoryId) {
      tags.push(`category:${categoryId}`);
    }
    await invalidateCacheByTags(tags);
  },

  // Invalidate brand-related caches
  async invalidateBrandCaches(brandId?: string): Promise<void> {
    const tags = ['brands'];
    if (brandId) {
      tags.push(`brand:${brandId}`);
    }
    await invalidateCacheByTags(tags);
  },

  // Invalidate banner caches
  async invalidateBannerCaches(): Promise<void> {
    await invalidateCacheByTags(['banners']);
  },

  // Invalidate homepage caches
  async invalidateHomepageCaches(): Promise<void> {
    await invalidateCacheByTags(['homepage']);
  },

  // Invalidate search caches
  async invalidateSearchCaches(): Promise<void> {
    await invalidateCacheByPattern('cache:search:*');
  },

  // Full cache flush (use with caution)
  async flushAllCaches(): Promise<void> {
    await invalidateCacheByPattern('cache:*');
  },
};

// Development utilities
export const CacheDebug = {
  // Check cache status for a key
  async checkCacheStatus(key: string) {
    const exists = await RedisUtils.exists(key);
    const ttl = exists ? await RedisUtils.ttl(key) : -1;
    
    return {
      key,
      exists,
      ttl,
      ttlFormatted: ttl > 0 ? `${Math.floor(ttl / 60)}m ${ttl % 60}s` : 'N/A',
    };
  },

  // Get cache usage statistics
  async getCacheUsage(pattern = 'cache:*') {
    try {
      const redis = await import('@/lib/redis').then(m => m.getRedisClient());
      const keys = await redis.keys(pattern);
      
      const keyDetails = await Promise.all(
        keys.map(async (key) => {
          const ttl = await redis.ttl(key);
          const type = await redis.type(key);
          return { key, ttl, type };
        })
      );

      return {
        totalKeys: keys.length,
        keysByType: keyDetails.reduce((acc, item) => {
          acc[item.type] = (acc[item.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        keyDetails: keyDetails.sort((a, b) => b.ttl - a.ttl),
        stats: getCacheStats(),
      };
    } catch (error) {
      logger.logError('Error getting cache usage', error as Error);
      return null;
    }
  },
}; 