'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { v4 as uuidv4 } from 'uuid';

export function ProductUploadForm() {
  const supabase = createClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [images, setImages] = useState<FileList | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(e.target.files);
    }
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newImageUrls = [...imageUrls];
    newImageUrls[index] = value;
    setImageUrls(newImageUrls);
  };

  const handleAddImageUrl = () => {
    setImageUrls([...imageUrls, '']);
  };

  const handleRemoveImageUrl = (index: number) => {
    const newImageUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newImageUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if ((!images || images.length === 0) && imageUrls.every(url => url.trim() === '')) {
      setMessage('Lütfen en az bir görsel seçin veya görsel URL\'si girin.');
      setLoading(false);
      return;
    }

    try {


      const uploadPromises = images ? Array.from(images).map(async (image) => {
        const fileExtension = image.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const filePath = `product_images/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, image);

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        if (publicUrlData) {
          return publicUrlData.publicUrl;
        }
        return null; // Should not happen if upload is successful
      }) : [];

      const uploadedUrls = await Promise.all(uploadPromises);
      const fileImageUrls = uploadedUrls.filter(url => url !== null) as string[];

      const inputImageUrls = imageUrls.map(url => url.trim()).filter(url => url !== '');

      const allImageUrls = [...fileImageUrls, ...inputImageUrls];

      if (allImageUrls.length === 0) {
        throw new Error('Görsel yüklenemedi.');
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Kullanıcı bilgileri alınamadı.');
      }

      const { data, error } = await supabase.from('products').insert([

        {
          name,
          description,
          price: parseFloat(price),
          category,
          brand,
          image_urls: allImageUrls,
          user_id: user.id,
        },
      ]);

      if (error) {
        throw error;
      }

      setMessage('Ürün başarıyla yüklendi!');
      setName('');
      setDescription('');
      setPrice('');
      setCategory('');
      setBrand('');
      setImages(null);
      setImageUrls(['']);
    } catch (error: any) {
      setMessage(`Ürün yüklenirken hata oluştu: ${error.message}`);
      console.error('Product upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Yeni Ürün Yükle</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Ürün Adı</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="price">Fiyat</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Kategori</Label>
            <Input
              id="category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="brand">Marka</Label>
            <Input
              id="brand"
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="images">Ürün Görselleri</Label>
            <Input
              id="images"
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
          <div>
            <Label>Görsel URL'leri</Label>
            {imageUrls.map((url, index) => (
              <div key={index} className="flex space-x-2 mb-2">
                <Input
                  type="text"
                  value={url}
                  onChange={(e) => handleImageUrlChange(index, e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                {imageUrls.length > 1 && (
                  <Button type="button" variant="destructive" onClick={() => handleRemoveImageUrl(index)}>
                    Kaldır
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" onClick={handleAddImageUrl}>
              + URL Ekle
            </Button>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Yükleniyor...' : 'Ürünü Yükle'}
          </Button>
          {message && <p className="text-sm mt-2">{message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}