'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

import Image from 'next/image';
import { toPersianNumber } from '@/lib/utils';
import Link from 'next/link';
import { Filter, ArrowUpDown } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_price?: number;
  image_urls: string[];
  brand_name: string;
  user_id: string;
  is_on_sale?: boolean;
  stock_quantity?: number;
  tags?: string[];
  brands?: { name: string };
  categories?: { name: string };
  product_types?: { name: string };
}

interface ProductListProps {
  filters?: {
    brand_id?: string;
    category_id?: string;
    product_type_id?: string;
    is_bestseller?: boolean;
    is_new?: boolean;
    is_recommended?: boolean;
  };
  showFilters?: boolean;
  showHeader?: boolean;
}

export function ProductList({ 
  filters = {}, 
  showFilters = true, 
  showHeader = true 
}: ProductListProps = {}) {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy] = useState('newest');

  useEffect(() => {
    const fetchProducts = async () => {
      // First, get all products
      let query = supabase
        .from('products')
        .select('*');
      
      // Apply filters
      if (filters.brand_id) {
        query = query.eq('brand_id', filters.brand_id);
      }
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters.product_type_id) {
        query = query.eq('product_type_id', filters.product_type_id);
      }
      if (filters.is_bestseller) {
        query = query.eq('is_bestseller', true);
      }
      if (filters.is_new) {
        query = query.eq('is_new', true);
      }
      if (filters.is_recommended) {
        query = query.eq('is_recommended', true);
      }
      
      // Add sorting
      switch (sortBy) {
        case 'price_low':
          query = query.order('price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price', { ascending: false });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data: productsData, error: productsError } = await query;

      if (productsError) {
        setError(productsError.message);
        setLoading(false);
        return;
      }

      // Get all brands to map brand_id to brand_name
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('id, name');

      if (brandsError) {
        setError(brandsError.message);
        setLoading(false);
        return;
      }

      // Create a map of brand_id to brand_name
      const brandMap = new Map(brandsData?.map(brand => [brand.id, brand.name]) || []);

      // Transform data to include brand_name
      const transformedData = productsData?.map(product => ({
        ...product,
        brand_name: brandMap.get(product.brand_id) || 'مارک مشخص نشده'
      }));

      setProducts(transformedData as Product[]);
      setLoading(false);
    };

    fetchProducts();
  }, [supabase, sortBy, filters]);

  // Calculate discount percentage
  const getDiscountPercentage = (originalPrice: number, salePrice: number) => {
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  };



  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-lg p-4">
              <div className="bg-gray-200 rounded h-48 mb-4"></div>
              <div className="bg-gray-200 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <p className="text-center text-red-500">Ürünler yüklenirken hata oluştu: {error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Henüz hiç ürün bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="w-full py-6">
      {/* Page Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-6 px-0">
          <h1 className="text-xl text-right font-lalezar">
            آرایشی ({toPersianNumber(products.length)} کالا)
          </h1>
        </div>
      )}

      {/* Sort and Filter Controls */}
      {showFilters && (
        <div className="flex items-center justify-between mb-6 border-b pb-4 ">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {/* Open sort menu */}}
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
              onClick={() => {/* Open filter menu */}}
              className="text-sm"
            >
              <Filter className="w-4 h-4 mr-2" />
              فیلترها
            </Button>
          </div>
        </div>
      )}

      {/* Products Grid with Separators */}
      <div className="grid grid-cols-2">
        {products.map((product, index) => {
          const hasDiscount = product.compare_price && product.compare_price > product.price;
          const discountPercentage = hasDiscount 
            ? getDiscountPercentage(product.compare_price!, product.price)
            : 0;


          return (
            <div key={product.id} className="relative">
              {/* Vertical separator line (except for right column) */}
              {index % 2 === 0 && (
                <div className="absolute top-0 right-0 w-px h-full bg-gray-200 z-10"></div>
              )}
              
              {/* Horizontal separator line at bottom of each product */}
              <div className="absolute bottom-0 left-0 w-full h-px bg-gray-200 z-10"></div>

              <Link href={`/product-details?id=${product.id}`}>
                <div className="bg-white p-4 hover:bg-gray-50 transition-colors duration-200 relative">
                  {/* Product Image */}
                  <div className="relative w-full bg-gray-50 rounded-lg mb-3">
                    {product.image_urls && product.image_urls.length > 0 && product.image_urls[0] ? (
                      <Image 
                        src={product.image_urls[0]} 
                        alt={product.name} 
                        width={300}
                        height={300}
                        className="w-full h-auto object-contain rounded-lg"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400">تصویر موجود نیست</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    {/* Brand - gray color at top */}
                    <div className="text-sm text-gray-500 text-right mr-0 font-lalezar">
                      {product.brand_name || 'مارک مشخص نشده'}
                    </div>

                    {/* Product Name - main product info */}
                    <h3 className="text-sm mr-0 text-right leading-tight line-clamp-2 font-lalezar">
                      {product.name}
                    </h3>

                    {/* Price Section */}
                    {hasDiscount ? (
                      <div className="pt-4">
                        <div className="flex items-center gap-3">
                          {/* Discount Badge */}
                          <div className="bg-red-500 text-white text-sm px-2 py-1 rounded font-far-akbar">
                            {toPersianNumber(discountPercentage)}%
                          </div>
                          
                          {/* Price Stack */}
                          <div className="flex flex-col">
                            {/* Original Price (crossed out) */}
                            <div className="text-sm text-gray-400 line-through font-far-akbar">
                              <span className="text-left">{toPersianNumber(product.compare_price!.toLocaleString())}</span>
                            </div>
                            {/* Sale Price */}
                            <div className="text-m font-bold font-far-akbar">
                              <span className="text-left">؋ &lrm;{toPersianNumber(product.price.toLocaleString())}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-4">
                        <div className="flex items-end min-h-[44px]">
                          <div className="text-m font-bold font-far-akbar">
                            <span className="text-left">؋ &lrm;{toPersianNumber(product.price.toLocaleString())}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* L More Button */}
      {products.length >= 20 && (
        <div className="text-center mt-8 px-4">
          <Button variant="outline" size="lg">
            بارگذاری بیشتر
          </Button>
        </div>
      )}
    </div>
  );
}