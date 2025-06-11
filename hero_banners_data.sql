-- Ana Sayfa Hero Banner'ları için Örnek Data

-- Hero banners tablosu oluştur
CREATE TABLE IF NOT EXISTS hero_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  description TEXT,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  link_url TEXT,
  link_text VARCHAR(100),
  background_color VARCHAR(7) DEFAULT '#ffffff',
  text_color VARCHAR(7) DEFAULT '#000000',
  button_color VARCHAR(7) DEFAULT '#e91e63',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hero banner'ları ekle
INSERT INTO hero_banners (title, subtitle, description, image_url, link_url, link_text, background_color, text_color, button_color, sort_order, is_active)
SELECT 'زیبایی و جذابیت بادینفکتو', 'تا ۴۰٪ تخفیف', 'مجموعه کاملی از محصولات آرایشی و بهداشتی', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800', '/category/makeup', 'مشاهده و خرید', '#fce4ec', '#000000', '#e91e63', 1, true
WHERE NOT EXISTS (SELECT 1 FROM hero_banners WHERE title = 'زیبایی و جذابیت بادینفکتو');

INSERT INTO hero_banners (title, subtitle, description, image_url, link_url, link_text, background_color, text_color, button_color, sort_order, is_active)
SELECT 'برای خودت طلا بخرا!', 'کیفیت پریمیوم', 'محصولات طلایی برای مراقبت از پوست', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800', '/category/skincare', 'مشاهده و خرید', '#fff3e0', '#000000', '#ff9800', 2, true
WHERE NOT EXISTS (SELECT 1 FROM hero_banners WHERE title = 'برای خودت طلا بخرا!');

INSERT INTO hero_banners (title, subtitle, description, image_url, link_url, link_text, background_color, text_color, button_color, sort_order, is_active)
SELECT 'خرید فوری با Snapp! Pay', 'پرداخت آسان و سریع', 'تجربه خرید بهتر با پرداخت دیجیتال', 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800', '/payment', 'خرید فوری', '#e3f2fd', '#000000', '#2196f3', 3, true
WHERE NOT EXISTS (SELECT 1 FROM hero_banners WHERE title = 'خرید فوری با Snapp! Pay');

INSERT INTO hero_banners (title, subtitle, description, image_url, link_url, link_text, background_color, text_color, button_color, sort_order, is_active)
SELECT 'عطرهای اصیل و لوکس', 'مجموعه منحصر به فرد', 'بهترین عطرهای برندهای معتبر جهان', 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800', '/category/fragrance', 'مشاهده و خرید', '#f3e5f5', '#000000', '#9c27b0', 4, true
WHERE NOT EXISTS (SELECT 1 FROM hero_banners WHERE title = 'عطرهای اصیل و لوکس');

INSERT INTO hero_banners (title, subtitle, description, image_url, link_url, link_text, background_color, text_color, button_color, sort_order, is_active)
SELECT 'مراقبت پوست حرفه‌ای', 'محصولات درماتولوژی', 'کرم‌ها و سرم‌های پیشرفته برای پوست سالم', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800', '/category/skincare', 'مشاهده و خرید', '#e8f5e8', '#000000', '#4caf50', 5, true
WHERE NOT EXISTS (SELECT 1 FROM hero_banners WHERE title = 'مراقبت پوست حرفه‌ای');

-- Index'ler ekle
CREATE INDEX IF NOT EXISTS idx_hero_banners_sort_order ON hero_banners(sort_order);
CREATE INDEX IF NOT EXISTS idx_hero_banners_active ON hero_banners(is_active); 