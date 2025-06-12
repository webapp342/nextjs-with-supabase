-- Intrapharm markası için test ürünleri - Basit versiyon

-- Sadece ürünleri ekle (product type zaten mevcut)
WITH data_prep AS (
    SELECT 
        i.id as brand_id,
        c.id as category_id,
        pt.id as product_type_id,
        (SELECT DISTINCT user_id FROM products LIMIT 1) as user_id
    FROM brands i, categories_new c, product_types pt
    WHERE i.slug = 'intrapharm' 
    AND c.is_active = true 
    AND pt.slug = 'ferol-capsule' 
    AND pt.brand_id = i.id
    LIMIT 1
)
INSERT INTO products (
    user_id, brand_id, category_id, product_type_id,
    name, description, price, compare_price,
    image_urls, is_active, stock_quantity, tags
) 
SELECT 
    user_id, brand_id, category_id, product_type_id,
    'کپسول فرول اینترافارم بسته 20 عددی',
    'کپسول فرول حاوی آهن برای درمان کم‌خونی. هر کپسول حاوی 50 میلی‌گرم آهن عنصری است. مناسب برای بزرگسالان و کودکان بالای 12 سال.',
    89000, 125000,
    ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'],
    true, 150,
    ARRAY['آهن', 'کم‌خونی', 'فرول', 'کپسول']
FROM data_prep;

-- İkinci ferol ürünü
WITH data_prep AS (
    SELECT 
        i.id as brand_id,
        c.id as category_id,
        pt.id as product_type_id,
        (SELECT DISTINCT user_id FROM products LIMIT 1) as user_id
    FROM brands i, categories_new c, product_types pt
    WHERE i.slug = 'intrapharm' 
    AND c.is_active = true 
    AND pt.slug = 'ferol-capsule' 
    AND pt.brand_id = i.id
    LIMIT 1
)
INSERT INTO products (
    user_id, brand_id, category_id, product_type_id,
    name, description, price, compare_price,
    image_urls, is_active, stock_quantity, tags
) 
SELECT 
    user_id, brand_id, category_id, product_type_id,
    'کپسول فرول اینترافارم بسته 50 عددی',
    'کپسول فرول حاوی آهن برای درمان کم‌خونی. بسته اقتصادی 50 عددی. هر کپسول حاوی 50 میلی‌گرم آهن عنصری است.',
    195000, 280000,
    ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'],
    true, 80,
    ARRAY['آهن', 'کم‌خونی', 'فرول', 'کپسول', 'اقتصادی']
FROM data_prep; 