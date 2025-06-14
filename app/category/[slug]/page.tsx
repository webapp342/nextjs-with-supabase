'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CategoryBanners } from '@/components/category-banners';
import { CategoryPageSections } from '@/components/category-page-sections';

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
  
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    const fetchCategory = async () => {
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

      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
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
    <div className="w-full">
      {/* Category Banners */}
      <CategoryBanners categoryId={category.id} />

      {/* Category Page Sections */}
        <CategoryPageSections categoryId={category.id} />
    </div>
  );
} 