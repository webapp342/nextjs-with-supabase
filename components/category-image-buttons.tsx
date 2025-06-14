'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';

interface CategoryImageButton {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  link_type: 'category' | 'brand' | 'custom' | 'tag';
  link_category_id?: string;
  sort_order: number;
}

export function CategoryImageButtons() {
  const [buttons, setButtons] = useState<CategoryImageButton[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchButtons();
  }, []);

  const fetchButtons = async () => {
    try {
      const { data, error } = await supabase
        .from('category_image_buttons')
        .select('id, title, image_url, link_url, link_type, sort_order, link_category_id')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      // For category buttons, rebuild URLs to ensure they're hierarchical
      const buttonsWithUrls = await Promise.all(
        (data || []).map(async (button) => {
          if (button.link_type === 'category' && button.link_category_id) {
            const hierarchicalUrl = await buildCategoryUrl(button.link_category_id);
            return { ...button, link_url: hierarchicalUrl };
          }
          return button;
        })
      );

      setButtons(buttonsWithUrls);
    } catch (error) {
      console.error('Error fetching category image buttons:', error);
    } finally {
      setLoading(false);
    }
  };

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
          .select('id, slug, parent_id')
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

  if (loading || buttons.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-4 px-4 bg-white">
      <div className="flex items-center overflow-x-auto scrollbar-hide gap-4 pb-2">
        {buttons.map((button) => (
          <Link
            key={button.id}
            href={button.link_url}
            className="flex flex-col items-center gap-2 flex-shrink-0 min-w-[80px]"
          >
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-pink-50 border-2 border-pink-200 hover:border-pink-300 transition-colors duration-200">
              <Image
                src={button.image_url}
                alt={button.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <span className="text-xs text-center text-gray-700 font-medium leading-tight max-w-[80px] line-clamp-2">
              {button.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
} 