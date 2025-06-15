import { 
  CacheInvalidator, 
  CacheWarmer, 
  CacheDebug, 
  getCacheStats, 
  resetCacheStats 
} from '@/utils/cache';
import { RedisUtils } from '@/lib/redis';

// Cache management interface
export interface CacheManagementOptions {
  verbose?: boolean;
  dryRun?: boolean;
  maxConcurrency?: number;
}

// Cache warming scheduler
export class CacheWarmingScheduler {
  private static instance: CacheWarmingScheduler;
  private isRunning = false;
  private intervals: NodeJS.Timeout[] = [];

  static getInstance(): CacheWarmingScheduler {
    if (!CacheWarmingScheduler.instance) {
      CacheWarmingScheduler.instance = new CacheWarmingScheduler();
    }
    return CacheWarmingScheduler.instance;
  }

  // Start scheduled cache warming
  startScheduledWarming(options: CacheManagementOptions = {}) {
    if (this.isRunning) {
      console.log('Cache warming scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting cache warming scheduler...');

    // Warm homepage cache every 5 minutes
    const homepageInterval = setInterval(async () => {
      try {
        if (options.verbose) console.log('Warming homepage cache...');
        await CacheWarmer.warmHomepageCache();
      } catch (error) {
        console.error('Homepage cache warming error:', error);
      }
    }, 5 * 60 * 1000);

    // Warm category caches every 10 minutes
    const categoryInterval = setInterval(async () => {
      try {
        if (options.verbose) console.log('Warming category caches...');
        await this.warmPopularCategories(options);
      } catch (error) {
        console.error('Category cache warming error:', error);
      }
    }, 10 * 60 * 1000);

    this.intervals.push(homepageInterval, categoryInterval);
  }

  // Stop scheduled cache warming
  stopScheduledWarming() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    this.isRunning = false;
    console.log('Cache warming scheduler stopped');
  }

  // Warm popular categories based on usage
  private async warmPopularCategories(options: CacheManagementOptions = {}) {
    try {
      // This would typically be based on analytics data
      // For now, we'll warm the first few categories
      const popularCategoryIds = await this.getPopularCategoryIds();
      
      const concurrency = options.maxConcurrency || 3;
      for (let i = 0; i < popularCategoryIds.length; i += concurrency) {
        const batch = popularCategoryIds.slice(i, i + concurrency);
        await Promise.allSettled(
          batch.map(categoryId => CacheWarmer.warmCategoryCache(categoryId))
        );
      }
    } catch (error) {
      console.error('Error warming popular categories:', error);
    }
  }

  // Get popular category IDs (would integrate with analytics)
  private async getPopularCategoryIds(): Promise<string[]> {
    // This is a placeholder - in production, you'd get this from analytics
    const keys = await RedisUtils.smembers('cache:popular_categories');
    return keys.length > 0 ? keys : ['default-category-1', 'default-category-2'];
  }
}

// Cache monitoring utilities
export class CacheMonitor {
  // Monitor cache health and performance
  static async getHealthReport(): Promise<{
    health: 'healthy' | 'warning' | 'critical';
    stats: Record<string, unknown>;
    recommendations: string[];
  }> {
    try {
      const stats = getCacheStats();
      const usage = await CacheDebug.getCacheUsage();
      
      const hitRate = stats.hits / (stats.hits + stats.misses);
      const errorRate = stats.errors / (stats.hits + stats.misses + stats.errors);
      
      let health: 'healthy' | 'warning' | 'critical' = 'healthy';
      const recommendations: string[] = [];

      // Analyze cache performance
      if (hitRate < 0.7) {
        health = 'warning';
        recommendations.push('Cache hit rate is below 70%. Consider increasing TTL or warming more caches.');
      }

      if (hitRate < 0.5) {
        health = 'critical';
        recommendations.push('Cache hit rate is critically low. Review caching strategy.');
      }

      if (errorRate > 0.05) {
        health = 'warning';
        recommendations.push('Cache error rate is above 5%. Check Redis connection and configuration.');
      }

      if (errorRate > 0.1) {
        health = 'critical';
        recommendations.push('High cache error rate. Investigate Redis issues immediately.');
      }

      if (usage && usage.totalKeys > 10000) {
        recommendations.push('High number of cache keys. Consider implementing key cleanup strategy.');
      }

      return {
        health,
        stats: {
          hitRate: Math.round(hitRate * 100),
          errorRate: Math.round(errorRate * 100),
          totalOperations: stats.hits + stats.misses + stats.errors,
          keyCount: usage?.totalKeys || 0,
          ...stats
        },
        recommendations
      };
    } catch (error) {
      console.error('Error generating cache health report:', error);
      return {
        health: 'critical',
        stats: {},
        recommendations: ['Unable to generate health report. Check Redis connection.']
      };
    }
  }

