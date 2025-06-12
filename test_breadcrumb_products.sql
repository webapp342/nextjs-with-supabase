-- ====================================
-- BREADCRUMB SİSTEMİ TEST VERİLERİ
-- ====================================

-- İlk olarak database güncellemesinin yapıldığından emin olun
-- database_breadcrumb_enhancement.sql dosyasını çalıştırmış olmanız gerekiyor

-- Test için dummy user ID (gerçek user ID'nizi buraya koyabilirsiniz)
-- Eğer user yoksa, aşağıdaki satırı uncomment edin:
-- INSERT INTO auth.users (id, email) VALUES ('550e8400-e29b-41d4-a716-446655440000', 'test@example.com') ON CONFLICT DO NOTHING;

-- 1. Eksik kategorileri ekle (sadece yoksa)
INSERT INTO categories_new (name, slug, icon, level, sort_order, is_active)
SELECT 'مکمل غذایی و ورزشی', 'nutritional-sports-supplement', '💊', 0, 10, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'nutritional-sports-supplement');

INSERT INTO categories_new (name, slug, parent_id, icon, level, sort_order, is_active)
SELECT 'ویتامین و مواد معدنی', 'vitamins-minerals', 
       (SELECT id FROM categories_new WHERE slug = 'nutritional-sports-supplement' LIMIT 1),
       '🧬', 1, 1, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'vitamins-minerals');

INSERT INTO categories_new (name, slug, parent_id, icon, level, sort_order, is_active)
SELECT 'آهن و فولیک اسید', 'iron-folic-acid', 
       (SELECT id FROM categories_new WHERE slug = 'vitamins-minerals' LIMIT 1),
       '⚡', 2, 1, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'iron-folic-acid');

-- 2. Test markalarını ekle (sadece yoksa)
INSERT INTO brands (name, slug, description, is_active)
SELECT 'اینترافارم', 'intrapharm', 'شرکت داروسازی اینترافارم', true
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE slug = 'intrapharm');

INSERT INTO brands (name, slug, description, is_active)
SELECT 'آذریان', 'azarian', 'شرکت داروسازی آذریان', true
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE slug = 'azarian');

INSERT INTO brands (name, slug, description, is_active)
SELECT 'کلاژینو', 'collagino', 'محصولات زیبایی و سلامت', true
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE slug = 'collagino');

-- 3. Ürün tiplerini ekle (sadece yoksa)
INSERT INTO product_types (name, slug, brand_id, category_id, sort_order)
SELECT 
  'کپسول ففول', 
  'fefol-capsules',
  b.id,
  c.id,
  1
FROM brands b, categories_new c
WHERE b.slug = 'intrapharm' 
  AND c.slug = 'iron-folic-acid'
  AND NOT EXISTS (
    SELECT 1 FROM product_types 
    WHERE slug = 'fefol-capsules' AND brand_id = b.id
  )
LIMIT 1;

INSERT INTO product_types (name, slug, brand_id, category_id, sort_order)
SELECT 
  'قرص فولیگوژن', 
  'foligogen-tablets',
  b.id,
  c.id,
  1
FROM brands b, categories_new c
WHERE b.slug = 'azarian' 
  AND c.slug = 'iron-folic-acid'
  AND NOT EXISTS (
    SELECT 1 FROM product_types 
    WHERE slug = 'foligogen-tablets' AND brand_id = b.id
  )
LIMIT 1;

INSERT INTO product_types (name, slug, brand_id, category_id, sort_order)
SELECT 
  'ساشه کلاژن یونی', 
  'collagen-beauty-sachets',
  b.id,
  c.id,
  1
FROM brands b, categories_new c
WHERE b.slug = 'collagino' 
  AND c.slug = 'vitamins-minerals'
  AND NOT EXISTS (
    SELECT 1 FROM product_types 
    WHERE slug = 'collagen-beauty-sachets' AND brand_id = b.id
  )
LIMIT 1;

-- 4. Test ürünlerini ekle
INSERT INTO products (
  name, 
  description, 
  short_description,
  price, 
  compare_price,
  stock_quantity,
  category_id, 
  brand_id, 
  product_type_id,
  image_urls,
  sku,
  is_active,
  is_featured,
  user_id
)
SELECT 
  'کپسول ففول (فیفول) اینترافارم بسته 30 عددی',
  'کپسول ففول اینترافارم حاوی 500 میکروگرم فولیک اسید و آهن است که برای درمان کم خونی ناشی از کمبود آهن و فولیک اسید استفاده می‌شود. این محصول برای زنان باردار و شیرده نیز مناسب است.',
  'کپسول ففول برای درمان کم خونی ناشی از کمبود آهن',
  177888,
  307300,
  25,
  c.id,
  b.id,
  pt.id,
  ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400', 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=400'],
  'INT-FEFOL-30',
  true,
  true,
  '550e8400-e29b-41d4-a716-446655440000'::uuid
FROM categories_new c, brands b, product_types pt
WHERE c.slug = 'iron-folic-acid'
  AND b.slug = 'intrapharm'
  AND pt.slug = 'fefol-capsules'
  AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'INT-FEFOL-30')
