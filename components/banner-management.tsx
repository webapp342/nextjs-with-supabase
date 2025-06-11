'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  category_id?: string;
  link_category_id?: string;
  background_color: string;
  text_color: string;
  sort_order: number;
  is_active: boolean;
  category_name?: string;
  link_category_name?: string;
}

interface Category {
  id: string;
  name: string;
  level: number;
}

export function BannerManagement() {
  const supabase = createClient();
  
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    category_id: '',
    link_category_id: '',
    background_color: '#ffffff',
    text_color: '#000000',
    sort_order: 0,
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: bannerData, error: bannerError } = await supabase
        .from('category_banners')
        .select(`
          *,
          category:categories_new!category_banners_category_id_fkey(name),
          link_category:categories_new!category_banners_link_category_id_fkey(name)
        `)
        .order('sort_order');

      if (bannerError) throw bannerError;

      const transformedBanners = bannerData?.map(banner => ({
        ...banner,
        category_name: banner.category?.name || 'Ana Sayfa',
        link_category_name: banner.link_category?.name
      })) || [];

      setBanners(transformedBanners);

      const { data: categoryData, error: categoryError } = await supabase
        .from('categories_new')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (categoryError) throw categoryError;
      setCategories(categoryData || []);

    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const bannerData = {
        ...formData,
        category_id: formData.category_id || null,
        link_category_id: formData.link_category_id || null
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('category_banners')
          .update(bannerData)
          .eq('id', editingBanner.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('category_banners')
          .insert([bannerData]);

        if (error) throw error;
      }

      setFormData({
        title: '',
        subtitle: '',
        image_url: '',
        category_id: '',
        link_category_id: '',
        background_color: '#ffffff',
        text_color: '#000000',
        sort_order: 0,
        is_active: true
      });
      setEditingBanner(null);
      setShowForm(false);
      
      await fetchData();

    } catch (error: any) {
      console.error('Banner kayıt hatası:', error.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Banner'lar yükleniyor...</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Banner Yönetimi</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Banner
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingBanner ? 'Banner Düzenle' : 'Yeni Banner Ekle'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Banner Başlık *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="subtitle">Alt Başlık</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="image_url">Görsel URL *</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category_id">Banner Kategorisi</Label>
                  <select
                    id="category_id"
                    value={formData.category_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Ana Sayfa</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {'—'.repeat(cat.level * 2)} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="link_category_id">Link Kategorisi</Label>
                  <select
                    id="link_category_id"
                    value={formData.link_category_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_category_id: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Bağlantı yok</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {'—'.repeat(cat.level * 2)} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingBanner ? 'Güncelle' : 'Kaydet'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingBanner(null);
                  }}
                >
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners.map((banner) => (
          <Card key={banner.id}>
            <CardContent className="p-4">
              <div className="relative w-full h-32 rounded-lg overflow-hidden mb-3">
                <Image
                  src={banner.image_url}
                  alt={banner.title}
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="font-bold mb-2">{banner.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {banner.category_name}
              </p>
              <Badge variant={banner.is_active ? "default" : "secondary"}>
                {banner.is_active ? 'Aktif' : 'Pasif'}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 