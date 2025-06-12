'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbData {
  product_id: string;
  product_name: string;
  brand_name: string;
  brand_slug: string;
  product_type_name: string;
  product_type_slug: string;
  category_name: string;
  category_slug: string;
  category_level: number;
  parent_category_name?: string;
  parent_category_slug?: string;
  grandparent_category_name?: string;
  grandparent_category_slug?: string;
}

interface EnhancedBreadcrumbProps {
  showOnlyCategory?: boolean;
  showOnlyBrand?: boolean;
  showBrandProductType?: boolean;
  brandName?: string;
  brandSlug?: string;
  productTypeName?: string;
  productTypeSlug?: string;
  categoryId?: string; // Kategori bilgisini dışarıdan alabilmek için
}

export function EnhancedBreadcrumb({ 
  showOnlyCategory = false, 
  showOnlyBrand = false, 
  showBrandProductType = false,
  brandName,
  brandSlug,
  productTypeName,
  productTypeSlug,
  categoryId
}: EnhancedBreadcrumbProps = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [categoryBreadcrumbs, setCategoryBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [brandBreadcrumbs, setBrandBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // CategoryId verildiğinde kategori breadcrumb'ını oluştur
  useEffect(() => {
    const buildCategoryBreadcrumbFromId = async () => {
      if (!categoryId) return;

      try {
        const { data: category } = await supabase
          .from('categories_new')
          .select('*')
          .eq('id', categoryId)
          .eq('is_active', true)
          .single();

        if (!category) return;

        const categoryItems: BreadcrumbItem[] = [];
        
        // Kategori hiyerarşisini geriye doğru oluştur
        const buildHierarchy = async (currentCategory: any) => {
          if (currentCategory.parent_id) {
            const { data: parentCategory } = await supabase
              .from('categories_new')
              .select('*')
              .eq('id', currentCategory.parent_id)
              .eq('is_active', true)
              .single();

            if (parentCategory) {
              await buildHierarchy(parentCategory);
              
              // Parent kategori için path oluştur
              let parentPath = `/category/${parentCategory.slug}`;
              if (parentCategory.parent_id) {
                // Eğer grandparent varsa, tam path'i oluştur
                const { data: grandParent } = await supabase
                  .from('categories_new')
                  .select('slug')
                  .eq('id', parentCategory.parent_id)
                  .single();
                
                if (grandParent) {
                  parentPath = `/category/${grandParent.slug}/${parentCategory.slug}`;
                }
              }
              
              categoryItems.push({
                label: parentCategory.name,
                href: parentPath
              });
            }
          }
          
          // Mevcut kategori için path oluştur
          let currentPath = `/category/${currentCategory.slug}`;
          if (currentCategory.parent_id) {
            // Parent path'ini al
            const parentPaths = categoryItems.map(item => {
              const segments = item.href.split('/').filter(s => s && s !== 'category');
              return segments;
            });
            
            if (parentPaths.length > 0) {
              const fullParentPath = parentPaths[parentPaths.length - 1];
              currentPath = `/category/${fullParentPath.join('/')}/${currentCategory.slug}`;
            }
          }
          
          categoryItems.push({
            label: currentCategory.name,
            href: currentPath
          });
        };

                 await buildHierarchy(category);
         setCategoryBreadcrumbs(categoryItems);
         setBrandBreadcrumbs([]); // Brand breadcrumbs'ı sıfırla
         setLoading(false);
         
       } catch (error) {
         console.error('Category breadcrumb error:', error);
         setLoading(false);
       }
     };

     if (showBrandProductType && categoryId) {
       setLoading(true);
       buildCategoryBreadcrumbFromId();
     }
   }, [categoryId, showBrandProductType, supabase]);

  useEffect(() => {
    // showBrandProductType modunda bu useEffect'i çalıştırma
    if (showBrandProductType) {
      setLoading(false);
      return;
    }

    const generateBreadcrumbs = async () => {
      setLoading(true);
      const pathSegments = pathname.split('/').filter(segment => segment !== '');
      
      try {
        // Ürün detay sayfası için breadcrumb oluştur
        if (pathSegments.includes('product-details')) {
          const productId = searchParams.get('id');
          
          if (productId) {
            const { data: breadcrumbData } = await supabase
              .from('breadcrumb_data')
              .select('*')
              .eq('product_id', productId)
              .single();

            if (breadcrumbData) {
              // 1. Kategori Breadcrumbs (Üst)
              const categoryItems: BreadcrumbItem[] = [];

              // Kategori hiyerarşisi oluştur (ana sayfa dahil etme)
              if (breadcrumbData.grandparent_category_name) {
                categoryItems.push({
                  label: breadcrumbData.grandparent_category_name,
                  href: `/category/${breadcrumbData.grandparent_category_slug}`
                });
              }

              if (breadcrumbData.parent_category_name) {
                const parentPath = breadcrumbData.grandparent_category_slug 
                  ? `/category/${breadcrumbData.grandparent_category_slug}/${breadcrumbData.parent_category_slug}`
                  : `/category/${breadcrumbData.parent_category_slug}`;
                
                categoryItems.push({
                  label: breadcrumbData.parent_category_name,
                  href: parentPath
                });
              }

              if (breadcrumbData.category_name) {
                let categoryPath = `/category/${breadcrumbData.category_slug}`;
                
                if (breadcrumbData.parent_category_slug) {
                  const parentPath = breadcrumbData.grandparent_category_slug 
                    ? `${breadcrumbData.grandparent_category_slug}/${breadcrumbData.parent_category_slug}`
                    : breadcrumbData.parent_category_slug;
                  categoryPath = `/category/${parentPath}/${breadcrumbData.category_slug}`;
                }
                
                categoryItems.push({
                  label: breadcrumbData.category_name,
                  href: categoryPath
                });
              }

              setCategoryBreadcrumbs(categoryItems);

              // 2. Marka/Ürün Tipi Breadcrumbs (Alt)
              const brandItems: BreadcrumbItem[] = [];
              
              if (breadcrumbData.brand_name) {
                brandItems.push({
                  label: breadcrumbData.brand_name,
                  href: `/brand/${breadcrumbData.brand_slug}`
                });
              }

              if (breadcrumbData.product_type_name) {
                brandItems.push({
                  label: breadcrumbData.product_type_name,
                  href: `/brand/${breadcrumbData.brand_slug}/${breadcrumbData.product_type_slug}`
                });
              }

              setBrandBreadcrumbs(brandItems);
            }
          }
        } else if (pathSegments.includes('category')) {
          // Kategori sayfası için breadcrumb (ana sayfa olmadan)
          const categorySegments = pathSegments.slice(pathSegments.indexOf('category') + 1);
          const categoryItems: BreadcrumbItem[] = [];

          let currentParentId = null;
          
          for (let i = 0; i < categorySegments.length; i++) {
            const categorySlug = categorySegments[i];
            
            let categoryQuery = supabase
              .from('categories_new')
              .select('*')
              .eq('slug', categorySlug)
              .eq('is_active', true);
            
            if (currentParentId) {
              categoryQuery = categoryQuery.eq('parent_id', currentParentId);
            } else {
              categoryQuery = categoryQuery.is('parent_id', null);
            }
            
            const { data: category } = await categoryQuery.single();
            
            if (category) {
              const categoryPath = '/category/' + categorySegments.slice(0, i + 1).join('/');
              categoryItems.push({
                label: category.name,
                href: categoryPath
              });
              currentParentId = category.id;
            }
          }

          setCategoryBreadcrumbs(categoryItems);
          setBrandBreadcrumbs([]);
        } else if (pathSegments.includes('brand')) {
          // Marka sayfası için breadcrumb
          const brandSlug = pathSegments[pathSegments.indexOf('brand') + 1];
          const productTypeSlug = pathSegments[pathSegments.indexOf('brand') + 2];
          
          const { data: brand } = await supabase
            .from('brands')
            .select('*')
            .eq('slug', brandSlug)
            .eq('is_active', true)
            .single();

          const brandItems: BreadcrumbItem[] = [];
          
          if (brand) {
            brandItems.push({
              label: brand.name,
              href: `/brand/${brand.slug}`
            });

            if (productTypeSlug) {
              const { data: productType } = await supabase
                .from('product_types')
                .select('*')
                .eq('slug', productTypeSlug)
                .eq('brand_id', brand.id)
                .eq('is_active', true)
                .single();

              if (productType) {
                brandItems.push({
                  label: productType.name,
                  href: `/brand/${brand.slug}/${productType.slug}`
                });
              }
            }
          }

          setCategoryBreadcrumbs([]);
          setBrandBreadcrumbs(brandItems);
        } else {
          // Diğer sayfalar için sadece ana sayfa
          setCategoryBreadcrumbs([]);
          setBrandBreadcrumbs([]);
        }

      } catch (error) {
        console.error('Breadcrumb error:', error);
        setCategoryBreadcrumbs([]);
        setBrandBreadcrumbs([]);
      } finally {
        setLoading(false);
      }
    };

    generateBreadcrumbs();
  }, [pathname, searchParams, supabase, showBrandProductType]);

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
      </div>
    );
  }

  // Hiç breadcrumb yoksa gösterme
  if (categoryBreadcrumbs.length === 0 && brandBreadcrumbs.length === 0) {
    return null;
  }

  const renderBreadcrumbItems = (items: BreadcrumbItem[], allowAllLinks = false) => (
    <div className="flex items-center gap-2 text-sm" dir="rtl">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {allowAllLinks || index !== items.length - 1 ? (
            <>
              <Link 
                href={item.href}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {item.label}
              </Link>
              {index !== items.length - 1 && <span className="text-gray-400">←</span>}
            </>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </div>
  );

  // Sadece kategori göster
  if (showOnlyCategory && categoryBreadcrumbs.length > 0) {
    return (
      <div className="py-2">
        {renderBreadcrumbItems(categoryBreadcrumbs)}
      </div>
    );
  }

  // Sadece marka göster - Tüm itemlerin link olmasını sağla
  if (showOnlyBrand && brandBreadcrumbs.length > 0) {
    return (
      <div className="py-2">
        {renderBreadcrumbItems(brandBreadcrumbs, true)}
      </div>
    );
  }

  // Marka + Ürün Tipi özel breadcrumb (kategori + marka + ürün tipi birlikte)
  if (showBrandProductType && brandName && productTypeName) {
    return (
      <div className="py-2 border-b border-gray-200">
        {/* Kategori Breadcrumb */}
        {categoryBreadcrumbs.length > 0 && (
          <div className="text-sm text-gray-600 text-right mb-2" dir="rtl">
            {renderBreadcrumbItems(categoryBreadcrumbs, false)}
          </div>
        )}
        
        {/* Marka + Ürün Tipi Breadcrumb */}
        <div className="text-sm text-gray-600 text-right" dir="rtl">
          <div className="flex items-center gap-2 justify-end">
            <Link 
              href={`/brand/${brandSlug}/${productTypeSlug}`}
              className="text-gray-700 hover:text-gray-900 transition-colors"
            >
              {productTypeName}
            </Link>
            <span className="text-gray-400">←</span>
            <Link 
              href={`/brand/${brandSlug}`}
              className="text-gray-700 hover:text-gray-900 transition-colors"
            >
              {brandName}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Her ikisini de göster (eski versiyon)
  return (
    <div className="space-y-3 py-4 bg-gray-50 rounded-lg px-4" dir="rtl">
      {/* Kategori Breadcrumbs (Üst) */}
      {categoryBreadcrumbs.length > 0 && (
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">مسیر دسته‌بندی:</div>
          {renderBreadcrumbItems(categoryBreadcrumbs)}
        </div>
      )}
      
      {/* Marka/Ürün Tipi Breadcrumbs (Alt) */}
      {brandBreadcrumbs.length > 0 && (
        <div className="text-right border-t pt-2">
          <div className="text-xs text-gray-500 mb-1">مارک و نوع محصول:</div>
          {renderBreadcrumbItems(brandBreadcrumbs, true)}
        </div>
      )}
    </div>
  );
} 