-- Create top_brands table
CREATE TABLE IF NOT EXISTS public.top_brands (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  image_url text NOT NULL,
  brand_id uuid NOT NULL,
  link_type character varying DEFAULT 'brand'::character varying CHECK (link_type::text = ANY (ARRAY['category'::character varying, 'brand'::character varying, 'url'::character varying, 'tag'::character varying]::text[])),
  link_category_id uuid,
  link_brand_id uuid,
  link_url text,
  link_tag character varying,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT top_brands_pkey PRIMARY KEY (id),
  CONSTRAINT top_brands_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id),
  CONSTRAINT top_brands_link_category_id_fkey FOREIGN KEY (link_category_id) REFERENCES public.categories_new(id),
  CONSTRAINT top_brands_link_brand_id_fkey FOREIGN KEY (link_brand_id) REFERENCES public.brands(id)
);

-- Create indexes for top_brands
CREATE INDEX IF NOT EXISTS idx_top_brands_sort_order ON public.top_brands(sort_order);
CREATE INDEX IF NOT EXISTS idx_top_brands_is_active ON public.top_brands(is_active);
CREATE INDEX IF NOT EXISTS idx_top_brands_brand_id ON public.top_brands(brand_id);

-- Enable RLS for top_brands
ALTER TABLE public.top_brands ENABLE ROW LEVEL SECURITY;

-- Create policies for top_brands
CREATE POLICY "Enable read access for all users" ON public.top_brands FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.top_brands FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.top_brands FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.top_brands FOR DELETE USING (auth.role() = 'authenticated'); 