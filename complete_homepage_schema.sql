-- Ana Sayfa Yeni Düzen için Gerekli Tablolar
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Hızlı Erişim Butonları Tablosunu Güncelle (tag desteği ekle)
ALTER TABLE public.quick_access_buttons 
ADD COLUMN IF NOT EXISTS link_tag VARCHAR(50);

-- Link type constraint'ini güncelle
ALTER TABLE public.quick_access_buttons 
DROP CONSTRAINT IF EXISTS quick_access_buttons_link_type_check;

ALTER TABLE public.quick_access_buttons 
ADD CONSTRAINT quick_access_buttons_link_type_check 
CHECK (link_type IN ('category', 'brand', 'custom', 'tag'));

-- 2. Resimli Kategori Butonları Tablosu
CREATE TABLE IF NOT EXISTS public.category_image_buttons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  link_url VARCHAR(500) NOT NULL,
  link_type VARCHAR(20) NOT NULL CHECK (link_type IN ('category', 'brand', 'custom', 'tag')),
  link_category_id UUID REFERENCES public.categories_new(id) ON DELETE SET NULL,
  link_brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  link_tag VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Pozisyonlu Banner Tablosu
CREATE TABLE IF NOT EXISTS public.positioned_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  description TEXT,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  link_url TEXT,
  link_text VARCHAR(100),
  link_type VARCHAR(20) NOT NULL DEFAULT 'custom' CHECK (link_type IN ('category', 'brand', 'custom', 'tag')),
  link_category_id UUID REFERENCES public.categories_new(id) ON DELETE SET NULL,
  link_brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  link_tag VARCHAR(50),
  background_color VARCHAR(7) DEFAULT '#ffffff',
  text_color VARCHAR(7) DEFAULT '#000000',
  button_color VARCHAR(7) DEFAULT '#e91e63',
  position VARCHAR(50) NOT NULL CHECK (position IN ('home_middle_1', 'home_middle_2', 'home_special', 'home_bottom_1', 'home_bottom_2')),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_category_image_buttons_active_sort 
ON public.category_image_buttons (is_active, sort_order) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_category_image_buttons_category 
ON public.category_image_buttons (link_category_id) 
WHERE link_category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_positioned_banners_position_active 
ON public.positioned_banners (position, is_active, sort_order) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_positioned_banners_category 
ON public.positioned_banners (link_category_id) 
WHERE link_category_id IS NOT NULL;

-- RLS (Row Level Security) Policies

-- Category Image Buttons
ALTER TABLE public.category_image_buttons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active category image buttons" 
ON public.category_image_buttons
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can manage category image buttons" 
ON public.category_image_buttons
FOR ALL 
USING (auth.role() = 'authenticated');

-- Positioned Banners
ALTER TABLE public.positioned_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active positioned banners" 
ON public.positioned_banners
FOR SELECT 
USING (is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()));

CREATE POLICY "Authenticated users can manage positioned banners" 
ON public.positioned_banners
FOR ALL 
USING (auth.role() = 'authenticated');

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Category Image Buttons trigger
CREATE TRIGGER update_category_image_buttons_updated_at 
BEFORE UPDATE ON public.category_image_buttons 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Positioned Banners trigger
CREATE TRIGGER update_positioned_banners_updated_at 
BEFORE UPDATE ON public.positioned_banners 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data (optional)

-- Sample Category Image Buttons
INSERT INTO public.category_image_buttons (title, image_url, link_type, link_tag, link_url, sort_order, is_active) VALUES
('En Çok Satanlar', 'https://via.placeholder.com/64x64/e91e63/ffffff?text=★', 'tag', 'bestseller', '/tags/bestseller', 1, true),
('Yeni Ürünler', 'https://via.placeholder.com/64x64/4caf50/ffffff?text=NEW', 'tag', 'new', '/tags/new', 2, true),
('Önerilen', 'https://via.placeholder.com/64x64/ff9800/ffffff?text=♥', 'tag', 'recommended', '/tags/recommended', 3, true),
('İndirimli', 'https://via.placeholder.com/64x64/f44336/ffffff?text=%', 'custom', null, '/sale', 4, true)
ON CONFLICT DO NOTHING;

-- Sample Positioned Banners
INSERT INTO public.positioned_banners (title, subtitle, description, image_url, link_url, link_text, position, sort_order, is_active) VALUES
('Orta Banner 1', 'Özel İndirim', 'Seçili ürünlerde %50 indirim fırsatı', 'https://via.placeholder.com/800x300/e91e63/ffffff?text=Orta+Banner+1', '/sale', 'İndirimleri Gör', 'home_middle_1', 1, true),
('Orta Banner 2', 'Yeni Koleksiyon', 'Bahar koleksiyonu şimdi mağazalarda', 'https://via.placeholder.com/800x300/4caf50/ffffff?text=Orta+Banner+2', '/new', 'Koleksiyonu İncele', 'home_middle_2', 1, true),
('Özel Hero Banner', 'Premium Ürünler', 'Kaliteli ve şık ürünler için doğru adres', 'https://via.placeholder.com/800x400/ff9800/ffffff?text=Özel+Hero', '/premium', 'Keşfet', 'home_special', 1, true),
('Alt Banner 1', 'Ücretsiz Kargo', '150 TL ve üzeri alışverişlerde ücretsiz kargo', 'https://via.placeholder.com/800x300/9c27b0/ffffff?text=Alt+Banner+1', '/shipping', 'Detaylar', 'home_bottom_1', 1, true),
('Alt Banner 2', 'Müşteri Hizmetleri', '7/24 müşteri desteği ile yanınızdayız', 'https://via.placeholder.com/800x300/607d8b/ffffff?text=Alt+Banner+2', '/support', 'İletişim', 'home_bottom_2', 1, true)
ON CONFLICT DO NOTHING;

-- Storage bucket for images (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies for images bucket
CREATE POLICY "Public can view images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update images" ON storage.objects
FOR UPDATE USING (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete images" ON storage.objects
FOR DELETE USING (bucket_id = 'images' AND auth.role() = 'authenticated'); 