import { Redis } from 'ioredis';

let redis: Redis | null = null;

// Redis connection configuration
const getRedisConfig = () => {
  // For production (Upstash Redis or other cloud providers)
  if (process.env['REDIS_URL']) {
    return {
      url: process.env['REDIS_URL'],
      family: 6, // Use IPv6 if available
      keepAlive: 30000,
      connectTimeout: 10000,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    };
  }

  // For local development
  return {
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379'),
    password: process.env['REDIS_PASSWORD'] || undefined,
    db: parseInt(process.env['REDIS_DB'] || '0'),
    family: 4, // Use IPv4 for local
    keepAlive: 30000,
    connectTimeout: 10000,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  };
};

export const getRedisClient = (): Redis => {
  if (!redis) {
    const config = getRedisConfig();
    
    if (process.env['REDIS_URL']) {
      redis = new Redis(config.url!, {
        family: config.family,
        keepAlive: config.keepAlive,
        connectTimeout: config.connectTimeout,
        lazyConnect: config.lazyConnect,
        maxRetriesPerRequest: config.maxRetriesPerRequest,
      });
    } else {
      const { password, ...restConfig } = config;
      const finalConfig = password ? { ...restConfig, password } : restConfig;
      redis = new Redis(finalConfig);
    }

    redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redis.on('ready', () => {
      console.log('Redis ready for operations');
    });
  }

  return redis;
};

// Cache key generators for consistent naming
export const CacheKeys = {
  // Product-related keys
  product: (id: string) => `cache:product:${id}`,
  products: (params: string) => `cache:products:${params}`,
  productsByCategory: (categoryId: string, page = 1) => `cache:products:category:${categoryId}:page:${page}`,
  productsByBrand: (brandId: string, page = 1) => `cache:products:brand:${brandId}:page:${page}`,
  featuredProducts: () => 'cache:products:featured',
  bestsellerProducts: () => 'cache:products:bestsellers',
  newProducts: () => 'cache:products:new',
  recommendedProducts: () => 'cache:products:recommended',

  // Category-related keys
  category: (id: string) => `cache:category:${id}`,
  categoryBySlug: (slug: string) => `cache:category:slug:${slug}`,
  categories: () => 'cache:categories:all',
  categoriesHierarchy: () => 'cache:categories:hierarchy',
  categoriesTree: (parentId?: string) => `cache:categories:tree:${parentId || 'root'}`,

  // Brand-related keys
  brand: (id: string) => `cache:brand:${id}`,
  brandBySlug: (slug: string) => `cache:brand:slug:${slug}`,
  brands: () => 'cache:brands:all',
  topBrands: () => 'cache:brands:top',

  // Banner-related keys
  heroBanners: () => 'cache:banners:hero',
  secondaryHeroBanners: () => 'cache:banners:secondary',
  positionedBanners: (position: string) => `cache:banners:positioned:${position}`,
  gridBanners: () => 'cache:banners:grid',
  categoryBanners: (categoryId: string) => `cache:banners:category:${categoryId}`,

  // Homepage content
  homepageContent: () => 'cache:homepage:content',
  quickAccessButtons: () => 'cache:homepage:quick-access',

  // Search and filtering
  searchResults: (query: string, filters: string) => `cache:search:${query}:${filters}`,
  productFilters: (categoryId?: string) => `cache:filters:${categoryId || 'all'}`,

  // Page sections
  categoryPageSections: (categoryId: string) => `cache:category:sections:${categoryId}`,
  
  // Stats and counters
  productViews: (productId: string) => `cache:stats:views:${productId}`,
  popularProducts: (period: string) => `cache:stats:popular:${period}`,
};

// TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 60, // 1 minute - for frequently changing data
  MEDIUM: 300, // 5 minutes - for semi-static data
  LONG: 1800, // 30 minutes - for static content
  VERY_LONG: 3600, // 1 hour - for rarely changing data
  HOMEPAGE: 180, // 3 minutes - for homepage content
  PRODUCT: 600, // 10 minutes - for product details
  SEARCH: 300, // 5 minutes - for search results
  BANNERS: 900, // 15 minutes - for banner content
};

// Utility functions for common Redis operations
export const RedisUtils = {
  // Generic get/set with JSON serialization
  async get<T>(key: string): Promise<T | null> {
    try {
      const redis = getRedisClient();
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  },

  async set<T>(key: string, value: T, ttl: number): Promise<boolean> {
    try {
      const redis = getRedisClient();
      const serialized = JSON.stringify(value);
      await redis.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  },

  // Delete keys
  async del(keys: string | string[]): Promise<number> {
    try {
      const redis = getRedisClient();
      const keysArray = Array.isArray(keys) ? keys : [keys];
      return await redis.del(...keysArray);
    } catch (error) {
      console.error('Redis DEL error:', error);
      return 0;
    }
  },

  // Delete by pattern
  async delByPattern(pattern: string): Promise<number> {
    try {
      const redis = getRedisClient();
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        return await redis.del(...keys);
      }
      return 0;
    } catch (error) {
      console.error(`Redis DEL by pattern error for ${pattern}:`, error);
      return 0;
    }
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      const redis = getRedisClient();
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  },

  // Get TTL of a key
  async ttl(key: string): Promise<number> {
    try {
      const redis = getRedisClient();
      return await redis.ttl(key);
    } catch (error) {
      console.error(`Redis TTL error for key ${key}:`, error);
      return -1;
    }
  },

  // Increment counter
  async incr(key: string, ttl?: number): Promise<number> {
    try {
      const redis = getRedisClient();
      const result = await redis.incr(key);
      if (ttl && result === 1) {
        await redis.expire(key, ttl);
      }
      return result;
    } catch (error) {
      console.error(`Redis INCR error for key ${key}:`, error);
      return 0;
    }
  },

  // Set operations for tags, categories, etc.
  async sadd(key: string, members: string | string[]): Promise<number> {
    try {
      const redis = getRedisClient();
      const membersArray = Array.isArray(members) ? members : [members];
      return await redis.sadd(key, ...membersArray);
    } catch (error) {
      console.error(`Redis SADD error for key ${key}:`, error);
      return 0;
    }
  },

  async smembers(key: string): Promise<string[]> {
    try {
      const redis = getRedisClient();
      return await redis.smembers(key);
    } catch (error) {
      console.error(`Redis SMEMBERS error for key ${key}:`, error);
      return [];
    }
  },
};

// Graceful shutdown
export const closeRedisConnection = async (): Promise<void> => {
  if (redis) {
    try {
      await redis.quit();
      redis = null;
      console.log('Redis connection closed');
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }
};

// Export the Redis instance for direct access when needed
export { redis }; 