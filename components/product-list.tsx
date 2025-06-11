'use client';

'use client';

import { useEffect, useState }
 from 'react';
import { createClient }
 from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { toPersianNumber, truncateText } from '@/lib/utils';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_urls: string[];
  brand: string;
  user_id: string;
}


export function ProductList() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error }
 = await supabase
        .from('products')
        .select('*');

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }


      setProducts(data as Product[]);
      setLoading(false);
    }
;

    fetchProducts();
  }
, [supabase]);

  if (loading) {
    return <p>Ürünler yükleniyor...</p>;
  }


  if (error) {
    return <p>Ürünler yüklenirken hata oluştu: {error}
</p>;
  }


  if (products.length === 0) {
    return <p>Henüz hiç ürün bulunmuyor.</p>;
  }




  return (
    <div className="w-[95%] mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
      {products.map((product) => (
        <Link key={product.id} href={`/product-details?id=${product.id}`}>
          <Card className="flex flex-col h-full cursor-pointer">

            <div className="relative w-full h-48 ">
              {product.image_urls && product.image_urls.length > 0 && (
                <Image src={product.image_urls[0]} alt={product.name} className="absolute w-full h-full object-cover rounded-t-md" width={500} height={500} />
              )}

            </div>
            <CardHeader className="px-3 pt-3 pb-2">
              <CardTitle className="font-sans text-base text-right leading-tight">{product.name}</CardTitle>
              <CardDescription className="font-sans text-xs text-gray-500 text-right leading-tight">{product.brand}</CardDescription>
            </CardHeader>
            
            <div className="px-3 pb-3">
              <div className="font-sans text-s text-right whitespace-pre-wrap min-h-[2em]">
                {truncateText(product.description, 2)}
              </div>
            </div>
            <div className="flex px-3 pb-3 mt-auto">
              <p className="font-sans text-left"> ؋ &lrm; <span className="font-medium">{toPersianNumber(product.price)}</span></p>
            </div>
          </Card>
        </Link>
        ))}

      </div>
    </div>
  );
}