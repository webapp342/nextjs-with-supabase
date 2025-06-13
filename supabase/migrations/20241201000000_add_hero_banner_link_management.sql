-- Add link management columns to hero_banners table
ALTER TABLE public.hero_banners 
ADD COLUMN IF NOT EXISTS link_type character varying DEFAULT 'url'::character varying,
ADD COLUMN IF NOT EXISTS link_category_id uuid,
ADD COLUMN IF NOT EXISTS link_brand_id uuid;

-- Add check constraint for link_type
ALTER TABLE public.hero_banners 
ADD CONSTRAINT hero_banners_link_type_check 
CHECK (link_type = ANY (ARRAY['category'::character varying, 'brand'::character varying, 'url'::character varying, 'tag'::character varying]));

-- Add foreign key constraints
ALTER TABLE public.hero_banners 
ADD CONSTRAINT hero_banners_link_category_id_fkey 
FOREIGN KEY (link_category_id) REFERENCES public.categories_new(id);

ALTER TABLE public.hero_banners 
ADD CONSTRAINT hero_banners_link_brand_id_fkey 
FOREIGN KEY (link_brand_id) REFERENCES public.brands(id);

-- Update existing records to have default link_type
UPDATE public.hero_banners 
SET link_type = 'url' 
WHERE link_type IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hero_banners_link_category ON public.hero_banners(link_category_id);
CREATE INDEX IF NOT EXISTS idx_hero_banners_link_brand ON public.hero_banners(link_brand_id);
CREATE INDEX IF NOT EXISTS idx_hero_banners_link_type ON public.hero_banners(link_type); 