-- Create grid_banners table
CREATE TABLE IF NOT EXISTS public.grid_banners (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    image_url text NOT NULL,
    mobile_image_url text,
    link_type text NOT NULL CHECK (link_type = ANY (ARRAY['category'::text, 'brand'::text, 'tag'::text, 'custom'::text])),
    link_category_id uuid,
    link_brand_id uuid,
    link_tag text,
    link_url text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT grid_banners_link_category_id_fkey FOREIGN KEY (link_category_id) REFERENCES public.categories_new(id),
    CONSTRAINT grid_banners_link_brand_id_fkey FOREIGN KEY (link_brand_id) REFERENCES public.brands(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_grid_banners_active ON public.grid_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_grid_banners_sort_order ON public.grid_banners(sort_order);

-- Enable RLS (Row Level Security)
ALTER TABLE public.grid_banners ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.grid_banners
    FOR SELECT USING (true);

CREATE POLICY "Enable all for authenticated users only" ON public.grid_banners
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample data
INSERT INTO public.grid_banners (title, image_url, link_type, link_category_id, sort_order, is_active) VALUES
('Cilt Bakım Ürünleri', 'https://via.placeholder.com/300x200/FF69B4/FFFFFF?text=Cilt+Bakım', 'category', (SELECT id FROM public.categories_new WHERE slug = 'cilt-bakim' LIMIT 1), 1, true),
('Makyaj Ürünleri', 'https://via.placeholder.com/300x200/FF1493/FFFFFF?text=Makyaj', 'category', (SELECT id FROM public.categories_new WHERE slug = 'makyaj' LIMIT 1), 2, true),
('Parfüm Koleksiyonu', 'https://via.placeholder.com/300x200/DC143C/FFFFFF?text=Parfüm', 'category', (SELECT id FROM public.categories_new WHERE slug = 'parfum' LIMIT 1), 3, true),
('Saç Bakım', 'https://via.placeholder.com/300x200/B22222/FFFFFF?text=Saç+Bakım', 'category', (SELECT id FROM public.categories_new WHERE slug = 'sac-bakim' LIMIT 1), 4, true),
('Chanel Markası', 'https://via.placeholder.com/300x200/FF6347/FFFFFF?text=Chanel', 'brand', (SELECT id FROM public.brands WHERE slug = 'chanel' LIMIT 1), 5, true),
('Dior Koleksiyonu', 'https://via.placeholder.com/300x200/FF4500/FFFFFF?text=Dior', 'brand', (SELECT id FROM public.brands WHERE slug = 'dior' LIMIT 1), 6, true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_grid_banners_updated_at
    BEFORE UPDATE ON public.grid_banners
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at(); 