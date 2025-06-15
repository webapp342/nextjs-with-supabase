import { createClient } from '@/lib/supabase/server';
import { CacheUtils } from '@/utils/cache';
import { CacheKeys } from '@/lib/redis';

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
  level: number;
}

// Get category breadcrumb trail
export async function getCategoryBreadcrumb(categoryId: string): Promise<Category[]> {
  const cacheKey = `${CacheKeys.category(categoryId)}:breadcrumb`;
  
  return CacheUtils.getCategory(cacheKey, async () => {
    const supabase = await createClient();
    const breadcrumb: Category[] = [];
    let currentCategoryId: string | null = categoryId;

    while (currentCategoryId) {
      const { data: categoryRowData, error } = await supabase
        .from('categories_new')
        .select('id, name, slug, parent_id, level')
        .eq('id', currentCategoryId)
        .single();

      const categoryRow = categoryRowData as unknown as Category;

      if (error || !categoryRow) {
        break;
      }

      breadcrumb.unshift(categoryRow);
      currentCategoryId = categoryRow.parent_id ?? null;
    }

    return breadcrumb;
  });
} 