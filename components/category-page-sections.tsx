'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import { ProductCard } from '@/components/product-card';

interface CategorySection {
  id: string;
  category_id: string;
  section_type: 'banner' | 'product_grid' | 'featured_products' | 'bestsellers' | 'new_products' | 'recommended';
  title?: string;
  subtitle?: string;
  description?: string;
  
  // Banner fields
  image_url?: string;
  background_color?: string;
  text_color?: string;
  link_type?: 'category' | 'brand' | 'url' | 'tag';
  link_category_id?: string;
  link_brand_id?: string;
  link_url?: string;
  
  // Product section fields
  product_filter_type?: 'manual' | 'category' | 'brand' | 'tag' | 'price_range';
  filter_category_id?: string;
  filter_brand_id?: string;
  filter_tags?: string[];
  min_price?: number;
  max_price?: number;
  product_limit?: number;
  display_style?: 'grid' | 'horizontal_scroll' | 'list';
  
  sort_order: number;
  is_active: boolean;
  show_on_mobile: boolean;
  show_on_desktop: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  image_urls: string[];
  brand?: string;
  brand_name?: string;
  is_bestseller?: boolean;
  is_recommended?: boolean;
  is_new?: boolean;
}

interface CategoryPageSectionsProps {
  categoryId: string;
}

export function CategoryPageSections({ categoryId }: CategoryPageSectionsProps) {
  const supabase = createClient();
  const [sections, setSections] = useState<CategorySection[]>([]);
  const [sectionProducts, setSectionProducts] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryId) {
      fetchSections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const fetchSections = async () => {
    try {
      const { data: sectionsData, error } = await supabase
        .from('category_page_sections')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      setSections(sectionsData || []);

      // Fetch products for each product section
      const productSections = sectionsData?.filter(s => s.section_type !== 'banner') || [];
      const productsData: Record<string, Product[]> = {};

      for (const section of productSections) {
        const products = await fetchSectionProducts(section);
        productsData[section.id] = products;
      }

      setSectionProducts(productsData);
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSectionProducts = async (section: CategorySection): Promise<Product[]> => {
    try {
      // Manuel ürün seçimi için özel işlem
      if (section.product_filter_type === 'manual') {
        // Önce section'a atanmış ürün ID'lerini al
        const { data: sectionProductIds, error: sectionError } = await supabase
          .from('category_section_products')
          .select('product_id')
          .eq('section_id', section.id)
          .order('sort_order');

        if (sectionError) throw sectionError;

        if (!sectionProductIds || sectionProductIds.length === 0) {
          return [];
        }

        // Ürün ID'lerini array'e çevir
        const productIds = sectionProductIds.map(item => item.product_id);

        // Bu ID'lere sahip ürünleri getir
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select(`
            id,
            name,
            price,
            compare_price,
            image_urls,
            is_bestseller,
            is_recommended,
            is_new,
            brand,
            brand_id
          `)
          .in('id', productIds)
          .eq('is_active', true);

        if (productsError) throw productsError;

        // Brand bilgilerini ayrı olarak getir
        const productsWithBrands = await Promise.all(
          (products || []).map(async (product) => {
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

        // Ürünleri section'daki sıralamaya göre düzenle
        const sortedProducts = productIds
          .map(id => productsWithBrands?.find(p => p.id === id))
          .filter(Boolean) as Product[];

        return sortedProducts;
      }

      // Diğer filtre türleri için mevcut kod
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          compare_price,
          image_urls,
          is_bestseller,
          is_recommended,
          is_new,
          brand,
          brand_id
        `)
        .eq('is_active', true);

      // Apply filters based on section configuration
      if (section.product_filter_type === 'category' && section.filter_category_id) {
        query = query.eq('category_id', section.filter_category_id);
      } else if (section.product_filter_type === 'brand' && section.filter_brand_id) {
        query = query.eq('brand_id', section.filter_brand_id);
      } else if (section.product_filter_type === 'tag') {
        if (section.section_type === 'bestsellers') {
          query = query.eq('is_bestseller', true);
        } else if (section.section_type === 'recommended') {
          query = query.eq('is_recommended', true);
        } else if (section.section_type === 'new_products') {
          query = query.eq('is_new', true);
        }
      } else if (section.product_filter_type === 'price_range') {
        if (section.min_price) query = query.gte('price', section.min_price);
        if (section.max_price) query = query.lte('price', section.max_price);
      }

      // Apply limit
      if (section.product_limit) {
        query = query.limit(section.product_limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Brand bilgilerini ayrı olarak getir
      const productsWithBrands = await Promise.all(
        (data || []).map(async (product) => {
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

      return productsWithBrands || [];
    } catch (error) {
      console.error('Error fetching section products:', error);
      return [];
    }
  };

  const generateSectionLink = (section: CategorySection): string => {
    if (!section.link_type) return '#';

    switch (section.link_type) {
      case 'category':
        return section.link_category_id ? `/categories/${section.link_category_id}` : '#';
      case 'brand':
        return section.link_brand_id ? `/brands/${section.link_brand_id}` : '#';
      case 'tag':
        return section.link_url ? `/tags/${section.link_url}` : '#';
      case 'url':
        return section.link_url || '#';
      default:
        return '#';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <div key={section.id} className="w-full">
          {section.section_type === 'banner' ? (
            // Banner Section
            <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden group">
              {section.image_url && (
                <Image
                  src={section.image_url}
                  alt={section.title || 'Banner'}
                  fill
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  quality={95}
                  priority
                  unoptimized
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              )}
              
              {/* Overlay */}
              <div 
                className="absolute inset-0 flex flex-col justify-center items-center text-center p-6"
                style={{ 
                  backgroundColor: section.background_color ? `${section.background_color}80` : 'rgba(0,0,0,0.3)',
                  color: section.text_color || '#ffffff'
                }}
              >
                {section.title && (
                  <h2 className="text-2xl md:text-4xl font-bold mb-2">
                    {section.title}
                  </h2>
                )}
                {section.subtitle && (
                  <p className="text-lg md:text-xl mb-4">
                    {section.subtitle}
                  </p>
                )}
                {section.description && (
                  <p className="text-sm md:text-base max-w-2xl">
                    {section.description}
                  </p>
                )}
              </div>

              {/* Link Overlay */}
              {generateSectionLink(section) !== '#' && (
                <Link href={generateSectionLink(section)} className="absolute inset-0 z-10">
                  <span className="sr-only">{section.title}</span>
                </Link>
              )}
            </div>
          ) : (
            // Product Section
            <div className="py-8">
              {/* Section Header - Ana sayfa tasarımı */}
              <div className="flex items-center justify-between mb-6 px-4">
                <Link href="#" className="text-pink-500 text-sm hover:text-pink-600">
                  مشاهده همه
                </Link>
                <h2 className="text-xl font-bold text-right">
                  {section.title || 'محصولات'}
                </h2>
              </div>

              {/* Products Display */}
              {sectionProducts[section.id] && sectionProducts[section.id].length > 0 && (
                <div className={
                  section.display_style === 'horizontal_scroll' 
                    ? "flex gap-4 px-4 overflow-x-auto pb-4"
                    : section.display_style === 'list'
                    ? "space-y-4 px-4"
                    : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0 px-4"
                } style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <style jsx>{`
                    div::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  
                  {sectionProducts[section.id].map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      showBadges={false}
                      size="md"
                      className={
                        section.display_style === 'horizontal_scroll' 
                          ? "min-w-[200px] max-w-[200px]"
                          : ""
                      }
                    />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {(!sectionProducts[section.id] || sectionProducts[section.id].length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  Bu section için ürün bulunamadı.
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 