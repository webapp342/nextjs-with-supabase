-- Önce mevcut foreign key constraint'leri kontrol et ve kaldır
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_brand_id_fkey;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_product_type_id_fkey;

-- Yeni foreign key constraint'leri ekle
ALTER TABLE products 
ADD CONSTRAINT products_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES brands(id);

ALTER TABLE products 
ADD CONSTRAINT products_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES categories(id);

ALTER TABLE products 
ADD CONSTRAINT products_product_type_id_fkey 
FOREIGN KEY (product_type_id) REFERENCES product_types(id);

-- İndexleri ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_product_type_id ON products(product_type_id); 