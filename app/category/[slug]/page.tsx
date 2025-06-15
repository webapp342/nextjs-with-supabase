import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CacheUtils } from '@/utils/cache';
import { CacheKeys } from '@/lib/redis';
import { CategoryBanners } from '@/components/category-banners';
import { CategoryPageSections } from '@/components/category-page-sections';
import { getCategoryBreadcrumb } from '@/utils/category-helpers';

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

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const cacheKey = CacheKeys.categoryBySlug(slug);
  
  return CacheUtils.getCategory(cacheKey, async () => {
    const supabase = await createClient();
    
    const { data: categoryData, error } = await supabase
      .from('categories_new')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !categoryData) {
      return null;
    }

    return categoryData as Category;
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  
  // Fetch category data with Redis caching
  const category = await getCategoryBySlug(slug);
  
  if (!category) {
    notFound();
  }

  // Pre-fetch breadcrumb data (cached)
  const breadcrumb = await getCategoryBreadcrumb(category.id);

  return (
    <div className="w-full">
      {/* Breadcrumb Navigation */}
      {breadcrumb.length > 0 && (
        <nav className="px-4 py-2 text-sm">
          <ol className="flex items-center space-x-2 rtl:space-x-reverse">
            {breadcrumb.map((item, index) => (
              <li key={item.id} className="flex items-center">
                {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                <span className={index === breadcrumb.length - 1 ? 'font-semibold' : 'text-gray-600'}>
                  {item.name}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Category Header */}
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-right font-lalezar">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-gray-600 text-right">{category.description}</p>
        )}
      </div>

      {/* Category Banners */}
      <CategoryBanners categoryId={category.id} />

      {/* Category Page Sections */}
      <CategoryPageSections categoryId={category.id} />
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  
  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${category.name} - فروشگاه`,
    description: category.description || `Browse ${category.name} products`,
  };
} 