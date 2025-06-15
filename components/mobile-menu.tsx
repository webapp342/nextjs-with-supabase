'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image_url?: string;
  parent_id?: string;
  level: number;
  sort_order: number;
  is_active: boolean;
}

// Beautiful modern icons for categories
const categoryIcons: { [key: string]: string } = {
  // Beauty & Cosmetics
  'cosmetics': '💄',
  'makeup': '💋',
  'skincare': '🧴',
  'perfumes': '🌸',
  'beauty': '✨',
  
  // Personal Care
  'personal-hygiene': '🧼',
  'hair-care': '💇‍♀️',
  'oral-care': '🦷',
  'body-care': '🛁',
  
  // Fashion & Accessories
  'fashion': '👗',
  'clothing': '👕',
  'accessories': '👜',
  'jewelry': '💍',
  'watches': '⌚',
  
  // Health & Wellness
  'supplements': '💊',
  'vitamins': '🌿',
  'health': '❤️',
  'fitness': '🏋️‍♀️',
  
  // Electronics & Digital
  'electronics': '📱',
  'digital': '💻',
  'gadgets': '🔌',
  'tech': '⚡',
  
  // Home & Living
  'home': '🏠',
  'kitchen': '🍳',
  'decor': '🕯️',
  'furniture': '🛋️',
  
  // Food & Beverages
  'food': '🍎',
  'beverages': '🥤',
  'snacks': '🍿',
  'organic': '🌱',
  
  // Baby & Kids
  'baby': '👶',
  'kids': '🧸',
  'toys': '🎮',
  'education': '📚',
  
  // Sports & Outdoor
  'sports': '⚽',
  'outdoor': '🏕️',
  'fitness-equipment': '🏃‍♂️',
  
  // Brands & Special
  'brands': '🏷️',
  'special-offers': '⭐',
  'new-arrivals': '🆕',
  'bestsellers': '🔥',
  'sale': '💥',
  
  // Magazines & Media
  'magazine': '📖',
  'books': '📚',
  'media': '🎬',
  
  // Default fallback
  'default': '🛍️'
};

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories_new')
        .select('*')
        .eq('is_active', true)
        .eq('level', 0) // Only main categories for the menu
        .order('sort_order, name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to static categories if database fails
      setCategories([
        { id: '1', name: 'آرایشی', slug: 'cosmetics', level: 0, sort_order: 1, is_active: true },
        { id: '2', name: 'برندها', slug: 'brands', level: 0, sort_order: 2, is_active: true },
        { id: '3', name: 'پیشنهاد ویژه', slug: 'special-offers', level: 0, sort_order: 3, is_active: true },
        { id: '4', name: 'مراقبت پوست', slug: 'skincare', level: 0, sort_order: 4, is_active: true },
        { id: '5', name: 'بهداشت شخصی', slug: 'personal-hygiene', level: 0, sort_order: 5, is_active: true },
        { id: '6', name: 'مراقبت و زیبایی مو', slug: 'hair-care', level: 0, sort_order: 6, is_active: true },
        { id: '7', name: 'لوازم برقی', slug: 'electronics', level: 0, sort_order: 7, is_active: true },
        { id: '8', name: 'عطر و اسپری', slug: 'perfumes', level: 0, sort_order: 8, is_active: true },
        { id: '9', name: 'مد و پوشاک', slug: 'fashion', level: 0, sort_order: 9, is_active: true },
        { id: '10', name: 'مکمل غذایی و ورزشی', slug: 'supplements', level: 0, sort_order: 10, is_active: true },
        { id: '11', name: 'طلا و نقره', slug: 'jewelry', level: 0, sort_order: 11, is_active: true },
        { id: '12', name: 'کالای دیجیتال', slug: 'digital', level: 0, sort_order: 12, is_active: true }
      ]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);



  const getIconForCategory = (slug: string, icon?: string): string => {
    if (icon) return icon;
    return categoryIcons[slug] || categoryIcons['default'];
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        className="md:hidden hover:bg-gray-100 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-50 md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[90vw] max-w-sm bg-white shadow-xl transform transition-all duration-300 ease-out z-50 md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="relative flex items-center justify-center p-6 bg-white border-b border-gray-100">
            <Button
              variant="ghost"
              size="icon"
              onClick={closeMenu}
              className="absolute left-4 text-gray-600 hover:bg-gray-100"
              aria-label="Close menu"
            >
              <X size={20} />
            </Button>
            <h2 className="text-xl text-center text-gray-800 font-lalezar">دسته‌بندی‌ها</h2>
          </div>

          {/* Categories Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded mx-auto w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    onClick={closeMenu}
                    className="group"
                  >
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-300">
                      <div className="flex flex-col items-center text-center">
                        {category.image_url ? (
                          <div className="w-16 h-16 mb-3 rounded-lg overflow-hidden">
                            <Image
                              src={category.image_url}
                              alt={category.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-gray-100 transition-colors duration-300">
                            <span className="text-2xl">
                              {getIconForCategory(category.slug, category.icon)}
                            </span>
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-700 leading-tight font-lalezar">
                          {category.name}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 