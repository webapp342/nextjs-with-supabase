'use client';

import { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toPersianNumber } from '@/lib/utils';
import { Breadcrumb } from '@/components/breadcrumb';

import { useSearchParams } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_urls: string[];
  brand: string;
  user_id: string;
}

function ProductDetailsContent() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');
  const supabase = createClient();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError('Product ID is missing.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setProduct(data as Product);
      setLoading(false);
    };

    fetchProduct();
  }, [productId, supabase]);

  if (loading) {
    return <p>Ürün detayları yükleniyor...</p>;
  }

  if (error) {
    return <p>Ürün detayları yüklenirken hata oluştu: {error}</p>;
  }

  if (!product) {
    return <p>Ürün bulunamadı.</p>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <Breadcrumb />
      
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative w-full h-96 bg-gray-50 rounded-lg overflow-hidden">
            {product.image_urls && product.image_urls.length > 0 ? (
              <Image 
                src={product.image_urls[0]} 
                alt={product.name} 
                fill
                className="object-cover" 
                unoptimized 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span>تصویر موجود نیست</span>
              </div>
            )}
          </div>
          
          {/* Thumbnail Images */}
          {product.image_urls && product.image_urls.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.image_urls.slice(1, 5).map((url, index) => (
                <div key={index} className="relative w-full h-20 bg-gray-50 rounded-md overflow-hidden">
                  <Image 
                    src={url} 
                    alt={`${product.name} - ${index + 2}`} 
                    fill
                    className="object-cover cursor-pointer hover:opacity-80" 
                    unoptimized 
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Brand */}
          <div className="text-sm text-gray-600 text-right">
            {product.brand}
          </div>

          {/* Product Name */}
          <h1 className="text-2xl font-bold text-right leading-tight">
            {product.name}
          </h1>

          {/* Price */}
          <div className="space-y-2">
            <div className="text-2xl font-bold text-right">
              تومان {toPersianNumber(product.price.toLocaleString())}
            </div>
            {/* Add compare price if available */}
            <div className="text-sm text-gray-500 text-right">
              شامل مالیات بر ارزش افزوده
            </div>
          </div>

          {/* Color Selection (Demo) */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-right">رنگ:</h3>
            <div className="flex flex-wrap gap-2 justify-end">
              {['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'].map((color, index) => (
                <button
                  key={index}
                  className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-500"
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-right">تعداد:</h3>
            <div className="flex items-center justify-end gap-3">
              <button className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50">
                +
              </button>
              <span className="text-lg font-medium">۱</span>
              <button className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50">
                -
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button className="w-full bg-pink-500 text-white py-3 rounded-lg font-medium hover:bg-pink-600 transition-colors">
            افزودن به سبد خرید
          </button>

          {/* Product Features */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-medium text-right">ویژگی‌های محصول</h3>
            <ul className="space-y-2 text-sm text-gray-600 text-right">
              <li>• مناسب برای انواع پوست</li>
              <li>• ماندگاری بالا</li>
              <li>• ضد آب</li>
              <li>• حاوی ویتامین E</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Product Description */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4 text-right">توضیحات محصول</h2>
        <div className="bg-gray-50 rounded-lg p-6">
          <p className="text-gray-700 leading-relaxed text-right whitespace-pre-wrap">
            {product.description}
          </p>
        </div>
      </div>

      {/* Related Products Section */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6 text-right">محصولات مشابه</h2>
        <div className="text-center py-8 text-gray-500">
          محصولات مشابه به زودی...
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailsPage() {
  return (
    <Suspense fallback={<div>Sayfa yükleniyor...</div>}>
      <ProductDetailsContent />
    </Suspense>
  );
}