  // Monitor specific cache patterns
  static async monitorCachePattern(pattern: string): Promise<{
    keyCount: number;
    totalSize: number;
    oldestKey: string | null;
    newestKey: string | null;
  }> {
    try {
      const usage = await CacheDebug.getCacheUsage(pattern);
      
      if (!usage || !usage.keyDetails.length) {
        return {
          keyCount: 0,
          totalSize: 0,
          oldestKey: null,
          newestKey: null
        };
      }

      const sortedByTtl = usage.keyDetails.sort((a, b) => a.ttl - b.ttl);
      
      return {
        keyCount: usage.totalKeys,
        totalSize: usage.keyDetails.length, // Approximate
        oldestKey: sortedByTtl[0]?.key || null,
        newestKey: sortedByTtl[sortedByTtl.length - 1]?.key || null
      };
    } catch (error) {
      console.error('Error monitoring cache pattern:', error);
      return {
        keyCount: 0,
        totalSize: 0,
        oldestKey: null,
        newestKey: null
      };
    }
  }
}

// Cache maintenance utilities
export class CacheMaintenance {
  // Clean up expired and old cache entries
  static async performMaintenance(options: CacheManagementOptions = {}): Promise<{
    deletedKeys: number;
    freedMemory: number;
    errors: string[];
  }> {
    const result = {
      deletedKeys: 0,
      freedMemory: 0,
      errors: [] as string[]
    };

    try {
      if (options.verbose) console.log('Starting cache maintenance...');

      // Clean up old search caches (older than 1 hour)
      try {
        const searchKeys = await CacheMaintenance.getOldKeys('cache:search:*', 3600);
        if (searchKeys.length > 0) {
          const deleted = await RedisUtils.del(searchKeys);
          result.deletedKeys += deleted;
          if (options.verbose) console.log(`Cleaned up ${deleted} old search cache entries`);
        }
      } catch (error) {
        result.errors.push(`Search cache cleanup error: ${error}`);
      }

      // Clean up old product view stats (older than 24 hours)
      try {
        const statsKeys = await CacheMaintenance.getOldKeys('cache:stats:*', 86400);
        if (statsKeys.length > 0) {
          const deleted = await RedisUtils.del(statsKeys);
          result.deletedKeys += deleted;
          if (options.verbose) console.log(`Cleaned up ${deleted} old stats entries`);
        }
      } catch (error) {
        result.errors.push(`Stats cleanup error: ${error}`);
      }

      // Clean up orphaned cache tags
      try {
        const tagKeys = await CacheMaintenance.getOrphanedTagKeys();
        if (tagKeys.length > 0) {
          const deleted = await RedisUtils.del(tagKeys);
          result.deletedKeys += deleted;
          if (options.verbose) console.log(`Cleaned up ${deleted} orphaned tag keys`);
        }
      } catch (error) {
        result.errors.push(`Tag cleanup error: ${error}`);
      }

      if (options.verbose) {
        console.log(`Cache maintenance completed. Deleted ${result.deletedKeys} keys.`);
      }

    } catch (error) {
      result.errors.push(`General maintenance error: ${error}`);
    }

    return result;
  }

  // Get keys older than specified age (in seconds)
  private static async getOldKeys(pattern: string, maxAge: number): Promise<string[]> {
    try {
      const redis = await import('@/lib/redis').then(m => m.getRedisClient());
      const keys = await redis.keys(pattern);
      const oldKeys: string[] = [];

      for (const key of keys) {
        const ttl = await redis.ttl(key);
        // If TTL is less than maxAge from the original expiry, consider it old
        if (ttl > 0 && ttl < maxAge) {
          oldKeys.push(key);
        }
      }

      return oldKeys;
    } catch (error) {
      console.error('Error getting old keys:', error);
      return [];
    }
  }

