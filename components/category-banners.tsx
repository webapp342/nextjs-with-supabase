'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_category_id?: string;
  link_brand_id?: string;
  link_url?: string;
  link_type?: 'category' | 'brand' | 'url' | 'tag';
  background_color: string;
  text_color: string;
  sort_order: number;
  category_slug?: string; // Join edilmiş kategori slug'ı
  brand_slug?: string; // Join edilmiş brand slug'ı
  link_category?: {
    id: string;
    slug: string;
    parent_id?: string;
    level: number;
  };
  category_url?: string;
}

interface CategoryBannersProps {
  categoryId?: string | null; // Hangi kategorinin banner'larını göstereceğiz
  limit?: number;
}

export function CategoryBanners({ categoryId = null, limit }: CategoryBannersProps) {
  const supabase = createClient();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // Hierarchical category URL generator
  const getCategoryUrl = async (category: { id: string; slug: string; parent_id?: string; level: number }): Promise<string> => {
    if (!category) return '/';
    
    const hierarchy: string[] = [];
    let currentCategory = category;
    
    // Build hierarchy from bottom to top
    while (currentCategory) {
      hierarchy.unshift(currentCategory.slug);
      
      if (currentCategory.parent_id) {
        const { data: parentCategory } = await supabase
          .from('categories_new')
          .select('id, slug, parent_id, level')
          .eq('id', currentCategory.parent_id)
          .single();
        
        currentCategory = parentCategory;
      } else {
        break;
      }
    }
    
    return `/category/${hierarchy.join('/')}`;
  };

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        let query = supabase
          .from('category_banners')
          .select(`
            *,
            link_category:categories_new!category_banners_link_category_id_fkey(id, slug, parent_id, level),
            link_brand:brands!category_banners_link_brand_id_fkey(slug)
          `)
          .eq('is_active', true)
          .order('sort_order');

        // Eğer categoryId verildiyse o kategorinin banner'larını getir
        // Null ise ana sayfa banner'larını getir
        if (categoryId) {
          query = query.eq('category_id', categoryId);
        } else {
          query = query.is('category_id', null);
        }

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Transform banners ve hierarchical URL'leri hesapla
        const transformedBanners = await Promise.all(
          (data || []).map(async (banner) => {
            let categoryUrl = '';
            if (banner.link_category) {
              categoryUrl = await getCategoryUrl(banner.link_category);
            }
            
            return {
              ...banner,
              category_slug: banner.link_category?.slug,
              brand_slug: banner.link_brand?.slug,
              category_url: categoryUrl
            };
          })
        );

        setBanners(transformedBanners);
      } catch (error) {
        console.error('Banner yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-48"></div>
        ))}
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {banners.map((banner) => {
        // Link URL'ini belirle
        let linkUrl = '#';
        if (banner.link_type === 'category' && banner.category_url) {
          // Pre-calculated hierarchical category URL kullan
          linkUrl = banner.category_url;
        } else if (banner.link_type === 'brand' && banner.brand_slug) {
          linkUrl = `/brand/${banner.brand_slug}`;
        } else if (banner.link_type === 'url' && banner.link_url) {
          linkUrl = banner.link_url;
        } else if (banner.link_type === 'tag') {
          if (banner.link_url === 'bestseller') linkUrl = '/tags/bestseller';
          else if (banner.link_url === 'recommended') linkUrl = '/tags/recommended';
          else if (banner.link_url === 'new') linkUrl = '/tags/new';
        }
        // Fallback: Eğer link_type yoksa eski mantığı kullan
        else if (!banner.link_type && banner.category_slug) {
          linkUrl = `/category/${banner.category_slug}`;
        }

        return (
        <Link
          key={banner.id}
          href={linkUrl}
          className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
        >
          <div 
            className="relative h-48 w-full"
            style={{ backgroundColor: banner.background_color }}
          >
            {/* Background Image */}
            <Image
              src={banner.image_url}
              alt={banner.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300"></div>
            
            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6">
              <h3 
                className="text-2xl font-bold mb-2"
                style={{ color: banner.text_color }}
              >
                {banner.title}
              </h3>
              {banner.subtitle && (
                <p 
                  className="text-sm opacity-90"
                  style={{ color: banner.text_color }}
                >
                  {banner.subtitle}
                </p>
              )}
              
              {/* Hover Arrow */}
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div 
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium"
                  style={{ 
                    backgroundColor: banner.text_color, 
                    color: banner.background_color 
                  }}
                >
                  مشاهده محصولات
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </Link>
        );
      })}
    </div>
  );
} 