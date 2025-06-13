-- Add new columns to products table for recommended and new product flags
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_recommended boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_new boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.products.is_recommended IS 'Flag to mark products as recommended for homepage display';
COMMENT ON COLUMN public.products.is_new IS 'Flag to mark products as new for homepage display';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_is_recommended ON public.products(is_recommended) WHERE is_recommended = true;
CREATE INDEX IF NOT EXISTS idx_products_is_new ON public.products(is_new) WHERE is_new = true; 