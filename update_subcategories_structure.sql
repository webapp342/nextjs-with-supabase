-- Update database structure for brand-independent sub-categories
-- This script migrates from brand-specific product_types to brand-independent sub_categories

-- 1. Create new sub_categories table
CREATE TABLE IF NOT EXISTS sub_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  parent_category_id UUID REFERENCES categories_new(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sub_categories_parent_category ON sub_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_sub_categories_slug ON sub_categories(slug);
CREATE INDEX IF NOT EXISTS idx_sub_categories_active ON sub_categories(is_active);

-- 3. Migrate existing product_types to sub_categories (removing brand dependency)
INSERT INTO sub_categories (name, slug, parent_category_id, is_active, sort_order)
SELECT DISTINCT 
  pt.name,
  pt.slug,
  pt.category_id as parent_category_id,
  pt.is_active,
  pt.sort_order
FROM product_types pt
WHERE NOT EXISTS (
  SELECT 1 FROM sub_categories sc 
  WHERE sc.slug = pt.slug AND sc.parent_category_id = pt.category_id
);

-- 4. Update products table to use sub_category_id instead of product_type_id
ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_category_id UUID REFERENCES sub_categories(id);

-- 5. Migrate product relationships
UPDATE products 
SET sub_category_id = (
  SELECT sc.id 
  FROM sub_categories sc
  JOIN product_types pt ON pt.slug = sc.slug AND pt.category_id = sc.parent_category_id
  WHERE pt.id = products.product_type_id
  LIMIT 1
)
WHERE product_type_id IS NOT NULL;

-- 6. Add some common sub-categories for testing
INSERT INTO sub_categories (name, slug, parent_category_id, is_active) 
SELECT 
  'Perfume for Women' as name,
  'perfume-for-women' as slug,
  c.id as parent_category_id,
  true as is_active
FROM categories_new c 
WHERE c.name ILIKE '%عطر%' OR c.name ILIKE '%fragrance%'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO sub_categories (name, slug, parent_category_id, is_active) 
SELECT 
  'Men''s Cologne' as name,
  'mens-cologne' as slug,
  c.id as parent_category_id,
  true as is_active
FROM categories_new c 
WHERE c.name ILIKE '%عطر%' OR c.name ILIKE '%fragrance%'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO sub_categories (name, slug, parent_category_id, is_active) 
SELECT 
  'Vitamin Capsules' as name,
  'vitamin-capsules' as slug,
  c.id as parent_category_id,
  true as is_active
FROM categories_new c 
WHERE c.name ILIKE '%ویتامین%' OR c.name ILIKE '%vitamin%'
ON CONFLICT (slug) DO NOTHING;

-- 7. Verify the migration
SELECT 
  'Migration Summary' as info,
  (SELECT COUNT(*) FROM sub_categories) as sub_categories_count,
  (SELECT COUNT(*) FROM products WHERE sub_category_id IS NOT NULL) as products_with_subcategory;

-- 8. Show sample data
SELECT 
  sc.name as sub_category_name,
  sc.slug as sub_category_slug,
  c.name as parent_category_name,
  COUNT(p.id) as products_count
FROM sub_categories sc
LEFT JOIN categories_new c ON sc.parent_category_id = c.id
LEFT JOIN products p ON p.sub_category_id = sc.id
GROUP BY sc.id, sc.name, sc.slug, c.name
ORDER BY sc.name; 