LIMIT 1;

INSERT INTO products (
  name, 
  description, 
  short_description,
  price, 
  compare_price,
  stock_quantity,
  category_id, 
  brand_id, 
  product_type_id,
  image_urls,
  sku,
  is_active,
  user_id
)
SELECT 
  'قرص فولیگوژن بسته 60 عددی آذریان',
  'قرص فولیگوژن آذریان حاوی ترکیبی از آهن، فولیک اسید و ویتامین C است. این محصول جهت تقویت سیستم ایمنی بدن و درمان کم خونی طراحی شده است.',
  'قرص کلاژن گلد بسته 60 عددی برای تقویت سیستم ایمنی',
  428000,
  759000,
  15,
  c.id,
  b.id,
  pt.id,
  ARRAY['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400', 'https://images.unsplash.com/photo-1600659062993-349f9e7893fb?w=400'],
  'AZR-FOLI-60',
  true,
  '550e8400-e29b-41d4-a716-446655440000'::uuid
FROM categories_new c, brands b, product_types pt
WHERE c.slug = 'iron-folic-acid'
  AND b.slug = 'azarian'
  AND pt.slug = 'foligogen-tablets'
  AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'AZR-FOLI-60')
LIMIT 1;

INSERT INTO products (
  name, 
  description, 
  short_description,
  price, 
  compare_price,
  stock_quantity,
  category_id, 
  brand_id, 
  product_type_id,
  image_urls,
  sku,
  is_active,
  user_id
)
SELECT 
  'ساشه کلاژن یونی بسته 30 کلاژینو',
  'ساشه کلاژن یونی کلاژینو حاوی کلاژن هیدرولیز شده، ویتامین C، روی و سلنیوم است. این محصول برای بهبود سلامت پوست، مو و ناخن طراحی شده است.',
  'ساشه کلاژن برای زیبایی پوست و مو - بسته 30 عددی',
  525000,
  850000,
  8,
  c.id,
  b.id,
  pt.id,
  ARRAY['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', 'https://images.unsplash.com/photo-1525268771113-32d9e9021a97?w=400'],
  'COL-BEAU-30',
  true,
  '550e8400-e29b-41d4-a716-446655440000'::uuid
FROM categories_new c, brands b, product_types pt
WHERE c.slug = 'vitamins-minerals'
  AND b.slug = 'collagino'
  AND pt.slug = 'collagen-beauty-sachets'
  AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'COL-BEAU-30')
LIMIT 1;

-- 5. Maybelline makeup ürünleri de ekleyelim (varolan kategoriler için)
INSERT INTO products (
  name, 
  description, 
  short_description,
  price, 
  compare_price,
  stock_quantity,
  category_id, 
  brand_id, 
  product_type_id,
  image_urls,
  sku,
  is_active,
  user_id
)
SELECT 
  'مایبلین فونداسیون مایع Dream Urban Cover',
  'فونداسیون مایع مایبلین با پوشش کامل و ماندگاری 24 ساعته. مناسب برای انواع پوست و دارای SPF 50.',
  'فونداسیون مایع با پوشش کامل و ماندگاری بالا',
  189000,
  245000,
  12,
  c.id,
  b.id,
  pt.id,
  ARRAY['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400'],
  'MAY-FOUND-LIQ',
  true,
  '550e8400-e29b-41d4-a716-446655440000'::uuid
FROM categories_new c, brands b, product_types pt
WHERE c.slug = 'foundation'
  AND b.slug = 'maybelline'
  AND pt.slug = 'liquid-foundation'
  AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'MAY-FOUND-LIQ')
LIMIT 1;

INSERT INTO products (
  name, 
  description, 
  short_description,
  price, 
  compare_price,
  stock_quantity,
  category_id, 
  brand_id, 
  product_type_id,
  image_urls,
  sku,
  is_active,
  user_id
)
SELECT 
  'مایبلین ریمل حجم دهنده Lash Sensational',
  'ریمل حجم دهنده مایبلین با فرمول خاص که مژه ها را طولانی و پرپشت می کند. مقاوم در برابر ریزش.',
  'ریمل حجم دهنده برای مژه های طولانی و پرپشت',
  95000,
  125000,
  18,
  c.id,
  b.id,
  pt.id,
  ARRAY['https://images.unsplash.com/photo-1631214540242-5d1b0e8cd4e3?w=400', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400'],
  'MAY-MASC-VOL',
  true,
  '550e8400-e29b-41d4-a716-446655440000'::uuid
FROM categories_new c, brands b, product_types pt
WHERE c.slug = 'mascara'
  AND b.slug = 'maybelline'
  AND pt.slug = 'volumizing-mascara'
  AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'MAY-MASC-VOL')
LIMIT 1;

-- Test sonuçlarını göster
SELECT 'Test ürünleri başarıyla eklendi!' as message;

-- Breadcrumb view'ini test et
SELECT 
  product_name,
  brand_name,
  product_type_name,
  category_name,
  parent_category_name,
  grandparent_category_name
FROM breadcrumb_data 
WHERE product_name LIKE '%ففول%' OR product_name LIKE '%مایبلین%'
ORDER BY product_name; 