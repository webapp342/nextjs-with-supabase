-- Eksik slug alanlarını ekle ve mevcut veriler için slug oluştur

-- 1. Brands tablosuna slug alanını ekle (eğer yoksa)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'brands' AND column_name = 'slug'
    ) THEN
        ALTER TABLE brands ADD COLUMN slug TEXT;
        
        -- Mevcut brand'lar için slug oluştur
        UPDATE brands 
        SET slug = LOWER(
            REGEXP_REPLACE(
                REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'),
                '\s+', '-', 'g'
            )
        ) 
        WHERE slug IS NULL;
        
        -- Slug alanına unique constraint ekle
        ALTER TABLE brands ADD CONSTRAINT brands_slug_unique UNIQUE (slug);
        
        RAISE NOTICE 'Brands tablosuna slug alanı eklendi ve mevcut veriler güncellendi';
    ELSE
        RAISE NOTICE 'Brands tablosunda slug alanı zaten mevcut';
    END IF;
END $$;

-- 2. Product_types tablosuna slug alanını ekle (eğer yoksa)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_types' AND column_name = 'slug'
    ) THEN
        ALTER TABLE product_types ADD COLUMN slug TEXT;
        
        -- Mevcut product_types'lar için slug oluştur
        UPDATE product_types 
        SET slug = LOWER(
            REGEXP_REPLACE(
                REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'),
                '\s+', '-', 'g'
            )
        ) 
        WHERE slug IS NULL;
        
        -- Slug alanına unique constraint ekle
        ALTER TABLE product_types ADD CONSTRAINT product_types_slug_unique UNIQUE (slug);
        
        RAISE NOTICE 'Product_types tablosuna slug alanı eklendi ve mevcut veriler güncellendi';
    ELSE
        RAISE NOTICE 'Product_types tablosunda slug alanı zaten mevcut';
    END IF;
END $$;

-- 3. Slug alanı NULL olan kayıtları güncelle
UPDATE brands 
SET slug = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'),
        '\s+', '-', 'g'
    )
) 
WHERE slug IS NULL OR slug = '';

UPDATE product_types 
SET slug = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'),
        '\s+', '-', 'g'
    )
) 
WHERE slug IS NULL OR slug = '';

-- 4. Kontrol sorguları
SELECT 'BRANDS KONTROL' as tablo, name, slug FROM brands ORDER BY id LIMIT 5;
SELECT 'PRODUCT_TYPES KONTROL' as tablo, name, slug FROM product_types ORDER BY id LIMIT 5; 