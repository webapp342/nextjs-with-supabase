'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';

interface TopBrand {
  id: string;
  title: string;
  image_url: string;
  brand_id: string;
  link_type: 'category' | 'brand' | 'url' | 'tag';
  link_category_id?: string;
  link_brand_id?: string;
  link_url?: string;
  link_tag?: string;
  sort_order: number;
  brand: {
    id: string;
    name: string;
    slug: string;
  };
  finalUrl?: string;
}

export function TopBrands() {
  const [brands, setBrands] = useState<TopBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const fetchBrands = async () => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('top_brands')
        .select(`
          id,
          title,
          image_url,
          brand_id,
          link_type,
          link_category_id,
          link_brand_id,
          link_url,
          link_tag,
          sort_order,
          brands!top_brands_brand_id_fkey(id, name, slug)
        `)
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching top brands:', error);
        // If table doesn't exist, just return silently
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('top_brands table does not exist yet.');
          setBrands([]);
          return;
        }
        throw error;
      }

      // Transform the data to match our interface
      const transformedData = (data || []).map(item => ({
        ...item,
        brand: Array.isArray(item.brands) ? item.brands[0] : item.brands
      }));

      // Build correct URLs for each brand based on link_type
      const brandsWithUrls = await Promise.all(
        transformedData.map(async (brand) => {
          let finalUrl = brand.link_url || `/brand/${brand.brand?.slug || ''}`;

          switch (brand.link_type) {
            case 'category':
              if (brand.link_category_id) {
                finalUrl = await buildCategoryUrl(brand.link_category_id);
              }
              break;
            case 'brand':
              if (brand.link_brand_id) {
                // Get the target brand info
                const { data: targetBrand } = await supabase
                  .from('brands')
                  .select('slug')
                  .eq('id', brand.link_brand_id)
                  .single();
                
                if (targetBrand) {
                  finalUrl = `/brand/${targetBrand.slug}`;
                }
              } else {
                // Default to the brand itself
                finalUrl = `/brand/${brand.brand?.slug || ''}`;
              }
              break;
            case 'tag':
              if (brand.link_tag) {
                finalUrl = `/tags/${brand.link_tag}`;
              }
              break;
            case 'url':
              finalUrl = brand.link_url || '#';
              break;
            default:
              finalUrl = `/brand/${brand.brand?.slug || ''}`;
          }

          return { ...brand, finalUrl };
        })
      );

      setBrands(brandsWithUrls as TopBrand[]);
    } catch (error) {
      console.error('Error fetching top brands:', error);
      setError('En iyi markalar yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || brands.length === 0 || error) {
    return null;
  }

  return (
    <div className="w-full py-8 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl text-right mb-8 text-gray-800 font-lalezar">
          برندهای برتر
        </h2>
        
        <div className="grid grid-cols-4 gap-6">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={brand.finalUrl || '#'}
              className="flex flex-col items-center"
            >
              <div className="relative w-20 h-20 md:w-24 md:h-24">
                <Image
                  src={brand.image_url}
                  alt={brand.title}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <span className="text-sm text-gray-700 mt-3 text-center font-lalezar">
                {brand.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 