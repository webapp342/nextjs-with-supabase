'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toPersianNumber } from '@/lib/utils';
import { Breadcrumb } from '@/components/breadcrumb';
import { Button } from '@/components/ui/button';
import { Filter, ArrowUpDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_price?: number;
  image_urls: string[];
  brand: string;
  brand_name?: string;
  category: string;
  user_id: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image_url?: string;
  parent_id?: string;
  level: number;
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [childCategories, setChildCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      setLoading(true);
      
      try {
        // Kategoriyi bul
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories_new')
          .select('*')
          .eq('slug', slug)
          .single();

        if (categoryError) {
          setError('Kategori bulunamadı');
          setLoading(false);
          return;
        }

        setCategory(categoryData);

        // Alt kategorileri getir
        const { data: childData, error: childError } = await supabase
          .from('categories_new')
          .select('*')
          .eq('parent_id', categoryData.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (childError) throw childError;
        setChildCategories(childData || []);

        // Bu kategorideki ürünleri getir
        const { data: productsData, error: productsError } = await supabase
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
            category,
            user_id
          `)
          .eq('category_id', categoryData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;

        // Brand bilgilerini ayrı olarak getir
        const productsWithBrands = await Promise.all(
          (productsData || []).map(async (product) => {
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

      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryAndProducts();
  }, [slug, supabase]);

  if (!category) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-lg">Kategori bulunamadı</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-red-500">Hata: {error}</p>
      </div>
    );
  }

  return (
    <div className="w-full py-4 px-2">
      {/* Breadcrumb - moved to right as requested */}
      <div className="flex justify-end mb-0">
        <Breadcrumb />
      </div>
      
      {/* Category Title with Product Count on left side */}
      <div className="flex justify-end items-start mb-4">
        <div className="flex items-center gap-2 ">
          <h1 className="text-xl font-bold text-right">
            {category.name}
          </h1>
          <span className="text-sm text-gray-500">
            ({toPersianNumber(products.length)} کالا)
          </span>
        </div>
      </div>

      {/* Subcategory buttons - compact design below title on right side */}
      {childCategories.length > 0 && (
        <div className="flex justify-end mb-6">
          <div className="flex flex-wrap gap-2 max-w-md">
            {childCategories.map((child) => (
              <Link
                key={child.id}
                href={`/category/${child.slug}`}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs px-3 py-1 h-8 rounded-full border-gray-300 hover:bg-gray-50"
                >
                  {child.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sort and Filter Controls - removed bottom border */}
      <div className="flex items-center justify-between mb-6 pb-4">
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

      {/* Product Grid */}
      {products.length > 0 && (
        <div className="grid grid-cols-2">
          {products.map((product, index) => {
            const hasDiscount = product.compare_price && product.compare_price > product.price;
            const discountPercentage = hasDiscount 
              ? Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)
              : 0;

            return (
              <div key={product.id} className="relative">
                {/* Vertical separator line */}
                {index % 2 === 0 && (
                  <div className="absolute top-0 right-0 w-px h-full bg-gray-200 z-10"></div>
                )}
                
                {/* Horizontal separator line at bottom */}
                <div className="absolute bottom-0 left-0 w-full h-px bg-gray-200 z-10"></div>

                <Link href={`/product-details?id=${product.id}`}>
                  <div className="bg-white p-4 hover:bg-gray-50 transition-colors duration-200 relative">
                    {/* Product Image */}
                    <div className="relative w-full bg-gray-50 rounded-lg mb-3">
                      {product.image_urls && product.image_urls.length > 0 ? (
                        <Image 
                          src={product.image_urls[0]} 
                          alt={product.name} 
                          width={400}
                          height={400}
                          className="w-full h-auto object-contain rounded-lg"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center text-gray-400 rounded-lg">
                          <span>تصویر موجود نیست</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="text-right">
                      {/* Brand */}
                      <div className="text-xs text-gray-500 mb-1">
                        {product.brand_name}
                      </div>
                      
                      {/* Product Name */}
                      <h3 className="font-medium text-sm mb-2 line-clamp-2 leading-tight">
                        {product.name}
                      </h3>
                      
                      {/* Price Section */}
                      {hasDiscount ? (
                        <div className="pt-4">
                          <div className="flex items-center gap-3">
                            {/* Discount Badge */}
                            <div className="bg-red-500 font-sans text-white text-sm px-2 py-1 rounded">
                              {toPersianNumber(discountPercentage)}%
                            </div>
                            
                            {/* Price Stack */}
                            <div className="flex flex-col">
                              {/* Original Price */}
                              <div className="text-sm text-gray-400 line-through">
                                <span className="font-sans text-left">{toPersianNumber(product.compare_price!.toLocaleString())}</span>
                              </div>
                              {/* Sale Price */}
                              <div className="text-sm font-bold">
                                <span className="font-sans text-left">؋ &lrm;{toPersianNumber(product.price.toLocaleString())}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-4">
                          <div className="flex items-end min-h-[44px]">
                            <div className="text-sm font-bold">
                              <span className="font-sans text-left">؋ &lrm;{toPersianNumber(product.price.toLocaleString())}</span>
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
      )}

      {products.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">
            Bu kategoride henüz ürün bulunmuyor
          </p>
        </div>
      )}
    </div>
  );
} 