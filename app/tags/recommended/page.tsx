'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProductList } from '@/components/product-list';
import { Button } from '@/components/ui/button';
import { Filter, ArrowUpDown } from 'lucide-react';
import { toPersianNumber } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_price?: number;
  image_urls: string[];
  brand: string;
  brand_name?: string;
  created_at: string;
}

export default function RecommendedPage() {
  const [totalProductCount, setTotalProductCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchProductCount = async () => {
      try {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('is_recommended', true)
          .eq('is_active', true);
        
        setTotalProductCount(count || 0);
      } catch (error) {
        console.error('Error fetching product count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductCount();
  }, [supabase]);

  if (loading) {
    return (
      <div className="w-full py-6 px-2">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-6 px-2">
      {/* Simple Header - RTL aligned */}
      <div className="flex items-center justify-end mb-6 px-0">
        <h1 className="text-xl font-bold text-right">
          پیشنهاد ویژه ({toPersianNumber(totalProductCount)} کالا)
        </h1>
      </div>

      {/* Sort and Filter Controls - Same as brand pages */}
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

      {/* Products List - Clean and simple using ProductList component */}
      <ProductList 
        filters={{ is_recommended: true }}
        showFilters={false}
        showHeader={false}
      />
    </div>
  );
} 