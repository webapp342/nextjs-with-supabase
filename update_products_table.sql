-- Products tablosunu yeni kategori sistemiyle uyumlu hale getir
-- Bu SQL dosyasını Supabase SQL Editor'da çalıştırın

-- Önce mevcut products tablosunu yedekleyin (opsiyonel)
-- CREATE TABLE products_backup AS SELECT * FROM products;

-- Yeni kolonları ekle
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS main_category_id UUID REFERENCES main_categories(id),
ADD COLUMN IF NOT EXISTS sub_category_id UUID REFERENCES sub_categories(id),
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id),
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS compare_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS sku VARCHAR(100),
ADD COLUMN IF NOT EXISTS barcode VARCHAR(100),
ADD COLUMN IF NOT EXISTS weight DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS length DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS width DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS height DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS seo_title VARCHAR(200),
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Eğer eski category kolonu varsa, bunu kullanarak main_category_id'yi güncelle
-- Bu kod, eski kategori sistemindeki verileri yeni sisteme taşır
DO $$
DECLARE
    category_mapping RECORD;
BEGIN
    -- Eski kategori verilerini yeni kategorilerle eşleştir
    FOR category_mapping IN
        SELECT DISTINCT category FROM products WHERE category IS NOT NULL
    LOOP
        UPDATE products 
        SET main_category_id = (
            SELECT id FROM main_categories 
            WHERE slug = category_mapping.category 
            LIMIT 1
        )
        WHERE category = category_mapping.category 
        AND main_category_id IS NULL;
    END LOOP;
END $$;

-- Indexes ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_products_main_category ON products(main_category_id);
CREATE INDEX IF NOT EXISTS idx_products_sub_category ON products(sub_category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_on_sale ON products(is_on_sale);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_products_updated_at_trigger ON products;
CREATE TRIGGER update_products_updated_at_trigger 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_products_updated_at();

-- RLS policies güncelle
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Herkes ürünleri okuyabilir (sadece aktif ürünler)
DROP POLICY IF EXISTS "Allow public read access" ON products;
CREATE POLICY "Allow public read access" ON products 
    FOR SELECT USING (is_active = true);

-- Sadece ürün sahibi kendi ürünlerini güncelleyebilir/silebilir
DROP POLICY IF EXISTS "Allow users to manage their own products" ON products;
CREATE POLICY "Allow users to manage their own products" ON products 
    FOR ALL USING (auth.uid() = user_id);

-- Authenticated kullanıcılar ürün ekleyebilir
DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON products;
CREATE POLICY "Allow authenticated users to insert products" ON products 
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);

-- Satıcılar tüm ürünleri görebilir (admin paneli için)
-- Bu policy'yi sadece gerekiyorsa ekleyin
/*
CREATE POLICY "Allow sellers to see all products" ON products 
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'user_type' = 'seller'
        )
    );
*/

-- Görünümler oluştur (kolay veri erişimi için)
CREATE OR REPLACE VIEW product_details AS
SELECT 
    p.*,
    mc.name as main_category_name,
    mc.slug as main_category_slug,
    mc.icon as main_category_icon,
    sc.name as sub_category_name,
    sc.slug as sub_category_slug,
    sc.icon as sub_category_icon,
    b.name as brand_name,
    b.slug as brand_slug,
    b.country as brand_country,
    array_agg(
        json_build_object(
            'category_name', ac.name,
            'category_type', ac.type,
            'value', av.value,
            'color_code', av.color_code
        )
    ) FILTER (WHERE ac.id IS NOT NULL) as attributes
FROM products p
LEFT JOIN main_categories mc ON p.main_category_id = mc.id
LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_attributes pa ON p.id = pa.product_id
LEFT JOIN attribute_values av ON pa.attribute_value_id = av.id
LEFT JOIN attribute_categories ac ON av.attribute_category_id = ac.id
GROUP BY p.id, mc.id, sc.id, b.id;

-- Grant izinleri
GRANT SELECT ON product_details TO authenticated;
GRANT SELECT ON product_details TO anon;

-- Faydalı fonksiyonlar
CREATE OR REPLACE FUNCTION get_products_by_category(category_slug TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    short_description TEXT,
    description TEXT,
    price DECIMAL,
    compare_price DECIMAL,
    image_urls TEXT[],
    brand_name TEXT,
    is_on_sale BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.short_description,
        p.description,
        p.price,
        p.compare_price,
        p.image_urls,
        b.name as brand_name,
        p.is_on_sale,
        p.created_at
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN main_categories mc ON p.main_category_id = mc.id
    LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
    WHERE p.is_active = true
    AND (mc.slug = category_slug OR sc.slug = category_slug)
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger fonksiyonu: stok seviyesi kontrolü
CREATE OR REPLACE FUNCTION check_stock_level()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer stok minimum seviyeye düştüyse bildirim gönder (gelecekte implement edilebilir)
    IF NEW.stock_quantity <= NEW.min_stock_level THEN
        -- Burada bildirim sistemi entegrasyonu yapılabilir
        RAISE NOTICE 'Low stock alert for product: %', NEW.name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stock_level_check ON products;
CREATE TRIGGER stock_level_check
    AFTER UPDATE OF stock_quantity ON products
    FOR EACH ROW
    EXECUTE FUNCTION check_stock_level();

-- Demo veri temizleme (opsiyonel - sadece test verilerini temizlemek için)
-- DELETE FROM products WHERE name LIKE '%test%' OR name LIKE '%demo%';

-- Başarı mesajı
SELECT 'Products table successfully updated with new category system!' as status; 