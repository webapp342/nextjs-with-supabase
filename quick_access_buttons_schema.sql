-- Hızlı Erişim Butonları Tablosu
-- Bu tabloyu Supabase SQL Editor'da çalıştırın

CREATE TABLE IF NOT EXISTS public.quick_access_buttons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  link_url VARCHAR(500) NOT NULL,
  link_type VARCHAR(20) NOT NULL CHECK (link_type IN ('category', 'brand', 'custom')),
  link_category_id UUID REFERENCES public.categories_new(id) ON DELETE SET NULL,
  link_brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quick_access_buttons_active_sort 
ON public.quick_access_buttons (is_active, sort_order) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_quick_access_buttons_category 
ON public.quick_access_buttons (link_category_id) 
WHERE link_category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quick_access_buttons_brand 
ON public.quick_access_buttons (link_brand_id) 
WHERE link_brand_id IS NOT NULL;

-- RLS (Row Level Security) Policies
ALTER TABLE public.quick_access_buttons ENABLE ROW LEVEL SECURITY;

-- Public can read active quick access buttons
CREATE POLICY "Public can read active quick access buttons" 
ON public.quick_access_buttons
FOR SELECT 
USING (is_active = true);

-- Authenticated users can manage all quick access buttons
CREATE POLICY "Authenticated users can manage quick access buttons" 
ON public.quick_access_buttons
FOR ALL 
USING (auth.role() = 'authenticated');

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quick_access_buttons_updated_at 
BEFORE UPDATE ON public.quick_access_buttons 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data (optional)
INSERT INTO public.quick_access_buttons (title, link_type, link_url, sort_order, is_active) VALUES
('Ana Sayfa', 'custom', '/', 1, true),
('Tüm Ürünler', 'custom', '/products', 2, true),
('İndirimli Ürünler', 'custom', '/sale', 3, true),
('Yeni Ürünler', 'custom', '/new', 4, true),
('En Çok Satanlar', 'custom', '/bestsellers', 5, true)
ON CONFLICT DO NOTHING; 