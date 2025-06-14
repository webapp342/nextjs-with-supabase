'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

interface GridBanner {
  id: string
  title: string
  image_url: string
  mobile_image_url?: string
  link_type: 'category' | 'brand' | 'tag' | 'custom'
  link_category_id?: string
  link_brand_id?: string
  link_tag?: string
  link_url?: string
  sort_order: number
  is_active: boolean
}

export default function GridBanners() {
  const [banners, setBanners] = useState<GridBanner[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchBanners = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('grid_banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) {
        console.error('Error fetching grid banners:', error)
        return
      }

      setBanners(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchBanners()
  }, [fetchBanners])

  // Helper function to build hierarchical category URL
  const buildCategoryUrl = async (categoryId: string): Promise<string> => {
    try {
      const { data: category, error } = await supabase
        .from('categories_new')
        .select('id, slug, parent_id, level')
        .eq('id', categoryId)
        .single();

      if (error || !category) return '/category';

      // Build path by traversing up the hierarchy
      const pathSegments = [category.slug];
      let currentCategory = category;

      while (currentCategory.parent_id) {
        const { data: parentCategory, error: parentError } = await supabase
          .from('categories_new')
          .select('id, slug, parent_id, level')
          .eq('id', currentCategory.parent_id)
          .single();

        if (parentError || !parentCategory) break;
        
        pathSegments.unshift(parentCategory.slug);
        currentCategory = parentCategory;
      }

      return `/category/${pathSegments.join('/')}`;
    } catch (error) {
      console.error('Error building category URL:', error);
      return '/category';
    }
  };

  const generateLink = async (banner: GridBanner): Promise<string> => {
    switch (banner.link_type) {
      case 'category':
        if (banner.link_category_id) {
          return await buildCategoryUrl(banner.link_category_id);
        }
        return '/category';
      case 'brand':
        if (banner.link_brand_id) {
          const { data: brand } = await supabase
            .from('brands')
            .select('slug')
            .eq('id', banner.link_brand_id)
            .single();
          return brand ? `/brand/${brand.slug}` : '/brands';
        }
        return '/brands';
      case 'tag':
        return banner.link_tag ? `/tag/${banner.link_tag}` : '/tags';
      case 'custom':
        return banner.link_url || '#';
      default:
        return '#';
    }
  }

  if (loading) {
    return (
      <div className="py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 px-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (banners.length === 0) {
    return null
  }

  const GridBannerItem = ({ banner }: { banner: GridBanner }) => {
    const [link, setLink] = useState('#');
    
    useEffect(() => {
      generateLink(banner).then(setLink);
    }, [banner]);

    return (
      <Link
        href={link}
        className="block rounded-lg overflow-hidden"
      >
        {/* Desktop Image */}
        <div className="hidden md:block">
          <Image
            src={banner.image_url}
            alt={banner.title}
            width={400}
            height={0}
            className="w-full h-auto"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
            quality={90}
            style={{ height: 'auto' }}
          />
        </div>
        
        {/* Mobile Image */}
        <div className="block md:hidden">
          <Image
            src={banner.mobile_image_url || banner.image_url}
            alt={banner.title}
            width={400}
            height={0}
            className="w-full h-auto"
            sizes="50vw"
            quality={90}
            style={{ height: 'auto' }}
          />
        </div>
      </Link>
    );
  };

  return (
    <div className="py-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 px-4">
        {banners.map((banner) => (
          <GridBannerItem key={banner.id} banner={banner} />
        ))}
      </div>
    </div>
  )
} 