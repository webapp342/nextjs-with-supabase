import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CacheUtils } from '@/utils/cache';
import type { 
  HeroBanner, 
  GridBanner, 
  PositionedBanner, 
  Category, 
  ProductWithRelations 
} from '@/types/database';

interface TopBrand {
  id: string;
  title: string;
  image_url: string;
  sort_order: number;
  brand?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface QuickAccessButton {
  id: string;
  title: string;
  link_url: string;
  link_type: string;
  sort_order: number;
  link_category_id?: string;
  link_brand_id?: string;
  link_tag?: string;
}

interface SecondaryHeroBanner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  mobile_image_url?: string;
  link_url: string;
  link_text?: string;
  background_color: string;
  text_color: string;
  button_color: string;
  sort_order: number;
  start_date?: string;
  end_date?: string;
  link_type: string;
  link_category_id?: string;
  link_brand_id?: string;
  link_tag?: string;
}

interface HomepageContent {
  heroBanners: HeroBanner[];
  secondaryHeroBanners: SecondaryHeroBanner[];
  positionedBanners: {
    home_middle_1: PositionedBanner[];
    home_middle_2: PositionedBanner[];
    home_special: PositionedBanner[];
    home_bottom_1: PositionedBanner[];
    home_bottom_2: PositionedBanner[];
  };
  gridBanners: GridBanner[];
  quickAccessButtons: QuickAccessButton[];
  featuredProducts: ProductWithRelations[];
  bestsellerProducts: ProductWithRelations[];
  newProducts: ProductWithRelations[];
  recommendedProducts: ProductWithRelations[];
  topBrands: TopBrand[];
  categories: Category[];
}

