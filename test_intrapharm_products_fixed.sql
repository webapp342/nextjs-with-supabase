-- Intrapharm markası için test ürünleri ekleyelim

-- Önce product type'ları ekle
WITH intrapharm_data AS (
    SELECT id as brand_id FROM brands WHERE slug = 'intrapharm' LIMIT 1
),
category_data AS (
    SELECT id as category_id FROM categories_new WHERE is_active = true LIMIT 1
)
INSERT INTO product_types (brand_id, category_id, name, slug, description, is_active, sort_order)
SELECT 
    i.brand_id,
    c.category_id,
    'کپسول فرول',
    'ferol-capsule',
    'کپسول‌های حاوی آهن فرول',
    true,
    1
FROM intrapharm_data i, category_data c
ON CONFLICT (brand_id, category_id, slug) DO NOTHING;

-- İkinci product type ekle
WITH intrapharm_data AS (
    SELECT id as brand_id FROM brands WHERE slug = 'intrapharm' LIMIT 1
),
category_data AS (
    SELECT id as category_id FROM categories_new WHERE is_active = true LIMIT 1
)
INSERT INTO product_types (brand_id, category_id, name, slug, description, is_active, sort_order)
SELECT 
    i.brand_id,
    c.category_id,
    'کپسول کلسیم',
    'calcium-capsule',
    'کپسول‌های کلسیم و ویتامین D',
    true,
    2
FROM intrapharm_data i, category_data c
ON CONFLICT (brand_id, category_id, slug) DO NOTHING;

-- Şimdi ürünleri ekle - Ferol 1
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

-- Ferol 2
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

-- Kalsiyum 1
WITH data_prep AS (
    SELECT 
        i.id as brand_id,
        c.id as category_id,
        pt.id as product_type_id,
        (SELECT DISTINCT user_id FROM products LIMIT 1) as user_id
    FROM brands i, categories_new c, product_types pt
    WHERE i.slug = 'intrapharm' 
    AND c.is_active = true 
    AND pt.slug = 'calcium-capsule' 
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
    'کپسول کلسیم ویتامین D اینترافارم بسته 30 عددی',
    'کپسول کلسیم کربنات به همراه ویتامین D3 برای تقویت استخوان‌ها و دندان‌ها. هر کپسول حاوی 500 میلی‌گرم کلسیم و 200 واحد ویتامین D3.',
    125000, 165000,
    ARRAY['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400'],
    true, 120,
    ARRAY['کلسیم', 'ویتامین D', 'استخوان', 'کپسول']
FROM data_prep;

-- Kalsiyum 2
WITH data_prep AS (
    SELECT 
        i.id as brand_id,
        c.id as category_id,
        pt.id as product_type_id,
        (SELECT DISTINCT user_id FROM products LIMIT 1) as user_id
    FROM brands i, categories_new c, product_types pt
    WHERE i.slug = 'intrapharm' 
    AND c.is_active = true 
    AND pt.slug = 'calcium-capsule' 
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
    'کپسول کلسیم مگنزیم اینترافارم بسته 60 عددی',
    'کپسول کلسیم و مگنزیم برای حفظ سلامت استخوان و عضلات. فرمولاسیون پیشرفته با جذب بالا. مناسب برای بزرگسالان.',
    235000, 320000,
    ARRAY['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400'],
    true, 95,
    ARRAY['کلسیم', 'مگنزیم', 'استخوان', 'عضله', 'کپسول']
FROM data_prep; 