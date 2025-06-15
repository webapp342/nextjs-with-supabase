import { createBrowserClient } from '@supabase/ssr';
import { logger } from '@/utils/logger';
import type { Database } from '@/types/database';

// Enhanced Supabase client with logging
export function createClient() {
  const supabase = createBrowserClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  );

  // Create a proxy to intercept all method calls
  return new Proxy(supabase, {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver);
      
      if (prop === 'from') {
        return function(table: string) {
          const tableBuilder = original.call(target, table);
          
          // Wrap query methods with logging
          return new Proxy(tableBuilder, {
            get(tableTarget, tableProp, tableReceiver) {
              const tableOriginal = Reflect.get(tableTarget, tableProp, tableReceiver);
              
              if (typeof tableOriginal === 'function') {
                return function(...args: unknown[]) {
                  const result = tableOriginal.apply(tableTarget, args);
                  
                  // If this returns a promise (query execution), add logging
                  if (result && typeof result.then === 'function') {
                    return result.then((data: { data?: unknown[] } | unknown) => {
                      const operation = String(tableProp);
                      const count = (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) ? data.data.length : 1;
                      
                      // Log read operations
                      if (['select', 'single'].includes(operation)) {
                        logger.logSupabaseRead(table, count, {
                          operation,
                          filters: args.length > 0 ? args : undefined
                        });
                      }
                      
                      // Log write operations
                      if (['insert', 'update', 'upsert', 'delete'].includes(operation)) {
                        logger.logSupabaseWrite(
                          table,
                          operation as 'insert' | 'update' | 'delete',
                          count,
                          { data: args.length > 0 ? args : undefined }
                        );
                      }
                      
                      return data;
                    }).catch((error: Error) => {
                      logger.logError(`Supabase ${String(tableProp)} failed on ${table}`, error, {
                        table,
                        operation: String(tableProp),
                        args
                      });
                      throw error;
                    });
                  }
                  
                  return result;
                };
              }
              
              return tableOriginal;
            }
          });
        };
      }
      
      return original;
    }
  });
}

// Export typed client
export type ClientType = ReturnType<typeof createClient>; 