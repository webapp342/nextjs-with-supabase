'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CategoryBanners } from '@/components/category-banners';
import { Breadcrumb } from '@/components/breadcrumb';
import { Button } from '@/components/ui/button';
import { Filter, ArrowUpDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toPersianNumber } from '@/lib/utils';

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

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_price?: number;
  image_urls: string[];
  brand: string;
  brand_name?: string;
}

export default function DynamicCategoryPage() {
  const params = useParams();
  const slugArray = Array.isArray(params.slug) ? params.slug : [params.slug];
  const currentSlug = slugArray[slugArray.length - 1]; // Son slug'ı al
  const parentSlug = slugArray.length > 1 ? slugArray[slugArray.length - 2] : null;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [childCategories, setChildCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!currentSlug) return;

      setLoading(true);
      try {
        // Mevcut kategoriyi getir
        let categoryQuery = supabase
          .from('categories_new')
          .select('*')
          .eq('slug', currentSlug)
          .eq('is_active', true);

        // Eğer parent slug varsa, parent kontrolü de yap
        if (parentSlug) {
          const { data: parentCategory } = await supabase
            .from('categories_new')
            .select('id')
            .eq('slug', parentSlug)
            .single();
          
          if (parentCategory) {
            categoryQuery = categoryQuery.eq('parent_id', parentCategory.id);
          }
        }

        const { data: categoryData, error: categoryError } = await categoryQuery.single();

        if (categoryError) throw categoryError;

        setCategory(categoryData);

        // Alt kategorileri getir
        const { data: childData, error: childError } = await supabase
          .from('categories_new')
          .select('*')
          .eq('parent_id', categoryData.id)
          .eq('is_active', true)
          .order('sort_order');

        if (childError) throw childError;
        setChildCategories(childData || []);

        // Bu kategorideki ürünleri getir (hem doğrudan hem de alt kategorilerden)
        let allProducts: Product[] = [];
        
        // Önce bu kategoriye doğrudan atanmış ürünleri al
        const { data: directProducts, error: directError } = await supabase
          .from('products')
          .select(`
            id,
            name,
            description,
            price,
            compare_price,
            image_urls,
            brand,
            brand_id
          `)
          .eq('category_id', categoryData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (directError) throw directError;

        // Brand bilgilerini ayrı olarak getir
        const directProductsWithBrands = await Promise.all(
          (directProducts || []).map(async (product) => {
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

        allProducts = [...directProductsWithBrands];

        // Eğer alt kategoriler varsa, onların ürünlerini de al
        if (childData && childData.length > 0) {
          for (const child of childData) {
            const { data: childProducts, error: childError } = await supabase
              .from('products')
              .select(`
                id,
                name,
                description,
                price,
                compare_price,
                image_urls,
                brand,
                brand_id
              `)
              .eq('category_id', child.id)
              .eq('is_active', true)
              .order('created_at', { ascending: false });
            
            if (childError) throw childError;

            // Brand bilgilerini ayrı olarak getir
            const childProductsWithBrands = await Promise.all(
              (childProducts || []).map(async (product) => {
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

            allProducts = [...allProducts, ...childProductsWithBrands];
          }
        }

        setProducts(allProducts);

      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [currentSlug, parentSlug, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Kategori yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-red-500">Kategori bulunamadı: {error}</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
      <Breadcrumb />
      
      {/* Category Header - RTL aligned */}
      <div className="mb-8">
        <div className="flex items-center justify-end mb-4">
          <div>
            <h1 className="text-3xl font-bold text-right">{category.name}</h1>
            {category.description && (
              <p className="text-muted-foreground text-right mt-2">
                {category.description}
              </p>
            )}
          </div>
        </div>

        {/* Category Image */}
        {category.image_url && (
          <div className="relative w-full h-48 rounded-lg overflow-hidden mb-6">
            <Image
              src={category.image_url}
              alt={category.name}
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>

      {/* Category Banners */}
      <CategoryBanners categoryId={category.id} />

      {/* Alt Kategoriler */}
      {childCategories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-right">دسته‌بندی‌ها</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {childCategories.map((child) => (
              <Link
                key={child.id}
                href={`/category/${slugArray.join('/')}/${child.slug}`}
                className="group p-4 border rounded-lg hover:shadow-md transition-all duration-200"
              >
                <div className="text-center">
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
      {products.length > 0 ? (
        <div>
          <div className="flex justify-end mb-6 px-0">
            <h1 className="text-xl font-bold text-right">
              {category.name} ({toPersianNumber(products.length)} کالا)
            </h1>
          </div>

          {/* Sort and Filter Controls */}
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
          
          {/* Product Grid */}
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
                    <div className="bg-white p-4 hover:bg-gray-50 transition-colors duration-200">
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
                      <div className="space-y-2">
                        {/* Brand */}
                        <div className="text-sm text-gray-500 text-right mr-0">
                          {product.brand_name || 'مارک مشخص نشده'}
                        </div>

                        {/* Product Name */}
                        <h3 className="font-medium text-sm mr-0 text-right leading-tight line-clamp-2">
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
        </div>
      ) : childCategories.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">
            Bu kategoride henüz ürün bulunmuyor
          </p>
        </div>
      ) : null}
    </div>
  );
} 