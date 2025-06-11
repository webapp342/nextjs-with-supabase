-- En Çok Satan Ürünler için Örnek Data

-- Products tablosuna bestseller ve sales_count kolonları ekle
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;

-- Mevcut ürünlerin bazılarını bestseller yap
UPDATE products 
SET is_bestseller = true, sales_count = 1250
WHERE name = 'Chanel No. 5 Eau de Parfum';

UPDATE products 
SET is_bestseller = true, sales_count = 890
WHERE name = 'MAC Ruby Woo Lipstick';

-- Yeni bestseller ürünler ekle
INSERT INTO products (name, description, price, compare_price, image_urls, brand, category_id, is_active, stock_quantity, is_bestseller, sales_count)
SELECT 'Garnier Vitamin C Face Cream', 'کرم آبرسان ویتامین C مناسب همه انواع پوست', 289800, 328000,
 ARRAY['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400'], 'Garnier',
 (SELECT id FROM categories_new WHERE slug = 'skincare'), true, 45, true, 1120
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Garnier Vitamin C Face Cream');

INSERT INTO products (name, description, price, compare_price, image_urls, brand, category_id, is_active, stock_quantity, is_bestseller, sales_count)
SELECT 'L''Oréal Elvive Shampoo', 'شامپو مغذی و ترمیم کننده مو', 164000, 220000,
 ARRAY['https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400'], 'L''Oréal',
 (SELECT id FROM categories_new WHERE slug = 'haircare'), true, 35, true, 980
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'L''Oréal Elvive Shampoo');

INSERT INTO products (name, description, price, compare_price, image_urls, brand, category_id, is_active, stock_quantity, is_bestseller, sales_count)
SELECT 'Nivea Face Moisturizer', 'کرم مرطوب کننده روزانه پوست', 125000, 180000,
 ARRAY['https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400'], 'Nivea',
 (SELECT id FROM categories_new WHERE slug = 'skincare'), true, 60, true, 1450
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Nivea Face Moisturizer');

INSERT INTO products (name, description, price, compare_price, image_urls, brand, category_id, is_active, stock_quantity, is_bestseller, sales_count)
SELECT 'Maybelline Mascara Waterproof', 'ریمل ضد آب و حجم دهنده', 231840, 289800,
 ARRAY['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400'], 'Maybelline',
 (SELECT id FROM categories_new WHERE slug = 'mascara'), true, 25, true, 760
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Maybelline Mascara Waterproof');

INSERT INTO products (name, description, price, compare_price, image_urls, brand, category_id, is_active, stock_quantity, is_bestseller, sales_count)
SELECT 'Dior Lipstick Rouge', 'رژ لب لوکس با رنگ‌های جذاب', 1250000, 1450000,
 ARRAY['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400'], 'Dior',
 (SELECT id FROM categories_new WHERE slug = 'lipstick'), true, 18, true, 420
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Dior Lipstick Rouge');

-- Brands tablosuna eksik markalar ekle
INSERT INTO brands (name, slug, description, is_active)
SELECT 'Garnier', 'garnier', 'فرانسوی برند طبیعی', true
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE slug = 'garnier');

INSERT INTO brands (name, slug, description, is_active)
SELECT 'Nivea', 'nivea', 'آلمانی برند مراقبت از پوست', true
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE slug = 'nivea');

-- Brand relationships güncelle
UPDATE products 
SET brand_id = (SELECT id FROM brands WHERE name = 'Garnier')
WHERE brand = 'Garnier' AND brand_id IS NULL;

UPDATE products 
SET brand_id = (SELECT id FROM brands WHERE name = 'Nivea')
WHERE brand = 'Nivea' AND brand_id IS NULL; 