-- Mevcut verileri kontrol et

-- 1. Intrapharm brand var mı?
SELECT id, name, slug FROM brands WHERE slug = 'intrapharm';

-- 2. Product types neler var Intrapharm için?
SELECT pt.id, pt.name, pt.slug, b.name as brand_name 
FROM product_types pt 
JOIN brands b ON pt.brand_id = b.id 
WHERE b.slug = 'intrapharm';

-- 3. Mevcut categories var mı?
SELECT id, name, slug FROM categories_new WHERE is_active = true LIMIT 5;

-- 4. Mevcut products var mı?
SELECT p.id, p.name, b.name as brand_name, pt.name as product_type_name
FROM products p 
JOIN brands b ON p.brand_id = b.id 
LEFT JOIN product_types pt ON p.product_type_id = pt.id
WHERE b.slug = 'intrapharm';

-- 5. Test için user_id var mı?
SELECT DISTINCT user_id FROM products LIMIT 1; 