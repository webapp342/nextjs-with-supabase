-- Breadcrumb Data VIEW - E-ticaret Platform İçin
-- Bu VIEW breadcrumb performansını optimize eder ve hierarchical kategori yapısını destekler

CREATE VIEW breadcrumb_data AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  b.name as brand_name,
  b.slug as brand_slug,
  pt.name as product_type_name,
  pt.slug as product_type_slug,
  c.name as category_name,
  c.slug as category_slug,
  c.level as category_level,
  pc.name as parent_category_name,
  pc.slug as parent_category_slug,
  gc.name as grandparent_category_name,
  gc.slug as grandparent_category_slug
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_types pt ON p.product_type_id = pt.id
LEFT JOIN categories_new c ON p.category_id = c.id
LEFT JOIN categories_new pc ON c.parent_id = pc.id
LEFT JOIN categories_new gc ON pc.parent_id = gc.id
WHERE p.is_active = true;

-- Test sorgusu
-- SELECT * FROM breadcrumb_data LIMIT 5; 