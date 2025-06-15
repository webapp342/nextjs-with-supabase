import { createClient } from '@/lib/supabase/server';
import { CacheUtils } from '@/utils/cache';
import { CacheKeys } from '@/lib/redis';

// GET specific homepage sections
export async function getHomepageSection(section: string) {
  const supabase = await createClient();

  switch (section) {
    case 'hero-banners':
      return CacheUtils.getBanners('hero', async () => {
        const { data, error } = await supabase
          .from('hero_banners')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        
        if (error) throw error;
        return data;
      });

    case 'featured-products':
      return CacheUtils.getProducts(
        CacheKeys.featuredProducts(),
        async () => {
          const { data, error } = await supabase
            .from('products')
            .select(`
              id, name, short_description, price, compare_price, image_urls,
              category:categories_new(id, name, slug),
              brand:brands(id, name, slug)
            `)
            .eq('is_active', true)
            .eq('is_featured', true)
            .order('created_at', { ascending: false })
            .limit(12);
          
          if (error) throw error;
          return data;
        },
        ['products', 'featured']
      );

    case 'categories':
      return CacheUtils.getCategories(async () => {
        const { data, error } = await supabase
          .from('categories_new')
          .select('id, name, slug, description, icon, image_url')
          .eq('is_active', true)
          .is('parent_id', null)
          .order('sort_order', { ascending: true });
        
        if (error) throw error;
        return data;
      });

    default:
      throw new Error(`Unknown homepage section: ${section}`);
  }
} 