// Database types generated from schema.sql
export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Product, 'id' | 'created_at'>>;
      };
      categories_new: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Category, 'id' | 'created_at'>>;
      };
      brands: {
        Row: Brand;
        Insert: Omit<Brand, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Brand, 'id' | 'created_at'>>;
      };
      hero_banners: {
        Row: HeroBanner;
        Insert: Omit<HeroBanner, 'id' | 'created_at'>;
        Update: Partial<Omit<HeroBanner, 'id' | 'created_at'>>;
      };
      // Add other tables as needed
    };
  };
}

// Core product type
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_urls: string[] | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  category: string | null;
  brand: string | null;
  main_category_id: string | null;
  sub_category_id: string | null;
  brand_id: string | null;
  short_description: string | null;
  compare_price: number | null;
  sku: string | null;
  barcode: string | null;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  stock_quantity: number;
  min_stock_level: number;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_on_sale: boolean;
  category_id: string | null;
  is_bestseller: boolean;
  sales_count: number;
  product_type_id: string | null;
  is_recommended: boolean;
  is_new: boolean;
}

// Category type
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
  level: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  image_url: string | null;
}

// Brand type
export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Banner types
export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string;
  mobile_image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  background_color: string;
  text_color: string;
  button_color: string;
  sort_order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  link_type: LinkType;
  link_category_id: string | null;
  link_brand_id: string | null;
}

export interface GridBanner {
  id: string;
  title: string;
  image_url: string;
  mobile_image_url: string | null;
  link_type: LinkType;
  link_category_id: string | null;
  link_brand_id: string | null;
  link_tag: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PositionedBanner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string;
  mobile_image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  link_type: LinkType;
  link_category_id: string | null;
  link_brand_id: string | null;
  link_tag: string | null;
  background_color: string;
  text_color: string;
  button_color: string;
  position: BannerPosition;
  sort_order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

// Attribute types
export interface Attribute {
  id: string;
  name: string;
  slug: string;
  type: string;
  unit: string | null;
  is_required: boolean;
  is_filterable: boolean;
  sort_order: number;
  created_at: string;
}

export interface AttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  color_code: string | null;
  sort_order: number;
  created_at: string;
}

// Utility types
export type LinkType = 'category' | 'brand' | 'url' | 'tag' | 'custom';
export type BannerPosition = 
  | 'home_middle_1' 
  | 'home_middle_2' 
  | 'home_special' 
  | 'home_bottom_1' 
  | 'home_bottom_2';

// Extended types with relationships
export interface ProductWithRelations extends Omit<Product, 'category' | 'brand'> {
  category?: Category;
  brand?: Brand;
  attributes?: (ProductAttribute & {
    attribute: Attribute;
    attribute_value?: AttributeValue;
  })[];
}

export interface CategoryWithRelations extends Category {
  parent?: Category;
  children?: Category[];
  products?: Product[];
}

export interface ProductAttribute {
  id: string;
  product_id: string;
  attribute_id: string;
  attribute_value_id: string | null;
  custom_value: string | null;
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Filter and search types
export interface ProductFilters {
  category_id?: string;
  brand_id?: string;
  min_price?: number;
  max_price?: number;
  tags?: string[];
  is_featured?: boolean;
  is_on_sale?: boolean;
  is_bestseller?: boolean;
  is_new?: boolean;
  search?: string;
  sort_by?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'created_at_desc' | 'sales_count_desc';
}

export interface CategoryFilters {
  parent_id?: string;
  level?: number;
  is_active?: boolean;
}

// Cache types
export interface CacheMetadata {
  key: string;
  ttl: number;
  tags: string[];
  created_at: number;
  hit_count: number;
  last_accessed: number;
}

// Image processing types
export interface ImageVariant {
  width: number;
  height: number;
  format: 'webp' | 'jpeg' | 'png';
  quality: number;
  url: string;
}

export interface ProcessedImage {
  original_url: string;
  variants: ImageVariant[];
  created_at: string;
} 