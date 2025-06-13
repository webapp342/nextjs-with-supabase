'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ProductCard } from '@/components/product-card';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_price?: number;
  image_urls: string[];
  brand: string;
  brand_name?: string;
  sales_count: number;
}

export function BestsellersSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchBestsellerProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          compare_price,
          image_urls,
          brand,
          brand_id,
          sales_count
        `)
        .eq('is_bestseller', true)
        .eq('is_active', true)
        .order('sales_count', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching bestsellers:', error);
        setLoading(false);
        return;
      }

      // Brand bilgilerini ayrı olarak getir
      const productsWithBrands = await Promise.all(
        (data || []).map(async (product) => {
          if (product.brand_id) {
            const { data: brandData } = await supabase
              .from('brands')
              .select('name')
              .eq('id', product.brand_id)
              .single();
            
            return {
              ...product,
              brand_name: brandData?.name || product.brand
            };
          }
          return {
            ...product,
            brand_name: product.brand
          };
        })
      );

      setProducts(productsWithBrands || []);
      setLoading(false);
    };

    fetchBestsellerProducts();
  }, [supabase]);

  if (loading) {
    return (
      <div className="py-8 bg-white">
        <div className="flex items-center justify-between mb-6 px-4">
        <Link href="/bestsellers" className="text-pink-500 text-sm">
            مشاهده همه
          </Link>
          <h2 className="text-xl font-bold text-right">پرفروش‌ترین‌ها</h2>
        </div>
        <div className="flex gap-4 px-4 overflow-x-auto">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="min-w-[200px] bg-white rounded-lg p-4 animate-pulse">
              <div className="bg-gray-200 rounded h-48 mb-4"></div>
              <div className="bg-gray-200 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="py-8 bg-white">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 px-4">
        <Link href="/tags/bestseller" className="text-pink-500 text-sm hover:text-pink-600">
          مشاهده همه
        </Link>
        <h2 className="text-xl font-bold text-right">پرفروش‌ترین‌ها</h2>
      </div>

      {/* Horizontal Scroll Products */}
      <div className="flex gap-4 px-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        {products.map((product) => (
          <ProductCard
              key={product.id} 
            product={product}
            showBadges={false}
            size="md"
            className="min-w-[200px] max-w-[200px]"
          />
        ))}
      </div>
    </div>
  );
} 