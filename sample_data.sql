-- Örnek Kategoriler ve Ürünler - Supabase SQL Editor'da çalıştır

-- Kategoriler ekle (sadece yoksa)
INSERT INTO categories_new (name, slug, icon, level, sort_order, is_active) 
SELECT 'آرایش', 'makeup', '💄', 0, 1, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'makeup');

INSERT INTO categories_new (name, slug, icon, level, sort_order, is_active) 
SELECT 'مراقبت از پوست', 'skincare', '🧴', 0, 2, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'skincare');

INSERT INTO categories_new (name, slug, icon, level, sort_order, is_active) 
SELECT 'عطر و ادکلن', 'fragrance', '🌸', 0, 3, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'fragrance');

-- Alt kategoriler ekle (sadece yoksa)
INSERT INTO categories_new (name, slug, parent_id, level, sort_order, is_active)
SELECT 'کرم پودر', 'foundation', (SELECT id FROM categories_new WHERE slug = 'makeup'), 1, 1, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'foundation');

INSERT INTO categories_new (name, slug, parent_id, level, sort_order, is_active)
SELECT 'رژ لب', 'lipstick', (SELECT id FROM categories_new WHERE slug = 'makeup'), 1, 2, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'lipstick');

INSERT INTO categories_new (name, slug, parent_id, level, sort_order, is_active)
SELECT 'ریمل', 'mascara', (SELECT id FROM categories_new WHERE slug = 'makeup'), 1, 3, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'mascara');

INSERT INTO categories_new (name, slug, parent_id, level, sort_order, is_active)
SELECT 'بادی اسپلش', 'body-splash', (SELECT id FROM categories_new WHERE slug = 'fragrance'), 1, 1, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'body-splash');

INSERT INTO categories_new (name, slug, parent_id, level, sort_order, is_active)
SELECT 'ادو پرفیوم', 'eau-de-parfum', (SELECT id FROM categories_new WHERE slug = 'fragrance'), 1, 2, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'eau-de-parfum');

INSERT INTO categories_new (name, slug, parent_id, level, sort_order, is_active)
SELECT 'ادو تویلت', 'eau-de-toilette', (SELECT id FROM categories_new WHERE slug = 'fragrance'), 1, 3, true
WHERE NOT EXISTS (SELECT 1 FROM categories_new WHERE slug = 'eau-de-toilette');

-- Brands ekle (sadece yoksa)
INSERT INTO brands (name, slug, description, is_active)
SELECT 'Maybelline', 'maybelline', 'آمریکایی برند آرایشی', true
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE slug = 'maybelline');

INSERT INTO brands (name, slug, description, is_active)
SELECT 'L''Oréal', 'loreal', 'فرانسوی برند آرایشی', true
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE slug = 'loreal');

INSERT INTO brands (name, slug, description, is_active)
SELECT 'MAC', 'mac', 'برند حرفه‌ای آرایشی', true
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE slug = 'mac');

INSERT INTO brands (name, slug, description, is_active)
SELECT 'Chanel', 'chanel', 'لوکس فرانسوی برند', true
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE slug = 'chanel');

INSERT INTO brands (name, slug, description, is_active)
SELECT 'Dior', 'dior', 'پریمیوم فرانسوی برند', true
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE slug = 'dior');

-- Banner'lar ekle (sadece yoksa)
INSERT INTO category_banners (category_id, title, subtitle, image_url, link_category_id, background_color, text_color, sort_order, is_active)
SELECT NULL, 'عطر و ادکلن', 'بهترین برندهای جهان', 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800', 
 (SELECT id FROM categories_new WHERE slug = 'fragrance'), '#f8f9fa', '#212529', 1, true
WHERE NOT EXISTS (SELECT 1 FROM category_banners WHERE title = 'عطر و ادکلن');

INSERT INTO category_banners (category_id, title, subtitle, image_url, link_category_id, background_color, text_color, sort_order, is_active)
SELECT (SELECT id FROM categories_new WHERE slug = 'fragrance'), 'بادی اسپلش', 'عطرهای سبک و خنک', 
 'https://images.unsplash.com/photo-1588405748880-12d1d2a59d32?w=800',
 (SELECT id FROM categories_new WHERE slug = 'body-splash'), '#e3f2fd', '#1565c0', 1, true
