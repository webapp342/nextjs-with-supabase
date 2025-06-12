-- ====================================
-- BREADCRUMB MARKA SORUNU DEBUG
-- ====================================

-- 1. Ürünlerin brand_id'lerini kontrol et
SELECT 
  p.id,
  p.name as product_name,
  p.brand_id,
  b.name as brand_name,
  b.slug as brand_slug
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
WHERE p.is_active = true
ORDER BY p.created_at DESC
LIMIT 10;

-- 2. Test ürünlerinin marka bilgilerini kontrol et  
SELECT 
  p.name as product_name,
  b.name as brand_name,
  pt.name as product_type_name
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_types pt ON p.product_type_id = pt.id
WHERE p.sku IN ('INT-FEFOL-30', 'AZR-FOLI-60', 'COL-BEAU-30', 'MAY-FOUND-LIQ', 'MAY-MASC-VOL');

-- 3. Breadcrumb view'ini kontrol et
SELECT 
  product_name,
  brand_name,
  brand_slug,
  product_type_name,
  product_type_slug,
  category_name,
  parent_category_name,
  grandparent_category_name
FROM breadcrumb_data
LIMIT 5;

-- 4. Eğer marka bilgisi null ise, test ürünlerini güncelle
UPDATE products 
SET brand_id = (SELECT id FROM brands WHERE slug = 'intrapharm' LIMIT 1)
WHERE sku = 'INT-FEFOL-30' AND brand_id IS NULL;

UPDATE products 
SET brand_id = (SELECT id FROM brands WHERE slug = 'azarian' LIMIT 1)
WHERE sku = 'AZR-FOLI-60' AND brand_id IS NULL;

UPDATE products 
SET brand_id = (SELECT id FROM brands WHERE slug = 'collagino' LIMIT 1)  
WHERE sku = 'COL-BEAU-30' AND brand_id IS NULL;

UPDATE products 
SET brand_id = (SELECT id FROM brands WHERE slug = 'maybelline' LIMIT 1)
WHERE sku IN ('MAY-FOUND-LIQ', 'MAY-MASC-VOL') AND brand_id IS NULL;

-- 5. Son kontrol
SELECT 'Marka güncellemeleri tamamlandı!' as message;

-- 6. Final breadcrumb testi
SELECT 
  product_name,
  brand_name,
  product_type_name,
  category_name
FROM breadcrumb_data
WHERE product_name LIKE '%ففول%' OR product_name LIKE '%مایبلین%'
ORDER BY product_name; 