'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toPersianNumber } from '@/lib/utils';

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

export default function ProductDetailsPage() {

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
    <div className="w-[95%] mx-auto py-8">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>{product.name}</CardTitle>
          <CardDescription>{product.brand}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full mb-4">
            {product.image_urls && product.image_urls.length > 0 ? (
              <Image src={product.image_urls[0]} alt={`${product.name} - 1`} className="object-cover w-full h-full rounded-md" width={500} height={500} unoptimized />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-md">
                <p className="text-gray-500">Resim yok</p>
              </div>
            )}
          </div>
          <p className="text-lg font-semibold mb-2">Fiyat: ؋ {toPersianNumber(product.price)}</p>
          <p className="text-gray-700 whitespace-pre-wrap">Açıklama: {product.description}</p>
        </CardContent>
      </Card>

    </div>
  );
}