WHERE NOT EXISTS (SELECT 1 FROM category_banners WHERE title = 'بادی اسپلش');

-- Örnek ürünler ekle (sadece yoksa)
INSERT INTO products (name, description, price, compare_price, image_urls, brand, category_id, is_active, stock_quantity)
SELECT 'Maybelline Fit Me Foundation', 'پوشش متوسط کرم پودر مناسب همه انواع پوست', 450000, 550000, 
 ARRAY['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400'], 'Maybelline',
 (SELECT id FROM categories_new WHERE slug = 'foundation'), true, 25
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Maybelline Fit Me Foundation');

INSERT INTO products (name, description, price, compare_price, image_urls, brand, category_id, is_active, stock_quantity)
SELECT 'MAC Ruby Woo Lipstick', 'رژ لب قرمز کلاسیک با فینیش مات', 890000, 990000,
 ARRAY['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400'], 'MAC',
 (SELECT id FROM categories_new WHERE slug = 'lipstick'), true, 15
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'MAC Ruby Woo Lipstick');

INSERT INTO products (name, description, price, compare_price, image_urls, brand, category_id, is_active, stock_quantity)
SELECT 'L''Oréal Voluminous Mascara', 'ریمل حجم دهنده مشکی ضد آب', 320000, 380000,
 ARRAY['https://images.unsplash.com/photo-1631214412964-cc25c0d0c532?w=400'], 'L''Oréal',
 (SELECT id FROM categories_new WHERE slug = 'mascara'), true, 30
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'L''Oréal Voluminous Mascara');

INSERT INTO products (name, description, price, compare_price, image_urls, brand, category_id, is_active, stock_quantity)
SELECT 'Chanel No. 5 Eau de Parfum', 'کلاسیک ترین عطر زنانه جهان با رایحه گلی', 2500000, 2800000,
 ARRAY['https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=400'], 'Chanel',
 (SELECT id FROM categories_new WHERE slug = 'eau-de-parfum'), true, 8
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Chanel No. 5 Eau de Parfum');

INSERT INTO products (name, description, price, compare_price, image_urls, brand, category_id, is_active, stock_quantity)
SELECT 'Dior Sauvage Body Splash', 'بادی اسپلش مردانه با رایحه تازه و اسپورت', 750000, NULL,
 ARRAY['https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400'], 'Dior',
 (SELECT id FROM categories_new WHERE slug = 'body-splash'), true, 20
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Dior Sauvage Body Splash');

INSERT INTO products (name, description, price, compare_price, image_urls, brand, category_id, is_active, stock_quantity)
SELECT 'L''Oréal Paris Eau de Toilette', 'عطر روزانه با رایحه ملایم و شیرین', 480000, 580000,
 ARRAY['https://images.unsplash.com/photo-1610623881120-f6a86fe7ba90?w=400'], 'L''Oréal',
 (SELECT id FROM categories_new WHERE slug = 'eau-de-toilette'), true, 12
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'L''Oréal Paris Eau de Toilette');

-- Product-brand relationship'i için products tablosunu güncelle
UPDATE products 
SET brand_id = (SELECT id FROM brands WHERE name = 'Maybelline')
WHERE brand = 'Maybelline' AND brand_id IS NULL;

UPDATE products 
SET brand_id = (SELECT id FROM brands WHERE name = 'MAC')
WHERE brand = 'MAC' AND brand_id IS NULL;

UPDATE products 
SET brand_id = (SELECT id FROM brands WHERE name = 'L''Oréal')
WHERE brand = 'L''Oréal' AND brand_id IS NULL;

UPDATE products 
SET brand_id = (SELECT id FROM brands WHERE name = 'Chanel')
WHERE brand = 'Chanel' AND brand_id IS NULL;

UPDATE products 
SET brand_id = (SELECT id FROM brands WHERE name = 'Dior')
WHERE brand = 'Dior' AND brand_id IS NULL; 