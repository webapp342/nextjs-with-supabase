-- ====================================
-- TÜM ESKİ SİSTEMİ TEMİZLE
-- ====================================

-- Önce tüm eski tabloları ve bağımlılıkları temizleyelim
DROP TABLE IF EXISTS product_attributes CASCADE;
DROP TABLE IF EXISTS attribute_values CASCADE;
DROP TABLE IF EXISTS attributes CASCADE;
DROP TABLE IF EXISTS category_banners CASCADE;
DROP TABLE IF EXISTS categories_new CASCADE;
DROP TABLE IF EXISTS sub_categories CASCADE;
DROP TABLE IF EXISTS main_categories CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS attribute_categories CASCADE;

-- ====================================
-- TÜM SİSTEMİ YENİDEN KURMA
-- ====================================

-- Yeni kategoriler tablosu (unlimited depth için)
CREATE TABLE categories_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  parent_id UUID REFERENCES categories_new(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 0, -- 0=ana, 1=alt, 2=alt-alt, vs.
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Banner'lar tablosu 
CREATE TABLE category_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories_new(id) ON DELETE CASCADE, -- NULL ise ana sayfa banner'ı
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  description TEXT,
  image_url TEXT,
  link_category_id UUID REFERENCES categories_new(id) ON DELETE SET NULL, -- Hangi kategoriye yönlendireceği
  background_color VARCHAR(7) DEFAULT '#ffffff',
  text_color VARCHAR(7) DEFAULT '#000000',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products tablosuna yeni category_id ekle
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories_new(id);

-- Ana kategorileri ekle (sadece yoksa)
INSERT INTO categories_new (name, slug, icon, level, sort_order, is_active)
SELECT 'آرایش', 'makeup', '💄', 0, 1, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'makeup');

INSERT INTO categories_new (name, slug, icon, level, sort_order, is_active)
SELECT 'مراقبت از پوست', 'skincare', '🧴', 0, 2, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'skincare');

INSERT INTO categories_new (name, slug, icon, level, sort_order, is_active)
SELECT 'مراقبت از مو', 'haircare', '💇‍♀️', 0, 3, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'haircare');

INSERT INTO categories_new (name, slug, icon, level, sort_order, is_active)
SELECT 'عطر و ادکلن', 'fragrance', '🌸', 0, 4, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'fragrance');

INSERT INTO categories_new (name, slug, icon, level, sort_order, is_active)
SELECT 'لوازم آرایش', 'tools', '🖌️', 0, 5, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'tools');

INSERT INTO categories_new (name, slug, icon, level, sort_order, is_active)
SELECT 'مراقبت از بدن', 'bodycare', '🧼', 0, 6, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'bodycare');

INSERT INTO categories_new (name, slug, icon, level, sort_order, is_active)
SELECT 'مراقبت از ناخن', 'nailcare', '💅', 0, 7, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'nailcare');

INSERT INTO categories_new (name, slug, icon, level, sort_order, is_active)
SELECT 'لوازم شخصی', 'personal-care', '🪞', 0, 8, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'personal-care');

INSERT INTO categories_new (name, slug, icon, level, sort_order, is_active)
SELECT 'کودک و نوزاد', 'baby', '👶', 0, 9, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'baby');

-- Alt kategoriler - Makeup
INSERT INTO categories_new (name, slug, parent_id, level, sort_order, is_active)
SELECT 'کرم پودر', 'foundation', (SELECT id FROM categories_new WHERE slug = 'makeup' LIMIT 1), 1, 1, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'foundation');

INSERT INTO categories_new (name, slug, parent_id, level, sort_order, is_active)
SELECT 'ریمل', 'mascara', (SELECT id FROM categories_new WHERE slug = 'makeup' LIMIT 1), 1, 2, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'mascara');

INSERT INTO categories_new (name, slug, parent_id, level, sort_order, is_active)
SELECT 'رژ لب', 'lipstick', (SELECT id FROM categories_new WHERE slug = 'makeup' LIMIT 1), 1, 3, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'lipstick');

-- Alt kategoriler - Fragrance 
INSERT INTO categories_new (name, slug, parent_id, level, sort_order, is_active)
SELECT 'بادی اسپلش', 'body-splash', (SELECT id FROM categories_new WHERE slug = 'fragrance' LIMIT 1), 1, 1, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'body-splash');

