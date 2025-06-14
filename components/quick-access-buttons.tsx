'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface QuickAccessButton {
  id: string;
  title: string;
  link_url: string;
  link_type: 'category' | 'brand' | 'custom' | 'tag';
  link_category_id?: string;
  link_tag?: string;
  sort_order: number;
}

export function QuickAccessButtons() {
  const [buttons, setButtons] = useState<QuickAccessButton[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchButtons();
  }, []);

  const fetchButtons = async () => {
    try {
      const { data, error } = await supabase
        .from('quick_access_buttons')
        .select('id, title, link_url, link_type, sort_order, link_category_id, link_tag')
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
      console.error('Error fetching quick access buttons:', error);
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
    <div className="w-full py-3 px-4 bg-white border-b border-gray-100">
      <div className="flex items-center overflow-x-auto scrollbar-hide gap-2 pb-1">
        {buttons.map((button, index) => (
          <div key={button.id} className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={button.link_url}
              className="flex items-center justify-center min-w-0 flex-shrink-0"
            >
              <div className="bg-pink-50 border border-pink-200 rounded-full px-4 py-2 text-sm font-medium text-pink-700 hover:bg-pink-100 transition-colors duration-200 whitespace-nowrap">
                {button.title}
              </div>
            </Link>
            
            {/* Separator dot - not after last item */}
            {index < buttons.length - 1 && (
              <div className="w-1 h-1 bg-gray-300 rounded-full flex-shrink-0"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 