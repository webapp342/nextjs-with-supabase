import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CacheUtils, CacheInvalidator } from '@/utils/cache';
import { CacheKeys } from '@/lib/redis';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image_url?: string;
  parent_id?: string;
  level: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: Category[];
  parent?: Category;
  product_count?: number;
}

interface CategoriesResponse {
  categories: Category[];
  hierarchy: Category[];
  breadcrumb?: Category[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHierarchy = searchParams.get('hierarchy') === 'true';
    const parentId = searchParams.get('parent_id');
    const slug = searchParams.get('slug');
    const includeProductCount = searchParams.get('include_count') === 'true';

    // If requesting a specific category by slug
    if (slug) {
      const category = await getCategoryBySlug(slug);
      return NextResponse.json({ category }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    // Generate cache key based on parameters
    const cacheKey = generateCategoryCacheKey(parentId, includeHierarchy, includeProductCount);

    // Get categories from cache or database
    const response = await CacheUtils.getCategories(
      cacheKey,
      async (): Promise<CategoriesResponse> => {
        const supabase = await createClient();

        if (includeHierarchy) {
          // Fetch all categories and build hierarchy
          const { data: allCategories, error } = await supabase
            .from('categories_new')
            .select(
              'id,name,slug,description,icon,image_url,parent_id,level,sort_order,is_active,created_at,updated_at' +
                (includeProductCount ? ', product_count:products(count)' : '')
            )
            .eq('is_active', true)
            .order('level')
            .order('sort_order', { ascending: true });

          if (error) {
            console.error('Categories fetch error:', error);
            throw new Error('Failed to fetch categories');
          }

          const hierarchy = buildCategoryHierarchy((allCategories as unknown as Category[]) || []);
          
          return {
            categories: (allCategories as unknown as Category[]) || [],
            hierarchy,
          };
        } else {
          // Fetch categories by parent_id
          let query = supabase
            .from('categories_new')
            .select(
              'id,name,slug,description,icon,image_url,parent_id,level,sort_order,is_active,created_at,updated_at' +
                (includeProductCount ? ', product_count:products(count)' : '')
            )
            .eq('is_active', true);

          if (parentId) {
            query = query.eq('parent_id', parentId);
          } else {
            query = query.is('parent_id', null);
          }

          query = query.order('sort_order', { ascending: true });

          const { data: categories, error } = await query;

          if (error) {
            console.error('Categories fetch error:', error);
            throw new Error('Failed to fetch categories');
          }

          return {
            categories: (categories as unknown as Category[]) || [],
            hierarchy: [],
          };
        }
      }
    );

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'CDN-Cache-Control': 'public, s-maxage=600',
      },
    });

  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Calculate level based on parent
    let level = 0;
    if (body.parent_id) {
      const { data: parentCategory, error: parentError } = await supabase
        .from('categories_new')
        .select('level')
        .eq('id', body.parent_id)
        .single();

      if (parentError) {
        return NextResponse.json(
          { error: 'Invalid parent category' },
          { status: 400 }
        );
      }

      level = (parentCategory?.level || 0) + 1;
    }

    // Create category
    const categoryData = {
      name: body.name,
      slug: body.slug,
      description: body.description,
      icon: body.icon,
      image_url: body.image_url,
      parent_id: body.parent_id || null,
      level,
      sort_order: body.sort_order || 0,
      is_active: body.is_active !== false,
    };

    const { data: category, error } = await supabase
      .from('categories_new')
      .insert([categoryData])
      .select()
      .single();

    if (error) {
      console.error('Category creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      );
    }

    // Invalidate category caches
    await CacheInvalidator.invalidateCategoryCaches();

    return NextResponse.json({ category }, { status: 201 });

  } catch (error) {
    console.error('Category creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

// Helper function to get category by slug
async function getCategoryBySlug(slug: string): Promise<Category | null> {
  // Generate cache key
  // const cacheKey = CacheKeys.categoryBySlug(slug);
  
  return CacheUtils.getCategory(
    `slug:${slug}`,
    async () => {
      const supabase = await createClient();
      
      const { data: categoryData, error } = await supabase
        .from('categories_new')
        .select(`
          *,
          parent:categories_new!parent_id(id, name, slug),
          children:categories_new!parent_id(id, name, slug),
          product_count:products(count)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error || !categoryData) {
        return null;
      }

      // Add parent category if exists
      const category = categoryData as unknown as Category;

      if (category.parent_id && category.parent) {
        const { data: parentCategory } = await supabase
          .from('categories_new')
          .select('*')
          .eq('id', category.parent_id)
          .single();
          
        if (parentCategory) {
          category.parent = parentCategory;
        }
      }

      // Add children categories
      const { data: children } = await supabase
        .from('categories_new')
        .select('*')
        .eq('parent_id', category.id)
        .eq('is_active', true);
        
      if (children) {
        category.children = children;
      }

      return category;
    }
  );
}

// Helper function to build category hierarchy
function buildCategoryHierarchy(categories: Category[]): Category[] {
  const categoryMap = new Map<string, Category>();
  const rootCategories: Category[] = [];

  // Create a map of all categories
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Build the hierarchy
  categories.forEach(category => {
    const categoryWithChildren = categoryMap.get(category.id)!;
    
    if (category.parent_id) {
      const parent = categoryMap.get(category.parent_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(categoryWithChildren);
      }
    } else {
      rootCategories.push(categoryWithChildren);
    }
  });

  // Sort children by sort_order
  const sortChildren = (categories: Category[]) => {
    categories.forEach(category => {
      if (category.children && category.children.length > 0) {
        category.children.sort((a, b) => a.sort_order - b.sort_order);
        sortChildren(category.children);
      }
    });
  };

  sortChildren(rootCategories);
  return rootCategories.sort((a, b) => a.sort_order - b.sort_order);
}

// Helper function to generate cache key
function generateCategoryCacheKey(
  parentId?: string | null,
  includeHierarchy?: boolean,
  includeProductCount?: boolean
): string {
  const params = [
    parentId ? `parent:${parentId}` : 'root',
    includeHierarchy ? 'hierarchy' : 'flat',
    includeProductCount ? 'with_count' : 'no_count'
  ].join(':');
  
  return CacheKeys.categories() + ':' + params;
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