INSERT INTO categories_new (name, slug, parent_id, level, sort_order, is_active)
SELECT 'ادو پرفیوم', 'eau-de-parfum', (SELECT id FROM categories_new WHERE slug = 'fragrance' LIMIT 1), 1, 2, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'eau-de-parfum');

INSERT INTO categories_new (name, slug, parent_id, level, sort_order, is_active)
SELECT 'ادو تویلت', 'eau-de-toilette', (SELECT id FROM categories_new WHERE slug = 'fragrance' LIMIT 1), 1, 3, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'eau-de-toilette');

-- Banner'lar
INSERT INTO category_banners (category_id, title, subtitle, image_url, link_category_id, background_color, text_color, sort_order)
SELECT NULL, 'عطر و ادکلن', 'بهترین برندهای جهان', 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800', 
 (SELECT id FROM categories_new WHERE slug = 'fragrance' LIMIT 1), '#f8f9fa', '#212529', 1
WHERE NOT EXISTS (SELECT 1 FROM category_banners WHERE title = 'عطر و ادکلن');

INSERT INTO category_banners (category_id, title, subtitle, image_url, link_category_id, background_color, text_color, sort_order)
SELECT 
  (SELECT id FROM categories_new WHERE slug = 'fragrance' LIMIT 1), 
  'بادی اسپلش', 
  'عطرهای سبک و خنک', 
  'https://images.unsplash.com/photo-1588405748880-12d1d2a59d32?w=800',
  (SELECT id FROM categories_new WHERE slug = 'body-splash' LIMIT 1), '#e3f2fd', '#1565c0', 1
WHERE NOT EXISTS (SELECT 1 FROM category_banners WHERE title = 'بادی اسپلش');

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories_new(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories_new(slug);
CREATE INDEX IF NOT EXISTS idx_categories_level ON categories_new(level);
CREATE INDEX IF NOT EXISTS idx_category_banners_category_id ON category_banners(category_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Brands tablosu (eğer yoksa)
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Popüler markalar (sadece yoksa ekle)
INSERT INTO brands (name, slug, description, is_active)
SELECT 'Maybelline', 'maybelline', 'آمریکایی برند آرایشی', true
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE slug = 'maybelline');

INSERT INTO brands (name, slug, description, is_active)
SELECT 'L''Oréal', 'loreal', 'برند فرانسوی آرایشی', true
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE slug = 'loreal');

INSERT INTO brands (name, slug, description, is_active)
SELECT 'MAC', 'mac', 'برند حرفه‌ای آرایشی', true
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE slug = 'mac');

INSERT INTO brands (name, slug, description, is_active)
SELECT 'Urban Decay', 'urban-decay', 'آمریکایی برند آرایشی', true
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE slug = 'urban-decay');

INSERT INTO brands (name, slug, description, is_active)
SELECT 'NARS', 'nars', 'فرانسوی برند آرایشی', true
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE slug = 'nars');

-- Products tablosuna brand_id ekle (eğer yoksa)
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);

-- Attribute system
CREATE TABLE IF NOT EXISTS attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'text', -- text, number, select, multiselect, color
  unit VARCHAR(50),
  is_required BOOLEAN DEFAULT false,
  is_filterable BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attribute_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id UUID REFERENCES attributes(id) ON DELETE CASCADE,
  value VARCHAR(255) NOT NULL,
  color_code VARCHAR(7), -- Renk kodları için
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  attribute_id UUID REFERENCES attributes(id) ON DELETE CASCADE,
  attribute_value_id UUID REFERENCES attribute_values(id) ON DELETE CASCADE,
  custom_value TEXT, -- Özel değerler için
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, attribute_id, attribute_value_id)
);

-- Temel attributes ekle
INSERT INTO attributes (name, slug, type, is_filterable)
SELECT 'رنگ', 'color', 'color', true
WHERE NOT EXISTS (SELECT 1 FROM attributes WHERE slug = 'color');

INSERT INTO attributes (name, slug, type, is_filterable)
SELECT 'سایز', 'size', 'select', true
WHERE NOT EXISTS (SELECT 1 FROM attributes WHERE slug = 'size');

INSERT INTO attributes (name, slug, type, is_filterable)
SELECT 'نوع پوست', 'skin-type', 'select', true
WHERE NOT EXISTS (SELECT 1 FROM attributes WHERE slug = 'skin-type');

-- Sistem tamamlandı! 