import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CacheUtils, CacheInvalidator } from '@/utils/cache';
import { CacheKeys } from '@/lib/redis';

// Types based on the schema
interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_urls?: string[];
  category_id?: string;
  brand_id?: string;
  is_active: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  is_recommended: boolean;
  created_at: string;
  updated_at: string;
  // Related data - these come as arrays from Supabase joins
  category?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  brand?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

interface ProductFilters {
  category_id?: string;
  brand_id?: string;
  is_featured?: boolean;
  is_bestseller?: boolean;
  is_new?: boolean;
  is_recommended?: boolean;
  min_price?: number;
  max_price?: number;
  search?: string;
  tags?: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '12')));
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Parse filters
    const filters: ProductFilters = {};
    
    const categoryId = searchParams.get('category_id');
    if (categoryId) filters.category_id = categoryId;
    
    const brandId = searchParams.get('brand_id');
    if (brandId) filters.brand_id = brandId;
    
    if (searchParams.get('is_featured') === 'true') filters.is_featured = true;
    if (searchParams.get('is_bestseller') === 'true') filters.is_bestseller = true;
    if (searchParams.get('is_new') === 'true') filters.is_new = true;
    if (searchParams.get('is_recommended') === 'true') filters.is_recommended = true;
    
    const minPrice = searchParams.get('min_price');
    if (minPrice) filters.min_price = parseFloat(minPrice);
    
    const maxPrice = searchParams.get('max_price');
    if (maxPrice) filters.max_price = parseFloat(maxPrice);
    
    const search = searchParams.get('search');
    if (search) filters.search = search;
    
    const tags = searchParams.get('tags');
    if (tags) filters.tags = tags.split(',').filter(Boolean);

    // Generate cache key based on all parameters
    const cacheKey = generateCacheKey(filters, page, pageSize, sortBy, sortOrder);
    
    // Determine cache tags for invalidation
    const cacheTags = ['products'];
    if (filters.category_id) cacheTags.push(`category:${filters.category_id}`);
    if (filters.brand_id) cacheTags.push(`brand:${filters.brand_id}`);
    
    // Get cached data or fetch from database
    const response = await CacheUtils.getProducts(
      cacheKey,
      () => fetchProducts(filters, page, pageSize, sortBy, sortOrder),
      cacheTags
    );

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=300',
        'CDN-Cache-Control': 'public, s-maxage=300',
      },
    });

  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Create new product
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
    if (!body.name || !body.price) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    // Create product with optimized data structure
    const productData = {
      name: body.name,
      description: body.description,
      short_description: body.short_description,
      price: parseFloat(body.price),
      compare_price: body.compare_price ? parseFloat(body.compare_price) : null,
      image_urls: body.image_urls || [],
      category_id: body.category_id,
      brand_id: body.brand_id,
      sku: body.sku,
      barcode: body.barcode,
      weight: body.weight ? parseFloat(body.weight) : null,
      stock_quantity: body.stock_quantity || 0,
      min_stock_level: body.min_stock_level || 0,
      tags: body.tags || [],
      seo_title: body.seo_title,
      seo_description: body.seo_description,
      is_active: body.is_active !== false,
      is_featured: body.is_featured || false,
      is_bestseller: body.is_bestseller || false,
      is_new: body.is_new || false,
      is_recommended: body.is_recommended || false,
      user_id: user.id,
    };

    const { data: product, error } = await supabase
      .from('products')
      .insert([productData])
      .select(`
        *,
        category:categories_new(id, name, slug),
        brand:brands(id, name, slug)
      `)
      .single();

    if (error) {
      console.error('Product creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    // Invalidate relevant caches
    await CacheInvalidator.invalidateProductCaches();
    if (product.category_id) {
      await CacheInvalidator.invalidateCategoryCaches(product.category_id);
    }
    if (product.brand_id) {
      await CacheInvalidator.invalidateBrandCaches(product.brand_id);
    }

    return NextResponse.json({ product }, { status: 201 });

  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// Helper function to fetch products from database
async function fetchProducts(
  filters: ProductFilters,
  page: number,
  pageSize: number,
  sortBy: string,
  sortOrder: string
): Promise<ProductsResponse> {
  const supabase = await createClient();
  
  // Build query with joins to minimize database reads
  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      short_description,
      price,
      compare_price,
      image_urls,
      category_id,
      brand_id,
      sku,
      stock_quantity,
      tags,
      is_active,
      is_featured,
      is_bestseller,
      is_new,
      is_recommended,
      created_at,
      updated_at,
      category:categories_new(id, name, slug),
      brand:brands(id, name, slug)
    `)
    .eq('is_active', true);

  // Apply filters
  if (filters.category_id) {
    query = query.eq('category_id', filters.category_id);
  }
  
  if (filters.brand_id) {
    query = query.eq('brand_id', filters.brand_id);
  }
  
  if (filters.is_featured) {
    query = query.eq('is_featured', true);
  }
  
  if (filters.is_bestseller) {
    query = query.eq('is_bestseller', true);
  }
  
  if (filters.is_new) {
    query = query.eq('is_new', true);
  }
  
  if (filters.is_recommended) {
    query = query.eq('is_recommended', true);
  }
  
  if (filters.min_price) {
    query = query.gte('price', filters.min_price);
  }
  
  if (filters.max_price) {
    query = query.lte('price', filters.max_price);
  }
  
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  
  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }

  // Get total count for pagination
  const countQuery = supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
    
  // Apply same filters to count query
  if (filters.category_id) {
    countQuery.eq('category_id', filters.category_id);
  }
  if (filters.brand_id) {
    countQuery.eq('brand_id', filters.brand_id);
  }
  if (filters.is_featured) {
    countQuery.eq('is_featured', true);
  }
  if (filters.is_bestseller) {
    countQuery.eq('is_bestseller', true);
  }
  if (filters.is_new) {
    countQuery.eq('is_new', true);
  }
  if (filters.is_recommended) {
    countQuery.eq('is_recommended', true);
  }
  if (filters.min_price) {
    countQuery.gte('price', filters.min_price);
  }
  if (filters.max_price) {
    countQuery.lte('price', filters.max_price);
  }
  if (filters.search) {
    countQuery.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  if (filters.tags && filters.tags.length > 0) {
    countQuery.overlaps('tags', filters.tags);
  }
  
  const { count: totalCount } = await countQuery;

  // Apply sorting and pagination
  const sortColumn = sortBy === 'price' ? 'price' : 
                    sortBy === 'name' ? 'name' : 'created_at';
  const ascending = sortOrder === 'asc';
  
  query = query
    .order(sortColumn, { ascending })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data: products, error } = await query;

  if (error) {
    console.error('Database query error:', error);
    throw new Error('Failed to fetch products');
  }

  const totalPages = Math.ceil((totalCount || 0) / pageSize);
  const hasMore = page < totalPages;

  return {
    products: products || [],
    total: totalCount || 0,
    page,
    pageSize,
    totalPages,
    hasMore,
  };
}

// Generate cache key for consistent caching
function generateCacheKey(
  filters: ProductFilters,
  page: number,
  pageSize: number,
  sortBy: string,
  sortOrder: string
): string {
  const filterString = JSON.stringify(filters);
  const params = `${filterString}-${page}-${pageSize}-${sortBy}-${sortOrder}`;
  return CacheKeys.products(Buffer.from(params).toString('base64'));
}

// Specialized endpoints for common queries
export async function getSpecialProducts(type: 'featured' | 'bestseller' | 'new' | 'recommended') {
  const cacheKey = type === 'featured' ? CacheKeys.featuredProducts() :
                   type === 'bestseller' ? CacheKeys.bestsellerProducts() :
                   type === 'new' ? CacheKeys.newProducts() :
                   CacheKeys.recommendedProducts();

  return CacheUtils.getProducts(
    cacheKey,
    async () => {
      const supabase = await createClient();
      
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          short_description,
          price,
          compare_price,
          image_urls,
          category_id,
          brand_id,
          created_at,
          category:categories_new(id, name, slug),
          brand:brands(id, name, slug)
        `)
        .eq('is_active', true)
        .eq(`is_${type}`, true)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) {
        console.error(`Error fetching ${type} products:`, error);
        throw new Error(`Failed to fetch ${type} products`);
      }

      return products || [];
    },
    [`products`, `products:${type}`]
  );
} 