export async function GET() {
  try {
    // Get homepage content from cache or fetch from database
    const homepageContent = await CacheUtils.getHomepageContent(
      async (): Promise<HomepageContent> => {
        const supabase = await createClient();

        // Fetch all homepage data in parallel to minimize database reads
        const [
          heroBannersResult,
          secondaryHeroBannersResult,
          positionedBannersResult,
          gridBannersResult,
          quickAccessButtonsResult,
          featuredProductsResult,
          bestsellerProductsResult,
          newProductsResult,
          recommendedProductsResult,
          topBrandsResult,
          categoriesResult,
        ] = await Promise.allSettled([
          // Hero banners
          supabase
            .from('hero_banners')
            .select(`
              id, title, subtitle, description, image_url, mobile_image_url,
              link_url, link_text, background_color, text_color, button_color,
              sort_order, start_date, end_date, link_type, 
              link_category_id, link_brand_id
            `)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .limit(5),

          // Secondary hero banners
          supabase
            .from('secondary_hero_banners')
            .select(`
              id, title, subtitle, description, image_url, mobile_image_url,
              link_url, link_text, background_color, text_color, button_color,
              sort_order, start_date, end_date, link_type,
              link_category_id, link_brand_id, link_tag
            `)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .limit(3),

          // Positioned banners
          supabase
            .from('positioned_banners')
            .select(`
              id, title, subtitle, description, image_url, mobile_image_url,
              link_url, link_text, background_color, text_color, button_color,
              position, sort_order, start_date, end_date, link_type,
              link_category_id, link_brand_id, link_tag
            `)
            .eq('is_active', true)
            .in('position', ['home_middle_1', 'home_middle_2', 'home_special', 'home_bottom_1', 'home_bottom_2'])
            .order('position')
            .order('sort_order', { ascending: true }),

          // Grid banners
          supabase
            .from('grid_banners')
            .select(`
              id, title, image_url, mobile_image_url, sort_order,
              link_type, link_category_id, link_brand_id, link_tag, link_url
            `)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .limit(6),

          // Quick access buttons
          supabase
            .from('quick_access_buttons')
            .select(`
              id, title, link_url, link_type, sort_order,
              link_category_id, link_brand_id, link_tag
            `)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .limit(8),

          // Featured products
          supabase
            .from('products')
            .select(`
              id, name, short_description, price, compare_price, image_urls,
              category_id, brand_id, created_at,
              category:categories_new(id, name, slug),
              brand:brands(id, name, slug)
            `)
            .eq('is_active', true)
            .eq('is_featured', true)
            .order('created_at', { ascending: false })
            .limit(12),

          // Bestseller products
          supabase
            .from('products')
            .select(`
              id, name, short_description, price, compare_price, image_urls,
              category_id, brand_id, sales_count,
              category:categories_new(id, name, slug),
              brand:brands(id, name, slug)
            `)
            .eq('is_active', true)
            .eq('is_bestseller', true)
            .order('sales_count', { ascending: false })
            .limit(12),

          // New products
          supabase
            .from('products')
            .select(`
              id, name, short_description, price, compare_price, image_urls,
              category_id, brand_id, created_at,
              category:categories_new(id, name, slug),
              brand:brands(id, name, slug)
            `)
            .eq('is_active', true)
            .eq('is_new', true)
            .order('created_at', { ascending: false })
            .limit(12),

          // Recommended products
          supabase
            .from('products')
            .select(`
              id, name, short_description, price, compare_price, image_urls,
              category_id, brand_id, created_at,
              category:categories_new(id, name, slug),
              brand:brands(id, name, slug)
            `)
            .eq('is_active', true)
            .eq('is_recommended', true)
            .order('created_at', { ascending: false })
            .limit(12),

          // Top brands
          supabase
            .from('top_brands')
            .select(`
              id, title, image_url, sort_order,
              brand:brands(id, name, slug)
            `)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .limit(12),

          // Categories (top level)
          supabase
            .from('categories_new')
            .select(`
              id, name, slug, description, icon, image_url, sort_order
            `)
            .eq('is_active', true)
            .is('parent_id', null)
            .order('sort_order', { ascending: true })
            .limit(8),
        ]);

        // Process results and handle errors gracefully
        const getDataOrEmpty = (result: PromiseSettledResult<{ data: unknown; error?: unknown }>): unknown[] => {
          if (result.status === 'fulfilled' && result.value.data) {
            const data = result.value.data;
            return Array.isArray(data) ? data : [data];
          }
          console.error('Homepage data fetch error:', result.status === 'rejected' ? result.reason : result.value?.error);
          return [];
        };

        // Group positioned banners by position
        const positionedBannersData = getDataOrEmpty(positionedBannersResult) as PositionedBanner[];
        const positionedBanners = {
          home_middle_1: positionedBannersData.filter((b) => b.position === 'home_middle_1'),
          home_middle_2: positionedBannersData.filter((b) => b.position === 'home_middle_2'),
          home_special: positionedBannersData.filter((b) => b.position === 'home_special'),
          home_bottom_1: positionedBannersData.filter((b) => b.position === 'home_bottom_1'),
          home_bottom_2: positionedBannersData.filter((b) => b.position === 'home_bottom_2'),
        };

        return {
          heroBanners: getDataOrEmpty(heroBannersResult) as HeroBanner[],
          secondaryHeroBanners: getDataOrEmpty(secondaryHeroBannersResult) as SecondaryHeroBanner[],
          positionedBanners,
          gridBanners: getDataOrEmpty(gridBannersResult) as GridBanner[],
          quickAccessButtons: getDataOrEmpty(quickAccessButtonsResult) as QuickAccessButton[],
          featuredProducts: getDataOrEmpty(featuredProductsResult) as ProductWithRelations[],
          bestsellerProducts: getDataOrEmpty(bestsellerProductsResult) as ProductWithRelations[],
          newProducts: getDataOrEmpty(newProductsResult) as ProductWithRelations[],
          recommendedProducts: getDataOrEmpty(recommendedProductsResult) as ProductWithRelations[],
          topBrands: getDataOrEmpty(topBrandsResult) as TopBrand[],
          categories: getDataOrEmpty(categoriesResult) as Category[],
        };
      }
    );

    return NextResponse.json(homepageContent, {
      headers: {
        'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=300',
        'CDN-Cache-Control': 'public, s-maxage=300',
      },
    });

  } catch (error) {
    console.error('Homepage API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage content' },
      { status: 500 }
    );
  }
}

// Note: getHomepageSection moved to utils/homepage-helpers.ts
// to comply with Next.js 15 App Router export restrictions 