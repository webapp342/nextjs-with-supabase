-- NIVEA Marka Sistemi Oluşturma
-- 1. Marka oluştur
INSERT INTO brands (id, name, slug, description, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'NIVEA', 
  'nivea',
  'Dünyaca ünlü cilt bakım markası',
  true,
  now(),
  now()
);

-- 2. Ana kategori: Kozmetik ve Kişisel Bakım (sadece yoksa ekle)
INSERT INTO categories_new (id, name, slug, description, parent_id, level, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'کیهان و مراقبت شخصی',
  'cosmetics-personal-care',
  'محصولات زیبایی و مراقبت شخصی',
  null,
  1,
  true,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM categories_new WHERE slug = 'cosmetics-personal-care'
);

-- 3. Alt kategori: Cilt Bakımı
WITH parent_cat AS (
  SELECT id FROM categories_new WHERE slug = 'cosmetics-personal-care'
)
INSERT INTO categories_new (id, name, slug, description, parent_id, level, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'مراقبت از پوست',
  'skin-care',
  'محصولات مراقبت از پوست',
  parent_cat.id,
  2,
  true,
  now(),
  now()
FROM parent_cat
WHERE NOT EXISTS (
  SELECT 1 FROM categories_new WHERE slug = 'skin-care'
);

-- 4. Alt alt kategori: Yüz Bakımı
WITH parent_cat AS (
  SELECT id FROM categories_new WHERE slug = 'skin-care'
)
INSERT INTO categories_new (id, name, slug, description, parent_id, level, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'مراقبت از صورت',
  'face-care',
  'محصولات مراقبت از صورت',
  parent_cat.id,
  3,
  true,
  now(),
  now()
FROM parent_cat
WHERE NOT EXISTS (
  SELECT 1 FROM categories_new WHERE slug = 'face-care'
);

-- 5. Alt alt kategori: Vücut Bakımı  
WITH parent_cat AS (
  SELECT id FROM categories_new WHERE slug = 'skin-care'
)
INSERT INTO categories_new (id, name, slug, description, parent_id, level, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'مراقبت از بدن',
  'body-care',
  'محصولات مراقبت از بدن',
  parent_cat.id,
  3,
  true,
  now(),
  now()
FROM parent_cat
WHERE NOT EXISTS (
  SELECT 1 FROM categories_new WHERE slug = 'body-care'
);

-- 6. Ürün tipleri oluştur
WITH brand_data AS (
  SELECT id as brand_id FROM brands WHERE slug = 'nivea'
),
face_care_cat AS (
  SELECT id as category_id FROM categories_new WHERE slug = 'face-care'
),
body_care_cat AS (
  SELECT id as category_id FROM categories_new WHERE slug = 'body-care'
)
INSERT INTO product_types (id, name, slug, description, brand_id, category_id, is_active, created_at, updated_at)
VALUES 
-- Yüz bakımı ürün tipleri
(
  gen_random_uuid(),
  'کرم مرطوب کننده صورت',
  'face-moisturizer',
  'کرم های مرطوب کننده صورت',
  (SELECT brand_id FROM brand_data),
  (SELECT category_id FROM face_care_cat),
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'کرم ضد آفتاب',
  'sunscreen-cream',
  'کرم های ضد آفتاب',
  (SELECT brand_id FROM brand_data),
  (SELECT category_id FROM face_care_cat),
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'پاک کننده صورت',
  'face-cleanser',
  'محصولات پاک کننده صورت',
  (SELECT brand_id FROM brand_data),
  (SELECT category_id FROM face_care_cat),
  true,
  now(),
  now()
),
-- Vücut bakımı ürün tipleri
(
  gen_random_uuid(),
  'لوسیون بدن',
  'body-lotion',
  'لوسیون های مرطوب کننده بدن',
  (SELECT brand_id FROM brand_data),
  (SELECT category_id FROM body_care_cat),
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'کرم دست',
  'hand-cream',
  'کرم های مراقبت از دست',
  (SELECT brand_id FROM brand_data),
  (SELECT category_id FROM body_care_cat),
  true,
  now(),
  now()
);

-- 7. Mevcut kullanıcı ID'sini kullan (yeni kullanıcı oluşturmaya gerek yok)

-- 8. 8 adet ürün oluştur
WITH brand_data AS (
  SELECT id as brand_id FROM brands WHERE slug = 'nivea'
),
user_data AS (
  SELECT id as user_id FROM auth.users LIMIT 1
),
face_moisturizer AS (
  SELECT pt.id as product_type_id, pt.category_id 
  FROM product_types pt 
  WHERE pt.slug = 'face-moisturizer'
),
sunscreen AS (
  SELECT pt.id as product_type_id, pt.category_id 
  FROM product_types pt 
  WHERE pt.slug = 'sunscreen-cream'
),
face_cleanser AS (
  SELECT pt.id as product_type_id, pt.category_id 
  FROM product_types pt 
  WHERE pt.slug = 'face-cleanser'
),
body_lotion AS (
  SELECT pt.id as product_type_id, pt.category_id 
  FROM product_types pt 
  WHERE pt.slug = 'body-lotion'
),
hand_cream AS (
  SELECT pt.id as product_type_id, pt.category_id 
  FROM product_types pt 
  WHERE pt.slug = 'hand-cream'
)
INSERT INTO products (
  id, name, description, price, stock_quantity, 
  brand_id, category_id, product_type_id, user_id, is_active, 
  created_at, updated_at
)
VALUES 
-- Yüz nemlendirici ürünleri
(
  gen_random_uuid(),
  'نیویا کرم مرطوب کننده صورت روزانه',
  'کرم مرطوب کننده مناسب برای پوست خشک و حساس',
  69000,
  50,
  (SELECT brand_id FROM brand_data),
  (SELECT category_id FROM face_moisturizer),
  (SELECT product_type_id FROM face_moisturizer),
  (SELECT user_id FROM user_data),
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'نیویا کرم شبانه ضد چروک',
  'کرم شبانه برای کاهش چین و چروک',
  99000,
  30,
  (SELECT brand_id FROM brand_data),
  (SELECT category_id FROM face_moisturizer),
  (SELECT product_type_id FROM face_moisturizer),
  (SELECT user_id FROM user_data),
  true,
  now(),
  now()
),
-- ضد آفتاب ürünleri
(
  gen_random_uuid(),
  'نیویا کرم ضد آفتاب SPF 50',
  'محافظت قوی در برابر اشعه UV',
  79000,
  40,
  (SELECT brand_id FROM brand_data),
  (SELECT category_id FROM sunscreen),
  (SELECT product_type_id FROM sunscreen),
  (SELECT user_id FROM user_data),
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'نیویا کرم ضد آفتاب SPF 30 کودکان',
  'مخصوص پوست حساس کودکان',
  75000,
  25,
  (SELECT brand_id FROM brand_data),
  (SELECT category_id FROM sunscreen),
  (SELECT product_type_id FROM sunscreen),
  (SELECT user_id FROM user_data),
  true,
  now(),
  now()
),
-- پاک کننده صورت
(
  gen_random_uuid(),
  'نیویا ژل پاک کننده صورت',
  'پاک کننده ملایم برای پوست مختلط',
  55000,
  60,
  (SELECT brand_id FROM brand_data),
  (SELECT category_id FROM face_cleanser),
  (SELECT product_type_id FROM face_cleanser),
  (SELECT user_id FROM user_data),
  true,
  now(),
  now()
),
-- لوسیون بدن
(
  gen_random_uuid(),
  'نیویا لوسیون مرطوب کننده بدن',
  'لوسیون روزانه برای پوست خشک',
  69000,
  80,
  (SELECT brand_id FROM brand_data),
  (SELECT category_id FROM body_lotion),
  (SELECT product_type_id FROM body_lotion),
  (SELECT user_id FROM user_data),
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'نیویا لوسیون ترمیم کننده شب',
  'لوسیون ترمیم کننده برای شب',
  85000,
  35,
  (SELECT brand_id FROM brand_data),
  (SELECT category_id FROM body_lotion),
  (SELECT product_type_id FROM body_lotion),
  (SELECT user_id FROM user_data),
  true,
  now(),
  now()
),
-- کرم دست
(
  gen_random_uuid(),
  'نیویا کرم مراقبت از دست',
  'کرم مرطوب کننده دست با عصاره آلوورا',
  39000,
  100,
  (SELECT brand_id FROM brand_data),
  (SELECT category_id FROM hand_cream),
  (SELECT product_type_id FROM hand_cream),
  (SELECT user_id FROM user_data),
  true,
  now(),
  now()
);

-- 9. Breadcrumb view'ını yenile (opsiyonel - view otomatik güncellenecek)
-- Veritabanı view'ları otomatik olarak yeni verilerle güncellenir

-- 10. Sonuçları kontrol et
SELECT 
  b.name as brand_name,
  b.slug as brand_slug,
  COUNT(DISTINCT pt.id) as product_types_count,
  COUNT(p.id) as products_count
FROM brands b
LEFT JOIN product_types pt ON b.id = pt.brand_id
LEFT JOIN products p ON b.id = p.brand_id
WHERE b.slug = 'nivea'
GROUP BY b.id, b.name, b.slug;

-- Kategori hiyerarşisini kontrol et
WITH RECURSIVE category_hierarchy AS (
  -- Ana kategoriler
  SELECT 
    id, name, slug, parent_id, level, 
    name as full_path,
    slug as full_slug_path
  FROM categories_new 
  WHERE parent_id IS NULL AND slug = 'cosmetics-personal-care'
  
  UNION ALL
  
  -- Alt kategoriler
  SELECT 
    c.id, c.name, c.slug, c.parent_id, c.level,
    ch.full_path || ' > ' || c.name as full_path,
    ch.full_slug_path || '/' || c.slug as full_slug_path
  FROM categories_new c
  INNER JOIN category_hierarchy ch ON c.parent_id = ch.id
)
SELECT * FROM category_hierarchy ORDER BY level, name;

-- Ürün tiplerini kontrol et
SELECT 
  pt.name as product_type_name,
  pt.slug as product_type_slug,
  b.name as brand_name,
  c.name as category_name,
  COUNT(p.id) as products_count
FROM product_types pt
JOIN brands b ON pt.brand_id = b.id
JOIN categories_new c ON pt.category_id = c.id
LEFT JOIN products p ON pt.id = p.product_type_id
WHERE b.slug = 'nivea'
GROUP BY pt.id, pt.name, pt.slug, b.name, c.name
ORDER BY pt.name; 