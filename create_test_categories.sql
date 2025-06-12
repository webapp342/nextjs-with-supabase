-- E-ticaret Hierarchical Kategori Test Verisi
-- Bu SQL'i Supabase'de çalıştırarak örnek kategori yapısı oluşturun

-- Önce mevcut kategorileri temizle (isteğe bağlı)
-- DELETE FROM categories_new WHERE level >= 0;

-- 1. ANA KATEGORİLER (Level 0)
INSERT INTO categories_new (name, slug, parent_id, level, sort_order, is_active, icon) VALUES
('Sağlık ve Kişisel Bakım', 'health-personal-care', NULL, 0, 1, true, '🏥'),
('Kozmetik ve Güzellik', 'cosmetics-beauty', NULL, 0, 2, true, '💄'),
('Bebek ve Anne', 'baby-mother', NULL, 0, 3, true, '👶'),
('Ev ve Yaşam', 'home-living', NULL, 0, 4, true, '🏠');

-- 2. ALT KATEGORİLER (Level 1)
-- Sağlık ve Kişisel Bakım alt kategorileri
INSERT INTO categories_new (name, slug, parent_id, level, sort_order, is_active, icon) VALUES
('Vitamin ve Takviye', 'vitamin-supplement', 
 (SELECT id FROM categories_new WHERE slug = 'health-personal-care'), 1, 1, true, '💊'),
('Cilt Bakım', 'skin-care', 
 (SELECT id FROM categories_new WHERE slug = 'health-personal-care'), 1, 2, true, '🧴'),
('Kişisel Hijyen', 'personal-hygiene', 
 (SELECT id FROM categories_new WHERE slug = 'health-personal-care'), 1, 3, true, '🧼');

-- Kozmetik ve Güzellik alt kategorileri
INSERT INTO categories_new (name, slug, parent_id, level, sort_order, is_active, icon) VALUES
('Makyaj', 'makeup', 
 (SELECT id FROM categories_new WHERE slug = 'cosmetics-beauty'), 1, 1, true, '💋'),
('Saç Bakım', 'hair-care', 
 (SELECT id FROM categories_new WHERE slug = 'cosmetics-beauty'), 1, 2, true, '💇'),
('Parfüm ve Koku', 'perfume-fragrance', 
 (SELECT id FROM categories_new WHERE slug = 'cosmetics-beauty'), 1, 3, true, '🌸');

-- 3. ALT-ALT KATEGORİLER (Level 2)
-- Vitamin ve Takviye alt-alt kategorileri
INSERT INTO categories_new (name, slug, parent_id, level, sort_order, is_active, icon) VALUES
('Demir ve Folik Asit', 'iron-folic-acid', 
 (SELECT id FROM categories_new WHERE slug = 'vitamin-supplement'), 2, 1, true, '🔴'),
('Vitamin D', 'vitamin-d', 
 (SELECT id FROM categories_new WHERE slug = 'vitamin-supplement'), 2, 2, true, '☀️'),
('Kalsiyum ve Magnezyum', 'calcium-magnesium', 
 (SELECT id FROM categories_new WHERE slug = 'vitamin-supplement'), 2, 3, true, '🦴'),
('Omega 3', 'omega-3', 
 (SELECT id FROM categories_new WHERE slug = 'vitamin-supplement'), 2, 4, true, '🐟'),
('Multivitamin', 'multivitamin', 
 (SELECT id FROM categories_new WHERE slug = 'vitamin-supplement'), 2, 5, true, '🌈');

-- Cilt Bakım alt-alt kategorileri
INSERT INTO categories_new (name, slug, parent_id, level, sort_order, is_active, icon) VALUES
('Yüz Nemlendiricisi', 'face-moisturizer', 
 (SELECT id FROM categories_new WHERE slug = 'skin-care'), 2, 1, true, '💧'),
('Güneş Kremi', 'sunscreen', 
 (SELECT id FROM categories_new WHERE slug = 'skin-care'), 2, 2, true, '☀️'),
('Temizlik Jeli', 'cleansing-gel', 
 (SELECT id FROM categories_new WHERE slug = 'skin-care'), 2, 3, true, '🧽'),
('Serum', 'serum', 
 (SELECT id FROM categories_new WHERE slug = 'skin-care'), 2, 4, true, '💦');

-- Makyaj alt-alt kategorileri
INSERT INTO categories_new (name, slug, parent_id, level, sort_order, is_active, icon) VALUES
('Fondöten', 'foundation', 
 (SELECT id FROM categories_new WHERE slug = 'makeup'), 2, 1, true, '🎨'),
('Ruj', 'lipstick', 
 (SELECT id FROM categories_new WHERE slug = 'makeup'), 2, 2, true, '💋'),
('Maskara', 'mascara', 
 (SELECT id FROM categories_new WHERE slug = 'makeup'), 2, 3, true, '👁️'),
('Kaş Kalemi', 'eyebrow-pencil', 
 (SELECT id FROM categories_new WHERE slug = 'makeup'), 2, 4, true, '✏️');

-- Kategori yapısını kontrol etmek için
-- SELECT 
--   CASE 
--     WHEN level = 0 THEN name
--     WHEN level = 1 THEN '  ├── ' || name
--     WHEN level = 2 THEN '    └── ' || name
--   END as category_tree,
--   level,
--   slug
-- FROM categories_new 
-- ORDER BY 
--   COALESCE((SELECT sort_order FROM categories_new p1 WHERE p1.id = categories_new.parent_id AND p1.parent_id IS NULL), sort_order),
--   COALESCE((SELECT sort_order FROM categories_new p2 WHERE p2.id = categories_new.parent_id AND p2.level = 1), sort_order),
--   sort_order; 