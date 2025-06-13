'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import { toPersianNumber } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_price?: number;
  image_urls: string[];
  brand: string;
}

export function RecommendedSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchRecommendedProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_recommended', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching recommended products:', error);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    };

    fetchRecommendedProducts();
  }, [supabase]);

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-6 px-4">
          <Link href="/tags/recommended" className="text-pink-500 text-sm">
            مشاهده همه
          </Link>
          <h2 className="text-xl font-bold text-right">پیشنهاد ویژه</h2>
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
                  <Link href="/tags/recommended" className="text-pink-500 text-sm hover:text-pink-600">
          مشاهده همه
        </Link>
        <h2 className="text-xl font-bold text-right">پیشنهاد ویژه</h2>
      </div>

      {/* Horizontal Scroll Products */}
      <div className="flex gap-4 px-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        
        {products.map((product) => {
          const hasDiscount = product.compare_price && product.compare_price > product.price;
          const discountPercentage = hasDiscount 
            ? Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)
            : 0;

          return (
            <Link 
              key={product.id} 
              href={`/product-details?id=${product.id}`}
              className="min-w-[200px] max-w-[200px] bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border"
            >
              {/* Product Image */}
              <div className="relative w-full h-48 bg-gray-50">
                {product.image_urls && product.image_urls.length > 0 ? (
                  <Image 
                    src={product.image_urls[0]} 
                    alt={product.name} 
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-xs">تصویر موجود نیست</span>
                  </div>
                )}
                
                {/* Recommended Badge */}
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded font-bold">
                  پیشنهاد ویژه
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4 space-y-2">
                {/* Brand */}
                <div className="text-xs text-gray-500 text-right">
                  {product.brand}
                </div>

                {/* Product Name */}
                <h3 className="font-medium text-sm text-right leading-tight line-clamp-2 min-h-[2.5rem]">
                  {product.name}
                </h3>

                {/* Price Section */}
                {hasDiscount ? (
                  <div className="pt-4">
                    <div className="flex items-center gap-3">
                      {/* Discount Badge */}
                      <div className="bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">
                        {toPersianNumber(discountPercentage)}%
                      </div>
                      
                      {/* Price Stack */}
                      <div className="flex flex-col">
                        {/* Original Price */}
                        <div className="text-xs text-gray-400 line-through">
                          <span className="font-sans text-left">{toPersianNumber(product.compare_price!.toLocaleString())}</span>
                        </div>
                        {/* Sale Price */}
                        <div className="text-sm font-bold">
                          <span className="font-sans text-left">؋ {toPersianNumber(product.price.toLocaleString())}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4">
                    <div className="flex items-end min-h-[44px]">
                      <div className="text-sm font-bold">
                        <span className="font-sans text-left">؋ {toPersianNumber(product.price.toLocaleString())}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
} 