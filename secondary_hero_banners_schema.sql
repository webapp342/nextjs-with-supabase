-- Secondary Hero Banners Table
CREATE TABLE IF NOT EXISTS secondary_hero_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  link_url TEXT NOT NULL,
  link_text TEXT,
  link_type TEXT NOT NULL CHECK (link_type IN ('category', 'brand', 'custom', 'tag')),
  link_category_id UUID REFERENCES categories_new(id) ON DELETE SET NULL,
  link_brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  link_tag TEXT,
  background_color TEXT NOT NULL DEFAULT '#ffffff',
  text_color TEXT NOT NULL DEFAULT '#000000',
  button_color TEXT NOT NULL DEFAULT '#e91e63',
  sort_order INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_secondary_hero_banners_active ON secondary_hero_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_secondary_hero_banners_sort_order ON secondary_hero_banners(sort_order);
CREATE INDEX IF NOT EXISTS idx_secondary_hero_banners_dates ON secondary_hero_banners(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_secondary_hero_banners_link_category ON secondary_hero_banners(link_category_id);
CREATE INDEX IF NOT EXISTS idx_secondary_hero_banners_link_brand ON secondary_hero_banners(link_brand_id);

-- Enable RLS
ALTER TABLE secondary_hero_banners ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to active secondary hero banners" ON secondary_hero_banners
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow authenticated users full access to secondary hero banners" ON secondary_hero_banners
  FOR ALL USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_secondary_hero_banners_updated_at 
  BEFORE UPDATE ON secondary_hero_banners 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO secondary_hero_banners (
  title, 
  subtitle, 
  description, 
  image_url, 
  link_url, 
  link_text, 
  link_type, 
  background_color, 
  text_color, 
  button_color, 
  sort_order
) VALUES 
(
  'Özel İndirim Kampanyası', 
  'Seçili ürünlerde %50&apos;ye varan indirim', 
  'Bu fırsat kaçmaz! Hemen alışverişe başlayın ve büyük tasarruf edin.',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
  '/tags/bestseller',
  'Hemen Keşfet',
  'tag',
  '#1a1a2e',
  '#ffffff',
  '#e91e63',
  1
),
(
  'Yeni Sezon Koleksiyonu', 
  'Trend ürünler şimdi mağazada', 
  'Yeni sezonun en şık ve kaliteli ürünlerini keşfedin.',
  'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&h=400&fit=crop',
  '/tags/new',
  'Koleksiyonu Gör',
  'tag',
  '#16213e',
  '#ffffff',
  '#0f3460',
  2
),
(
  'Premium Markalar', 
  'Dünya&apos;nın en iyi markalarından seçkiler', 
  'Kalite ve şıklığın buluştuğu premium ürünler sizleri bekliyor.',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
  '/tags/recommended',
  'Premium&apos;u Keşfet',
  'tag',
  '#2c3e50',
  '#ffffff',
  '#e74c3c',
  3
);

-- Grant necessary permissions
GRANT ALL ON secondary_hero_banners TO authenticated;
GRANT SELECT ON secondary_hero_banners TO anon; 