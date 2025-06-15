import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CacheUtils } from '@/utils/cache';
import { CacheKeys } from '@/lib/redis';
import { ProductList } from '@/components/product-list';
import { Button } from '@/components/ui/button';
import { Filter, ArrowUpDown } from 'lucide-react';
import { toPersianNumber } from '@/lib/utils';

interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
}

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const cacheKey = CacheKeys.brandBySlug(slug);
  
  return CacheUtils.getBrand(cacheKey, async () => {
    const supabase = await createClient();
    
    const { data: brandData, error } = await supabase
      .from('brands')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !brandData) {
      return null;
    }

    return brandData as Brand;
  });
}

async function getBrandProductCount(brandId: string): Promise<number> {
  const cacheKey = `brand:${brandId}:product_count`;
  
  return CacheUtils.getProducts(cacheKey, async () => {
    const supabase = await createClient();
    
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('is_active', true);
    
    return count || 0;
  });
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  
  // Fetch brand data with Redis caching
  const brand = await getBrandBySlug(slug);
  
  if (!brand) {
    notFound();
  }

  // Fetch product count with caching
  const totalProductCount = await getBrandProductCount(brand.id);

  return (
    <div className="w-full py-6 px-2">
      {/* Brand Header - RTL aligned */}
      <div className="flex items-center justify-end mb-6 px-0">
        <h1 className="text-xl text-right font-lalezar">
          {brand.name} ({toPersianNumber(totalProductCount)} کالا)
        </h1>
      </div>

      {/* Brand Description */}
      {brand.description && (
        <div className="px-4 py-4 mb-6">
          <p className="text-gray-600 text-right">{brand.description}</p>
        </div>
      )}

      {/* Sort and Filter Controls */}
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="text-sm"
          >
            <ArrowUpDown className="w-4 h-4 mr-2" />
            مرتب سازی
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="text-sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            فیلترها
          </Button>
        </div>
      </div>

      {/* Products List */}
      <ProductList 
        filters={{ brand_id: brand.id }}
        showFilters={false}
        showHeader={false}
      />
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  
  if (!brand) {
    return {
      title: 'Brand Not Found',
    };
  }

  return {
    title: `${brand.name} - فروشگاه`,
    description: brand.description || `Browse ${brand.name} products`,
  };
} 