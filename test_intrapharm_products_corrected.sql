-- Intrapharm markası için test ürünleri - Düzeltilmiş versiyon

-- Doğru slug kullanarak ürün ekle: fefol-capsules
WITH data_prep AS (
    SELECT 
        i.id as brand_id,
        c.id as category_id,
        pt.id as product_type_id,
        'b175934a-83e3-4c0d-ace3-b003a35e2d76'::uuid as user_id
    FROM brands i, categories_new c, product_types pt
    WHERE i.slug = 'intrapharm' 
    AND c.slug = 'makeup'
    AND pt.slug = 'fefol-capsules' 
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
    'کپسول ففول اینترافارم بسته 20 عددی',
    'کپسول ففول حاوی آهن برای درمان کم‌خونی. هر کپسول حاوی 50 میلی‌گرم آهن عنصری است. مناسب برای بزرگسالان و کودکان بالای 12 سال.',
    89000, 125000,
    ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'],
    true, 150,
    ARRAY['آهن', 'کم‌خونی', 'ففول', 'کپسول']
FROM data_prep;

-- İkinci ففول ürünü
WITH data_prep AS (
    SELECT 
        i.id as brand_id,
        c.id as category_id,
        pt.id as product_type_id,
        'b175934a-83e3-4c0d-ace3-b003a35e2d76'::uuid as user_id
    FROM brands i, categories_new c, product_types pt
    WHERE i.slug = 'intrapharm' 
    AND c.slug = 'makeup'
    AND pt.slug = 'fefol-capsules' 
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
    'کپسول ففول اینترافارم بسته 50 عددی',
    'کپسول ففول حاوی آهن برای درمان کم‌خونی. بسته اقتصادی 50 عددی. هر کپسول حاوی 50 میلی‌گرم آهن عنصری است.',
    195000, 280000,
    ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'],
    true, 80,
    ARRAY['آهن', 'کم‌خونی', 'ففول', 'کپسول', 'اقتصادی']
FROM data_prep; 