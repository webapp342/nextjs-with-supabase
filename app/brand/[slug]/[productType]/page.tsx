'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ProductList } from '@/components/product-list';
import { Button } from '@/components/ui/button';
import { Filter, ArrowUpDown } from 'lucide-react';
import { toPersianNumber } from '@/lib/utils';
import { EnhancedBreadcrumb } from '@/components/enhanced-breadcrumb';

interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  level: number;
}

export default function BrandCategoryPage() {
  const params = useParams();
  const brandSlug = params.slug as string;
  const categorySlug = params.productType as string;
  
  const [brand, setBrand] = useState<Brand | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProductCount, setTotalProductCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
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

        // Fetch category info
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories_new')
          .select('*')
          .eq('slug', categorySlug)
          .eq('is_active', true)
          .single();

        if (categoryError) throw categoryError;
        setCategory(categoryData);

      } catch (error: unknown) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (brandSlug && categorySlug) {
      fetchData();
    }
  }, [brandSlug, categorySlug, supabase]);

  useEffect(() => {
    const fetchProductCount = async () => {
      if (brand?.id && category?.id) {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('brand_id', brand.id)
          .eq('category_id', category.id)
          .eq('is_active', true);
        
        setTotalProductCount(count || 0);
      }
    };

    fetchProductCount();
  }, [brand?.id, category?.id, supabase]);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !brand || !category) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sayfa Bulunamadı</h1>
          <p className="text-gray-600">Aradığınız kategori mevcut değil veya kaldırılmış.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-6 px-2">
      {/* Normal breadcrumb - artık doğru çalışacak */}
      <EnhancedBreadcrumb />
      
      {/* Simple Brand + Category Header - Like Khanoumi */}
      <div className="flex justify-end mb-6 px-0 mt-4">
        <h1 className="text-xl text-right font-lalezar">
        {category.name} {brand.name}  ({toPersianNumber(totalProductCount)} کالا)
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
        filters={{ 
          brand_id: brand.id,
          category_id: category.id 
        }}
        showFilters={false}
        showHeader={false}
      />
    </div>
  );
}