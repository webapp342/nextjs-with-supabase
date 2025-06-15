'use client';

import { useEffect } from 'react';
import { logger } from '@/utils/logger';

export default function StartupLogger(): null {
  useEffect(() => {
    const logStartupInfo = () => {
      console.log('🚀 Application Starting...');
      console.log('Environment Variables Check:');
      console.log({
        nextPublicSupabaseUrl: !!process.env['NEXT_PUBLIC_SUPABASE_URL'],
        nextPublicSupabaseAnonKey: !!process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
        nodeEnv: process.env.NODE_ENV,
      });
    };

    logStartupInfo();
    
    // Log application startup
    logger.logStartup();
    
    // Log environment configuration
    const config = {
      nodeEnv: process.env.NODE_ENV,
      nextPublicSupabaseUrl: !!process.env['NEXT_PUBLIC_SUPABASE_URL'],
      nextPublicSupabaseAnonKey: !!process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
      buildTime: new Date().toISOString(),
    };
    
    logger.logInfo('Application Configuration', config);
    
    // Log browser capabilities
    const capabilities = {
      webpSupport: 'unknown', // Will be determined later
      localStorage: typeof Storage !== 'undefined',
      sessionStorage: typeof Storage !== 'undefined',
      serviceWorker: 'serviceWorker' in navigator,
      intersectionObserver: 'IntersectionObserver' in window,
      performanceObserver: 'PerformanceObserver' in window,
    };
    
    logger.logInfo('Browser Capabilities', capabilities);
    
    // Set up periodic cache stats logging in development
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        const cacheStats = logger.getCacheStats();
        const supabaseStats = logger.getSupabaseStats();
        
        if (cacheStats.hits > 0 || cacheStats.misses > 0 || supabaseStats.totalOperations > 0) {
          logger.logInfo('Performance Stats', {
            cache: cacheStats,
            supabase: supabaseStats,
            timestamp: new Date().toISOString(),
          });
        }
      }, 30000); // Log every 30 seconds
      
      // Cleanup interval
      return () => clearInterval(interval);
    }
    
    // Return undefined for cases where we don't set up an interval
    return undefined;
  }, []);

  return null;
} 