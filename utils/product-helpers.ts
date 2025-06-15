import { createClient } from '@/lib/supabase/server';
import { CacheUtils } from '@/utils/cache';
import { CacheKeys } from '@/lib/redis';

// Specialized endpoints for common queries
export async function getSpecialProducts(type: 'featured' | 'bestseller' | 'new' | 'recommended') {
  const cacheKey = type === 'featured' ? CacheKeys.featuredProducts() :
                   type === 'bestseller' ? CacheKeys.bestsellerProducts() :
                   type === 'new' ? CacheKeys.newProducts() :
                   CacheKeys.recommendedProducts();

  return CacheUtils.getProducts(
    cacheKey,
    async () => {
      const supabase = await createClient();
      
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          short_description,
          price,
          compare_price,
          image_urls,
          category_id,
          brand_id,
          created_at,
          category:categories_new(id, name, slug),
          brand:brands(id, name, slug)
        `)
        .eq('is_active', true)
        .eq(`is_${type}`, true)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) {
        console.error(`Error fetching ${type} products:`, error);
        throw new Error(`Failed to fetch ${type} products`);
      }

      return products || [];
    },
    [`products`, `products:${type}`]
  );
} 