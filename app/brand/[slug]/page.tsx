'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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

interface ProductType {
  id: string;
  name: string;
  slug: string;
  product_count: number;
}

export default function BrandPage() {
  const params = useParams();
  const brandSlug = params.slug as string;
  const [brand, setBrand] = useState<Brand | null>(null);
  const [, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProductCount, setTotalProductCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const fetchBrandData = async () => {
      setLoading(true);
      try {
        // Fetch brand info
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('*')
          .eq('slug', brandSlug)
          .eq('is_active', true)
          .single();

        if (brandError) throw brandError;
        setBrand(brandData);

        // Fetch product types with product counts
        const { data: productTypesData, error: productTypesError } = await supabase
          .from('product_types')
          .select(`
            *,
            product_count:products(count)
          `)
          .eq('brand_id', brandData.id)
          .eq('is_active', true)
          .order('sort_order');

        if (productTypesError) throw productTypesError;
        
        // Transform the data to get actual counts
        const typesWithCounts = await Promise.all(
          (productTypesData || []).map(async (type: { id: string; name: string; slug: string }) => {
            const { count } = await supabase
              .from('products')
              .select('*', { count: 'exact', head: true })
              .eq('product_type_id', type.id)
              .eq('is_active', true);

            return {
              id: type.id,
              name: type.name,
              slug: type.slug,
              product_count: count || 0
            };
          })
        );

        setProductTypes(typesWithCounts);

      } catch (error: unknown) {
        console.error('Error fetching brand data:', error);
        setError(error instanceof Error ? error.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (brandSlug) {
      fetchBrandData();
    }
  }, [brandSlug, supabase]);

  useEffect(() => {
    const fetchProductCount = async () => {
      if (brand?.id) {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('brand_id', brand.id)
          .eq('is_active', true);
        
        setTotalProductCount(count || 0);
      }
    };

    fetchProductCount();
  }, [brand?.id, supabase]);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Marka Bulunamadı</h1>
          <p className="text-gray-600">Aradığınız marka mevcut değil veya kaldırılmış.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-6 px-2 ">
      {/* Simple Brand Header - RTL aligned */}
      <div className="flex items-center justify-end mb-6 px-0 ">
        <h1 className="text-xl text-right font-lalezar">
          {brand.name} ({toPersianNumber(totalProductCount)} کالا)
        </h1>
      </div>

      {/* Sort and Filter Controls - Same as main page */}
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

      {/* Products List - Clean and simple */}
      <ProductList 
        filters={{ brand_id: brand.id }}
        showFilters={false}
        showHeader={false}
      />
    </div>
  );
} 