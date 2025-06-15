// Color codes for console logging
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
} as const;

interface LogLevel {
  CACHE_HIT: 'CACHE_HIT';
  CACHE_MISS: 'CACHE_MISS';
  CACHE_SET: 'CACHE_SET';
  CACHE_DELETE: 'CACHE_DELETE';
  SUPABASE_READ: 'SUPABASE_READ';
  SUPABASE_WRITE: 'SUPABASE_WRITE';
  IMAGE_OPTIMIZED: 'IMAGE_OPTIMIZED';
  IMAGE_SERVED: 'IMAGE_SERVED';
  API_REQUEST: 'API_REQUEST';
  ERROR: 'ERROR';
  INFO: 'INFO';
  DEBUG: 'DEBUG';
}

const LOG_LEVELS: LogLevel = {
  CACHE_HIT: 'CACHE_HIT',
  CACHE_MISS: 'CACHE_MISS',
  CACHE_SET: 'CACHE_SET',
  CACHE_DELETE: 'CACHE_DELETE',
  SUPABASE_READ: 'SUPABASE_READ',
  SUPABASE_WRITE: 'SUPABASE_WRITE',
  IMAGE_OPTIMIZED: 'IMAGE_OPTIMIZED',
  IMAGE_SERVED: 'IMAGE_SERVED',
  API_REQUEST: 'API_REQUEST',
  ERROR: 'ERROR',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

type LogLevelKey = keyof LogLevel;

interface LogEntry {
  timestamp: string;
  level: LogLevelKey;
  message: string;
  metadata: Record<string, unknown>;
  duration: number | null;
}

// Performance tracking
const performanceTracker = new Map<string, number>();

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private isDevelopment = process.env.NODE_ENV === 'development';
  private enableBrowserLogs = typeof window !== 'undefined';

  private constructor() {
    // Initialize performance tracking on browser side
    if (this.enableBrowserLogs) {
      this.initializeBrowserLogging();
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private initializeBrowserLogging(): void {
    // Add browser-specific logging enhancements
    if (typeof window !== 'undefined') {
      // Track page load performance
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.logInfo('Page Load Complete', {
            loadTime: Math.round(navigation.loadEventEnd - navigation.fetchStart),
            domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
            firstPaint: this.getFirstPaint(),
          });
        }
      });
    }
  }

  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? Math.round(firstPaint.startTime) : 0;
  }

  private formatMessage(level: LogLevelKey, message: string, metadata?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaStr = metadata ? ` | ${JSON.stringify(metadata)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  private getColorForLevel(level: LogLevelKey): string {
    switch (level) {
      case 'CACHE_HIT':
        return colors.green;
      case 'CACHE_MISS':
        return colors.yellow;
      case 'CACHE_SET':
        return colors.blue;
      case 'CACHE_DELETE':
        return colors.magenta;
      case 'SUPABASE_READ':
        return colors.cyan;
      case 'SUPABASE_WRITE':
        return colors.blue;
      case 'IMAGE_OPTIMIZED':
        return colors.green;
      case 'IMAGE_SERVED':
        return colors.cyan;
      case 'API_REQUEST':
        return colors.white;
      case 'ERROR':
        return colors.red;
      case 'INFO':
        return colors.blue;
      case 'DEBUG':
        return colors.dim;
      default:
        return colors.white;
    }
  }

  private log(level: LogLevelKey, message: string, metadata?: Record<string, unknown>, duration?: number): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata: metadata || {},
      duration: duration ?? null,
    };

    this.logs.push(logEntry);

    if (this.isDevelopment) {
      const color = this.getColorForLevel(level);
      const formattedMessage = this.formatMessage(level, message, metadata);
      const durationStr = duration ? ` (${duration}ms)` : '';
      
      console.log(`${color}${formattedMessage}${durationStr}${colors.reset}`);
      
      // Browser-specific styling
      if (this.enableBrowserLogs) {
        const style = this.getBrowserStyle(level);
        console.log(`%c[${level}] ${message}${durationStr}`, style, metadata || '');
      }
    }
  }

  private getBrowserStyle(level: LogLevelKey): string {
    const baseStyle = 'padding: 2px 6px; border-radius: 3px; font-weight: bold;';
    switch (level) {
      case 'CACHE_HIT':
        return `${baseStyle} background: #10b981; color: white;`;
      case 'CACHE_MISS':
        return `${baseStyle} background: #f59e0b; color: white;`;
      case 'CACHE_SET':
        return `${baseStyle} background: #3b82f6; color: white;`;
      case 'SUPABASE_READ':
        return `${baseStyle} background: #06b6d4; color: white;`;
      case 'SUPABASE_WRITE':
        return `${baseStyle} background: #8b5cf6; color: white;`;
      case 'ERROR':
        return `${baseStyle} background: #ef4444; color: white;`;
      case 'IMAGE_OPTIMIZED':
        return `${baseStyle} background: #22c55e; color: white;`;
      default:
        return `${baseStyle} background: #6b7280; color: white;`;
    }
  }

  // Cache logging methods
  public logCacheHit(key: string, metadata?: Record<string, unknown>): void {
    this.log('CACHE_HIT', `Cache hit for key: ${key}`, metadata);
  }

  public logCacheMiss(key: string, metadata?: Record<string, unknown>): void {
    this.log('CACHE_MISS', `Cache miss for key: ${key}`, metadata);
  }

  public logCacheSet(key: string, ttl: number, metadata?: Record<string, unknown>): void {
    this.log('CACHE_SET', `Cache set for key: ${key} (TTL: ${ttl}s)`, metadata);
  }

  public logCacheDelete(key: string, metadata?: Record<string, unknown>): void {
    this.log('CACHE_DELETE', `Cache delete for key: ${key}`, metadata);
  }

  // Supabase logging methods
  public logSupabaseRead(table: string, count: number, metadata?: Record<string, unknown>): void {
    this.log('SUPABASE_READ', `Supabase read from ${table} (${count} rows)`, metadata);
  }

  public logSupabaseWrite(table: string, operation: 'insert' | 'update' | 'delete', count: number, metadata?: Record<string, unknown>): void {
    this.log('SUPABASE_WRITE', `Supabase ${operation} on ${table} (${count} rows)`, metadata);
  }

  // Image logging methods
  public logImageOptimized(originalUrl: string, variants: number, metadata?: Record<string, unknown>): void {
    this.log('IMAGE_OPTIMIZED', `Image optimized: ${originalUrl} (${variants} variants)`, metadata);
  }

  public logImageServed(url: string, fromCache: boolean, metadata?: Record<string, unknown>): void {
    this.log('IMAGE_SERVED', `Image served: ${url} (${fromCache ? 'cached' : 'fresh'})`, metadata);
  }

  // General logging methods
  public logApiRequest(method: string, path: string, metadata?: Record<string, unknown>): void {
    this.log('API_REQUEST', `${method} ${path}`, metadata);
  }

  public logError(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    const errorMetadata = error ? { ...metadata, error: error.message, stack: error.stack } : metadata;
    this.log('ERROR', message, errorMetadata);
  }

  public logInfo(message: string, metadata?: Record<string, unknown>): void {
    this.log('INFO', message, metadata);
  }

  public logDebug(message: string, metadata?: Record<string, unknown>): void {
    this.log('DEBUG', message, metadata);
  }

  // Performance tracking methods
  public startTimer(key: string): void {
    performanceTracker.set(key, Date.now());
  }

  public endTimer(key: string, level: LogLevelKey = 'DEBUG', message?: string): number | null {
    const startTime = performanceTracker.get(key);
    if (startTime) {
      const duration = Date.now() - startTime;
      performanceTracker.delete(key);
      
      if (message) {
        this.log(level, message, undefined, duration);
      }
      
      return duration;
    }
    return null;
  }

  // Analytics methods
  public getLogStats(): Record<LogLevelKey, number> {
    const stats: Record<string, number> = {};
    
    Object.values(LOG_LEVELS).forEach(level => {
      stats[level] = this.logs.filter(log => log.level === level).length;
    });
    
    return stats as Record<LogLevelKey, number>;
  }

  public getCacheStats(): { hits: number; misses: number; hitRate: number } {
    const hits = this.logs.filter(log => log.level === 'CACHE_HIT').length;
    const misses = this.logs.filter(log => log.level === 'CACHE_MISS').length;
    const total = hits + misses;
    const hitRate = total > 0 ? Math.round((hits / total) * 100) : 0;
    
    return { hits, misses, hitRate };
  }

  public getSupabaseStats(): { reads: number; writes: number; totalOperations: number } {
    const reads = this.logs.filter(log => log.level === 'SUPABASE_READ').length;
    const writes = this.logs.filter(log => log.level === 'SUPABASE_WRITE').length;
    
    return { reads, writes, totalOperations: reads + writes };
  }

  // Export logs for analysis
  public exportLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  // Application startup logging
  public logStartup(): void {
    const env = process.env.NODE_ENV || 'development';
    const isDev = env === 'development';
    
    console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}  🚀 E-commerce App Starting Up${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
    console.log(`${colors.cyan}Environment: ${colors.bright}${env}${colors.reset}`);
    console.log(`${colors.cyan}Development Mode: ${colors.bright}${isDev}${colors.reset}`);
    console.log(`${colors.cyan}Cache Enabled: ${colors.bright}${process.env['REDIS_URL'] ? 'Yes' : 'No'}${colors.reset}`);
    console.log(`${colors.cyan}Image Optimization: ${colors.bright}Yes${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
    console.log(`${colors.green}📊 Monitoring:${colors.reset}`);
    console.log(`${colors.green}  • Cache hits/misses${colors.reset}`);
    console.log(`${colors.green}  • Supabase operations${colors.reset}`);
    console.log(`${colors.green}  • Image optimization${colors.reset}`);
    console.log(`${colors.green}  • API performance${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Browser-side performance monitoring
if (typeof window !== 'undefined') {
  // Track cache performance in browser
  (window as Window & { __ecommerce_logger?: Logger }).__ecommerce_logger = logger;
  
  // Add performance observer for Core Web Vitals
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'largest-contentful-paint') {
          const lcpEntry = entry as PerformanceEntry & { element?: { tagName: string } };
          logger.logInfo('Largest Contentful Paint', { 
            value: Math.round(entry.startTime),
            element: lcpEntry.element?.tagName 
          });
        }
        if (entry.entryType === 'first-input') {
          const fidEntry = entry as PerformanceEntry & { processingStart: number };
          logger.logInfo('First Input Delay', { 
            value: Math.round(fidEntry.processingStart - entry.startTime) 
          });
        }
        if (entry.entryType === 'layout-shift') {
          const clsEntry = entry as PerformanceEntry & { value: number };
          logger.logInfo('Cumulative Layout Shift', { 
            value: clsEntry.value 
          });
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch {
      // Ignore if some entry types are not supported
    }
  }
} 