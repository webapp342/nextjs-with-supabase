'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Breadcrumb } from '@/components/breadcrumb';
import { CategoryBanners } from '@/components/category-banners';
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
  const [totalProductCount, setTotalProductCount] = useState(0);
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
          .select('*')
          .eq('category_id', categoryData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;
        setProducts(productsData || []);

        // Toplam ürün sayısını hesapla (bu kategori + alt kategoriler)
        let totalCount = productsData?.length || 0;
        
        if (childData && childData.length > 0) {
          // Alt kategorilerdeki ürün sayılarını da ekle
          for (const child of childData) {
            const { count } = await supabase
              .from('products')
              .select('*', { count: 'exact', head: true })
              .eq('category_id', child.id)
              .eq('is_active', true);
            
            totalCount += count || 0;
          }
        }
        
        setTotalProductCount(totalCount);

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
    <div className="w-full px-0 py-8">
      <div className="px-4">
        <Breadcrumb />
        
        {/* Category Header */}
        <div className="flex items-center gap-4 mb-8 mt-4">
          <div className="text-4xl">{category.icon}</div>
          <div>
            <h1 className="text-2xl font-bold text-right">{category.name}</h1>
            <p className="text-muted-foreground text-right">
              {toPersianNumber(totalProductCount)} ürün bulundu
            </p>
          </div>
        </div>

      </div>

      {/* Category Banners */}
      <CategoryBanners categoryId={category.id} />

      {/* Alt Kategoriler */}
      {childCategories.length > 0 && (
        <div className="mb-8 px-4">
          <h2 className="text-xl font-bold mb-4 text-right">دسته‌بندی‌ها</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {childCategories.map((child) => (
              <Link
                key={child.id}
                href={`/category/${category.slug}/${child.slug}`}
                className="group p-4 border rounded-lg hover:shadow-md transition-all duration-200"
              >
                <div className="text-center">
                  {child.icon && (
                    <div className="text-2xl mb-2">{child.icon}</div>
                  )}
                  <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                    {child.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Ürünler */}
      {products.length > 0 && (
        <div className="px-4">
          <h2 className="text-xl font-bold mb-4 text-right">
            محصولات ({toPersianNumber(products.length)} کالا)
          </h2>
          
          {/* Sort and Filter Controls */}
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                مرتب سازی
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                فیلترها
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid with Separators */}
      {products.length > 0 && (
        <div className="grid grid-cols-2">
          {products.map((product, index) => {
            // Only show discount if product actually has compare_price
            const hasDiscount = product.compare_price && product.compare_price > product.price;
            const discountPercentage = hasDiscount 
              ? Math.round(((product.compare_price! - product.price) / product.compare_price!) * 100)
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
                    {/* Discount Badge */}
                    {hasDiscount && (
                      <div className="absolute top-2 left-2 z-20">
                        <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          {toPersianNumber(discountPercentage)}%
                        </div>
                      </div>
                    )}

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
                        {product.brand}
                      </div>
                      
                      {/* Product Name */}
                      <h3 className="font-medium text-sm mb-2 line-clamp-2 leading-tight">
                        {product.name}
                      </h3>
                      
                      {/* Price */}
                      {hasDiscount ? (
                        <div className="pt-4">
                          <div className="flex items-end min-h-[44px]">
                            <div>
                              {/* Original Price */}
                              <div className="text-xs text-gray-400 line-through mb-1">
                                <span className="font-sans text-left">؋ {toPersianNumber(product.compare_price!.toLocaleString())}</span>
                              </div>
                              {/* Sale Price */}
                              <div className="text-sm font-bold">
                                <span className="font-sans text-left"> ؋ {toPersianNumber(product.price.toLocaleString())}</span>
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
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Alt kategoriler varsa ama bu kategoride ürün yoksa */}
      {products.length === 0 && childCategories.length > 0 && (
        <div className="text-center py-8 px-4">
          <p className="text-lg text-muted-foreground mb-4">
            Bu kategoride doğrudan ürün bulunmuyor
          </p>
          <p className="text-sm text-muted-foreground">
            Alt kategorilerden birini seçerek ürünleri görüntüleyebilirsiniz
          </p>
        </div>
      )}

      {/* Hiç ürün ve alt kategori yoksa */}
      {products.length === 0 && childCategories.length === 0 && (
        <div className="text-center py-16 px-4">
          <p className="text-lg text-muted-foreground">
            Bu kategoride henüz ürün bulunmuyor
          </p>
        </div>
      )}
    </div>
  );
} 