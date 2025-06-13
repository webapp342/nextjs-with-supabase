'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import { toPersianNumber } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_price?: number;
  image_urls: string[];
  brand: string;
  created_at: string;
}

export default function BestsellerPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchBestsellerProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_bestseller', true)
        .eq('is_active', true)
        .order('sales_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bestseller products:', error);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    };

    fetchBestsellerProducts();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                <ArrowRight className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold">🔥 پرفروش‌ترین محصولات</h1>
            </div>
          </div>
        </div>

        {/* Loading */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="bg-gray-200 rounded h-48 mb-4"></div>
                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">🔥 پرفروش‌ترین محصولات</h1>
              <p className="text-gray-600 mt-1">{toPersianNumber(products.length)} محصول یافت شد</p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔥</div>
            <h2 className="text-xl font-semibold mb-2">هنوز محصول پرفروشی وجود ندارد</h2>
            <p className="text-gray-600">به زودی محصولات پرفروش اینجا نمایش داده خواهند شد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => {
              const hasDiscount = product.compare_price && product.compare_price > product.price;
              const discountPercentage = hasDiscount 
                ? Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)
                : 0;

              return (
                <Link 
                  key={product.id} 
                  href={`/product-details?id=${product.id}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border"
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
                    
                    {/* Bestseller Badge */}
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded font-bold">
                      🔥 پرفروش
                    </div>

                    {/* Discount Badge */}
                    {hasDiscount && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded font-bold">
                        {toPersianNumber(discountPercentage)}%
                      </div>
                    )}
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
                      <div className="pt-2">
                        <div className="flex items-center justify-between">
                          {/* Original Price */}
                          <div className="text-xs text-gray-400 line-through">
                            <span className="font-sans">{toPersianNumber(product.compare_price!.toLocaleString())}</span>
                          </div>
                          {/* Sale Price */}
                          <div className="text-sm font-bold">
                            <span className="font-sans">؋ {toPersianNumber(product.price.toLocaleString())}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2">
                        <div className="text-sm font-bold text-right">
                          <span className="font-sans">؋ {toPersianNumber(product.price.toLocaleString())}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 