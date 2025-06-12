-- Breadcrumb Link Sorunu Debug SQL
-- Bu sorguları çalıştırarak sorunu tespit edin

-- 1. Yeni ürünlerin breadcrumb verilerini kontrol et
SELECT 
  product_name,
  brand_name,
  brand_slug,
  product_type_name,
  product_type_slug,
  category_name
FROM breadcrumb_data 
ORDER BY product_id DESC 
LIMIT 10;

-- 2. Eski vs Yeni ürün karşılaştırması
SELECT 
  'ESKİ ÜRÜNLER' as tip,
  COUNT(*) as toplam,
  COUNT(brand_slug) as brand_slug_var,
  COUNT(product_type_slug) as product_type_slug_var
FROM breadcrumb_data 
WHERE product_id IN (
  SELECT id FROM products ORDER BY created_at ASC LIMIT 5
)
UNION ALL
SELECT 
  'YENİ ÜRÜNLER' as tip,
  COUNT(*) as toplam,
  COUNT(brand_slug) as brand_slug_var,
  COUNT(product_type_slug) as product_type_slug_var
FROM breadcrumb_data 
WHERE product_id IN (
  SELECT id FROM products ORDER BY created_at DESC LIMIT 5
);

-- 3. Products tablosunda brand_id ve product_type_id kontrolü
SELECT 
  p.name as product_name,
  p.brand_id,
  p.product_type_id,
  b.name as brand_name,
  b.slug as brand_slug,
  pt.name as product_type_name,
  pt.slug as product_type_slug,
  p.created_at
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_types pt ON p.product_type_id = pt.id
ORDER BY p.created_at DESC
LIMIT 10;

-- 4. Sadece NULL slug'ları olan ürünler
SELECT 
  product_name,
  brand_name,
  product_type_name,
  CASE WHEN brand_slug IS NULL THEN 'EKSIK' ELSE brand_slug END as brand_slug_status,
  CASE WHEN product_type_slug IS NULL THEN 'EKSIK' ELSE product_type_slug END as product_type_slug_status
FROM breadcrumb_data 
WHERE brand_slug IS NULL OR product_type_slug IS NULL; 