  // Get orphaned cache tag keys (tags that point to non-existent cache keys)
  private static async getOrphanedTagKeys(): Promise<string[]> {
    try {
      const redis = await import('@/lib/redis').then(m => m.getRedisClient());
      const tagKeys = await redis.keys('cache:tag:*');
      const orphanedKeys: string[] = [];

      for (const tagKey of tagKeys) {
        const cacheKeys = await redis.smembers(tagKey);
        let hasValidKeys = false;

        for (const cacheKey of cacheKeys) {
          const exists = await redis.exists(cacheKey);
          if (exists) {
            hasValidKeys = true;
            break;
          }
        }

        if (!hasValidKeys && cacheKeys.length > 0) {
          orphanedKeys.push(tagKey);
        }
      }

      return orphanedKeys;
    } catch (error) {
      console.error('Error finding orphaned tag keys:', error);
      return [];
    }
  }
}

// Cache performance analyzer
export class CachePerformanceAnalyzer {
  // Analyze cache performance and suggest optimizations
  static async analyzePerformance(): Promise<{
    analysis: Record<string, unknown>;
    optimizations: string[];
  }> {
    try {
      const stats = getCacheStats();
      const usage = await CacheDebug.getCacheUsage();
      const analysis: Record<string, unknown> = {};
      const optimizations: string[] = [];

      // Analyze hit rates by cache type
      if (usage) {
        const keysByType = await this.categorizeKeys(usage.keyDetails);
        analysis['keysByType'] = keysByType;

        // Suggest optimizations based on patterns
        if (keysByType['products'] && (keysByType['products'] as { count: number }).count > 100) {
          optimizations.push('Consider increasing TTL for product caches or implementing more aggressive preloading');
        }

        if (keysByType['search'] && keysByType['search'].count > 1000) {
          optimizations.push('High number of search cache entries. Consider implementing search result aggregation');
        }

        if (usage.totalKeys > 5000) {
          optimizations.push('Consider implementing tiered caching with different TTLs based on data importance');
        }
      }

      // Analyze error patterns
      if (stats.errors > stats.hits * 0.1) {
        optimizations.push('High error rate detected. Check Redis connection stability and consider implementing circuit breaker pattern');
      }

      return { analysis, optimizations };
    } catch (error) {
      console.error('Error analyzing cache performance:', error);
      return {
        analysis: {},
        optimizations: ['Unable to analyze performance. Check cache monitoring setup.']
      };
    }
  }

  // Categorize cache keys by type for analysis
  private static async categorizeKeys(keyDetails: { key: string; ttl: number; type: string }[]): Promise<Record<string, { count: number; avgTtl: number }>> {
    const categories: Record<string, { count: number; avgTtl: number }> = {
      products: { count: 0, avgTtl: 0 },
      categories: { count: 0, avgTtl: 0 },
      banners: { count: 0, avgTtl: 0 },
      search: { count: 0, avgTtl: 0 },
      other: { count: 0, avgTtl: 0 }
    };

    keyDetails.forEach(key => {
      if (key.key.includes(':product')) {
        categories['products']!.count++;
        categories['products']!.avgTtl += key.ttl;
      } else if (key.key.includes(':categor')) {
        categories['categories']!.count++;
        categories['categories']!.avgTtl += key.ttl;
      } else if (key.key.includes(':banner')) {
        categories['banners']!.count++;
        categories['banners']!.avgTtl += key.ttl;
      } else if (key.key.includes(':search')) {
        categories['search']!.count++;
        categories['search']!.avgTtl += key.ttl;
      } else {
        categories['other']!.count++;
        categories['other']!.avgTtl += key.ttl;
      }
    });

    // Calculate averages
    Object.keys(categories).forEach(type => {
      const category = categories[type];
      if (category && category.count > 0) {
        category.avgTtl = Math.round(category.avgTtl / category.count);
      }
    });

    return categories;
  }
}

// Export convenience functions
export {
  CacheInvalidator,
  CacheWarmer,
  CacheDebug,
  getCacheStats,
  resetCacheStats
}; 