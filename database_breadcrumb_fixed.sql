-- ====================================
-- BREADCRUMB SİSTEMİ İÇİN DATABASE GÜNCELLEMELERİ (DÜZELTİLMİŞ)
-- ====================================

-- 1. Ürün çeşitleri tablosu (Brand altında kategoriler için)
CREATE TABLE IF NOT EXISTS product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories_new(id) ON DELETE CASCADE, -- Hangi kategoride gösterileceği
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(brand_id, slug)
);

-- 2. Products tablosuna product_type_id ekle
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type_id UUID REFERENCES product_types(id);

-- 3. Index'ler
CREATE INDEX IF NOT EXISTS idx_product_types_brand_id ON product_types(brand_id);
CREATE INDEX IF NOT EXISTS idx_product_types_category_id ON product_types(category_id);
CREATE INDEX IF NOT EXISTS idx_product_types_slug ON product_types(slug);
CREATE INDEX IF NOT EXISTS idx_products_product_type_id ON products(product_type_id);

-- 4. Örnek ürün çeşitleri ekle (sadece yoksa)
INSERT INTO product_types (name, slug, brand_id, category_id, sort_order)
SELECT 
  'فونداسیون مایع', 
  'liquid-foundation',
  b.id,
  c.id,
  1
FROM brands b, categories_new c
WHERE b.slug = 'maybelline' 
  AND c.slug = 'foundation'
  AND NOT EXISTS (
    SELECT 1 FROM product_types 
    WHERE slug = 'liquid-foundation' AND brand_id = b.id
  )
LIMIT 1;

INSERT INTO product_types (name, slug, brand_id, category_id, sort_order)
SELECT 
  'فونداسیون کرمی', 
  'cream-foundation',
  b.id,
  c.id,
  2
FROM brands b, categories_new c
WHERE b.slug = 'maybelline' 
  AND c.slug = 'foundation'
  AND NOT EXISTS (
    SELECT 1 FROM product_types 
    WHERE slug = 'cream-foundation' AND brand_id = b.id
  )
LIMIT 1;

INSERT INTO product_types (name, slug, brand_id, category_id, sort_order)
SELECT 
  'ریمل حجم دهنده', 
  'volumizing-mascara',
  b.id,
  c.id,
  1
FROM brands b, categories_new c
WHERE b.slug = 'maybelline' 
  AND c.slug = 'mascara'
  AND NOT EXISTS (
    SELECT 1 FROM product_types 
    WHERE slug = 'volumizing-mascara' AND brand_id = b.id
  )
LIMIT 1;

INSERT INTO product_types (name, slug, brand_id, category_id, sort_order)
SELECT 
  'ریمل ضد آب', 
  'waterproof-mascara',
  b.id,
  c.id,
  2
FROM brands b, categories_new c
WHERE b.slug = 'maybelline' 
  AND c.slug = 'mascara'
  AND NOT EXISTS (
    SELECT 1 FROM product_types 
    WHERE slug = 'waterproof-mascara' AND brand_id = b.id
  )
LIMIT 1;

-- L'Oréal için ürün çeşitleri
INSERT INTO product_types (name, slug, brand_id, category_id, sort_order)
SELECT 
  'رژ لب مایع', 
  'liquid-lipstick',
  b.id,
  c.id,
  1
FROM brands b, categories_new c
WHERE b.slug = 'loreal' 
  AND c.slug = 'lipstick'
  AND NOT EXISTS (
    SELECT 1 FROM product_types 
    WHERE slug = 'liquid-lipstick' AND brand_id = b.id
  )
LIMIT 1;

INSERT INTO product_types (name, slug, brand_id, category_id, sort_order)
SELECT 
  'رژ لب مات', 
  'matte-lipstick',
  b.id,
  c.id,
  2
FROM brands b, categories_new c
WHERE b.slug = 'loreal' 
  AND c.slug = 'lipstick'
  AND NOT EXISTS (
    SELECT 1 FROM product_types 
    WHERE slug = 'matte-lipstick' AND brand_id = b.id
  )
LIMIT 1;

-- MAC için ürün çeşitleri
INSERT INTO product_types (name, slug, brand_id, category_id, sort_order)
SELECT 
  'فونداسیون حرفه‌ای', 
  'professional-foundation',
  b.id,
  c.id,
  1
FROM brands b, categories_new c
WHERE b.slug = 'mac' 
  AND c.slug = 'foundation'
  AND NOT EXISTS (
    SELECT 1 FROM product_types 
    WHERE slug = 'professional-foundation' AND brand_id = b.id
  )
LIMIT 1;

-- 5. View for breadcrumb data (DÜZELTİLMİŞ - product slug çıkarıldı)
CREATE OR REPLACE VIEW breadcrumb_data AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  
  -- Brand bilgileri
  b.id as brand_id,
  b.name as brand_name,
  b.slug as brand_slug,
  
  -- Product type bilgileri
  pt.id as product_type_id,
  pt.name as product_type_name,
  pt.slug as product_type_slug,
  
  -- Kategori hiyerarşisi (en derin kategoriden başlayarak)
  c.id as category_id,
  c.name as category_name,
  c.slug as category_slug,
  c.level as category_level,
  c.parent_id as category_parent_id,
  
  -- Parent kategori bilgileri
  c2.id as parent_category_id,
  c2.name as parent_category_name,
  c2.slug as parent_category_slug,
  c2.level as parent_category_level,
  c2.parent_id as parent_category_parent_id,
  
  -- Grandparent kategori bilgileri
  c3.id as grandparent_category_id,
  c3.name as grandparent_category_name,
  c3.slug as grandparent_category_slug,
  c3.level as grandparent_category_level

FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_types pt ON p.product_type_id = pt.id
LEFT JOIN categories_new c ON p.category_id = c.id
LEFT JOIN categories_new c2 ON c.parent_id = c2.id
LEFT JOIN categories_new c3 ON c2.parent_id = c3.id
WHERE p.is_active = true;

-- Database güncellemesi tamamlandı!
SELECT 'Breadcrumb sistemi için database başarıyla güncellendi!' as status; 