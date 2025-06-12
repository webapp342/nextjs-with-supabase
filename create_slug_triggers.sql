-- Yeni brand ve product_type kayıtları için otomatik slug oluşturan trigger'lar

-- 1. Slug oluşturan fonksiyon
CREATE OR REPLACE FUNCTION generate_slug_from_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer slug alanı boş ise name'den slug oluştur
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := LOWER(
            REGEXP_REPLACE(
                REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9\s]', '', 'g'),
                '\s+', '-', 'g'
            )
        );
        
        -- Eğer slug zaten varsa sonuna sayı ekle
        DECLARE
            counter INTEGER := 1;
            base_slug TEXT := NEW.slug;
            table_name TEXT := TG_TABLE_NAME;
        BEGIN
            WHILE EXISTS (
                SELECT 1 FROM brands WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '')
                WHEN table_name = 'brands'
                UNION ALL
                SELECT 1 FROM product_types WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '')
                WHEN table_name = 'product_types'
            ) LOOP
                NEW.slug := base_slug || '-' || counter;
                counter := counter + 1;
            END LOOP;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Brands tablosu için trigger
DROP TRIGGER IF EXISTS brands_generate_slug_trigger ON brands;
CREATE TRIGGER brands_generate_slug_trigger
    BEFORE INSERT OR UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION generate_slug_from_name();

-- 3. Product_types tablosu için trigger  
DROP TRIGGER IF EXISTS product_types_generate_slug_trigger ON product_types;
CREATE TRIGGER product_types_generate_slug_trigger
    BEFORE INSERT OR UPDATE ON product_types
    FOR EACH ROW
    EXECUTE FUNCTION generate_slug_from_name();

-- 4. Test için örnek kayıt ekleme (isteğe bağlı)
-- INSERT INTO brands (name) VALUES ('Test Marka') ON CONFLICT DO NOTHING;
-- INSERT INTO product_types (name, brand_id, category_id) 
-- VALUES ('Test Ürün Türü', (SELECT id FROM brands LIMIT 1), (SELECT id FROM categories_new LIMIT 1)) 
-- ON CONFLICT DO NOTHING;

RAISE NOTICE 'Slug oluşturma trigger''ları başarıyla eklendi'; 