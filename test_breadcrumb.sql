-- Breadcrumb Data VIEW Test
-- Bu sorguları Supabase SQL Editor'da çalıştırarak test edin

-- 1. VIEW'ın düzgün oluştuğunu kontrol edin
SELECT COUNT(*) as total_products FROM breadcrumb_data;

-- 2. Örnek breadcrumb verilerini görün
SELECT 
  product_name,
  brand_name,
  product_type_name,
  category_name,
  parent_category_name,
  grandparent_category_name
FROM breadcrumb_data 
LIMIT 10;

-- 3. Kategori hiyerarşisi test
SELECT 
  category_level,
  COUNT(*) as product_count
FROM breadcrumb_data 
GROUP BY category_level 
ORDER BY category_level;

-- 4. Breadcrumb path örnekleri
SELECT 
  product_name,
  CASE 
    WHEN grandparent_category_name IS NOT NULL THEN 
      grandparent_category_name || ' ← ' || parent_category_name || ' ← ' || category_name
    WHEN parent_category_name IS NOT NULL THEN 
      parent_category_name || ' ← ' || category_name
    ELSE 
      category_name
  END as breadcrumb_path,
  brand_name || COALESCE(' ← ' || product_type_name, '') as brand_path
FROM breadcrumb_data 
WHERE product_name IS NOT NULL
LIMIT 5; 