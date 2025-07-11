'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { categories } from '@/lib/categories';

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
      setMessage('Lütfen en az bir görsel seçin veya görsel URL&apos;si girin.');
      setLoading(false);
      return;
    }

    try {


      const uploadPromises = images ? Array.from(images).map(async (image) => {
        const fileExtension = image.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const filePath = `product_images/${fileName}`;

        const { error: uploadError } = await supabase.storage
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

      const { error } = await supabase.from('products').insert([

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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
      setMessage(`Ürün yüklenirken hata oluştu: ${errorMessage}`);
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
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Kategori seçin</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
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
            <Label htmlFor="image-url-0">Görsel URL&apos;si (Opsiyonel)</Label>
            <Input
              id="image-url-0"
              type="url"
              value={imageUrls[0]}
              onChange={(e) => handleImageUrlChange(0, e.target.value)}
            />
          </div>
          {imageUrls.slice(1).map((url, index) => (
            <div key={index + 1} className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor={`image-url-${index + 1}`}>Görsel URL&apos;si {index + 2}</Label>
                <Input
                  id={`image-url-${index + 1}`}
                  type="url"
                  value={url}
                  onChange={(e) => handleImageUrlChange(index + 1, e.target.value)}
                />
              </div>
              <Button type="button" variant="destructive" onClick={() => handleRemoveImageUrl(index + 1)}>
                Kaldır
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={handleAddImageUrl}>
            Başka Görsel URL&apos;si Ekle
          </Button>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Yükleniyor...' : 'Ürün Yükle'}
          </Button>
          {message && <p className="text-center text-sm text-green-500">{message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}