-- Create storage bucket for images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the images bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own images" ON storage.objects 
FOR UPDATE USING (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own images" ON storage.objects 
FOR DELETE USING (bucket_id = 'images' AND auth.role() = 'authenticated'); 