-- Brand ve Product Type tablolarında slug alanlarını kontrol et

-- 1. Brands tablosu yapısı
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'brands' 
ORDER BY ordinal_position;

-- 2. Product_types tablosu yapısı  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'product_types' 
ORDER BY ordinal_position;

-- 3. Brands tablosunda slug alanı var mı?
SELECT name, slug FROM brands LIMIT 5;

-- 4. Product_types tablosunda slug alanı var mı?
SELECT name, slug FROM product_types LIMIT 5; 