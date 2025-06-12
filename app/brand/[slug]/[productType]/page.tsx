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

interface ProductType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  brand_id: string;
  category_id: string;
}

export default function BrandProductTypePage() {
  const params = useParams();
  const brandSlug = params.slug as string;
  const productTypeSlug = params.productType as string;
  
  const [brand, setBrand] = useState<Brand | null>(null);
  const [productType, setProductType] = useState<ProductType | null>(null);
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

        // Fetch product type info
        const { data: productTypeData, error: productTypeError } = await supabase
          .from('product_types')
          .select('*')
          .eq('slug', productTypeSlug)
          .eq('brand_id', brandData.id)
          .eq('is_active', true)
          .single();

        if (productTypeError) throw productTypeError;
        setProductType(productTypeData);

      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (brandSlug && productTypeSlug) {
      fetchData();
    }
  }, [brandSlug, productTypeSlug, supabase]);

  useEffect(() => {
    const fetchProductCount = async () => {
      if (brand?.id && productType?.id) {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('brand_id', brand.id)
          .eq('product_type_id', productType.id)
          .eq('is_active', true);
        
        setTotalProductCount(count || 0);
      }
    };

    fetchProductCount();
  }, [brand?.id, productType?.id, supabase]);

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

  if (error || !brand || !productType) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sayfa Bulunamadı</h1>
          <p className="text-gray-600">Aradığınız ürün çeşidi mevcut değil veya kaldırılmış.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-6 px-2">
              {/* Marka + Ürün Tipi Breadcrumb - Özel format */}
        <EnhancedBreadcrumb 
          showBrandProductType={true}
          brandName={brand.name}
          brandSlug={brand.slug}
          productTypeName={productType.name}
          productTypeSlug={productType.slug}
          categoryId={productType.category_id}
        />
      
      {/* Simple Brand + Product Type Header - Like Khanoumi */}
      <div className="flex justify-end mb-6 px-0 mt-4">
        <h1 className="text-xl font-bold text-right">
          {brand.name} {productType.name} ({toPersianNumber(totalProductCount)} کالا)
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
          product_type_id: productType.id 
        }}
        showFilters={false}
        showHeader={false}
      />
    </div>
  );
}