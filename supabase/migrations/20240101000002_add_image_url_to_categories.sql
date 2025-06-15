-- Add image_url column to categories_new table
ALTER TABLE public.categories_new 
ADD COLUMN image_url text;

-- Add comment to the column
COMMENT ON COLUMN public.categories_new.image_url IS 'URL of the category image for display in menus and category pages'; 