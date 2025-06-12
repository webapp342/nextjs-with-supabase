-- Intrapharm için farklı product type'lar ve ürünler

-- Önce yeni product type ekle: Vitamin Kapsülleri
WITH brand_category AS (
    SELECT 
        i.id as brand_id,
        c.id as category_id
    FROM brands i, categories_new c
    WHERE i.slug = 'intrapharm' 
    AND c.slug = 'makeup'
    LIMIT 1
)
INSERT INTO product_types (brand_id, category_id, name, slug, description, is_active, sort_order)
SELECT 
    brand_id, category_id,
    'کپسول ویتامین',
    'vitamin-capsules',
    'کپسول‌های ویتامین و مواد معدنی',
    true,
    2
FROM brand_category;

-- 1. Fefol ürünü ekle (mevcut type)
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
    'کپسول ففول حاوی آهن برای درمان کم‌خونی. هر کپسول حاوی 50 میلی‌گرم آهن عنصری است.',
    89000, 125000,
    ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'],
    true, 150,
    ARRAY['آهن', 'کم‌خونی', 'ففول', 'کپسول']
FROM data_prep;

-- 2. İkinci Fefol ürünü
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
    'کپسول ففول حاوی آهن برای درمان کم‌خونی. بسته اقتصادی 50 عددی.',
    195000, 280000,
    ARRAY['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'],
    true, 80,
    ARRAY['آهن', 'کم‌خونی', 'ففول', 'کپسول', 'اقتصادی']
FROM data_prep;

-- 3. Vitamin ürünü ekle (yeni type)
WITH data_prep AS (
    SELECT 
        i.id as brand_id,
        c.id as category_id,
        pt.id as product_type_id,
        'b175934a-83e3-4c0d-ace3-b003a35e2d76'::uuid as user_id
    FROM brands i, categories_new c, product_types pt
    WHERE i.slug = 'intrapharm' 
    AND c.slug = 'makeup'
    AND pt.slug = 'vitamin-capsules' 
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
    'کپسول ویتامین D اینترافارم بسته 30 عددی',
    'کپسول ویتامین D3 برای تقویت استخوان‌ها و سیستم ایمنی. هر کپسول حاوی 1000 واحد ویتامین D3.',
    125000, 165000,
    ARRAY['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400'],
    true, 120,
    ARRAY['ویتامین D', 'استخوان', 'ایمنی', 'کپسول']
FROM data_prep;

-- 4. İkinci Vitamin ürünü
WITH data_prep AS (
    SELECT 
        i.id as brand_id,
        c.id as category_id,
        pt.id as product_type_id,
        'b175934a-83e3-4c0d-ace3-b003a35e2d76'::uuid as user_id
    FROM brands i, categories_new c, product_types pt
    WHERE i.slug = 'intrapharm' 
    AND c.slug = 'makeup'
    AND pt.slug = 'vitamin-capsules' 
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
    'کپسول مولتی ویتامین اینترافارم بسته 60 عددی',
    'کپسول مولتی ویتامین و مواد معدنی کامل برای تامین نیازهای روزانه بدن. حاوی 12 ویتامین و 8 ماده معدنی.',
    245000, 320000,
    ARRAY['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400'],
    true, 95,
    ARRAY['مولتی ویتامین', 'مواد معدنی', 'کامل', 'کپسول']
FROM data_prep; 