'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import { HierarchicalCategorySelector } from './hierarchical-category-selector';

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  category_id?: string;
  link_category_id?: string;
  link_brand_id?: string;
  link_url?: string;
  link_type?: 'category' | 'brand' | 'url' | 'tag';
  background_color: string;
  text_color: string;
  sort_order: number;
  is_active: boolean;
  category_name?: string;
  link_category_name?: string;
  link_brand_name?: string;
}

interface Category {
  id: string;
  name: string;
  level: number;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
}

export function BannerManagement() {
  const supabase = createClient();
  
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    category_id: '',
    link_type: 'category' as 'category' | 'brand' | 'url' | 'tag',
    link_category_id: '',
    link_brand_id: '',
    link_url: '',
    background_color: '#ffffff',
    text_color: '#000000',
    sort_order: 0,
    is_active: true
  });

  const fetchData = useCallback(async () => {
    try {
      const { data: bannerData, error: bannerError } = await supabase
        .from('category_banners')
        .select(`
          *,
          category:categories_new!category_banners_category_id_fkey(name),
          link_category:categories_new!category_banners_link_category_id_fkey(name),
          link_brand:brands!category_banners_link_brand_id_fkey(name)
        `)
        .order('sort_order');

      if (bannerError) throw bannerError;

      const transformedBanners = bannerData?.map(banner => ({
        ...banner,
        category_name: banner.category?.name || 'Ana Sayfa',
        link_category_name: banner.link_category?.name,
        link_brand_name: banner.link_brand?.name
      })) || [];

      setBanners(transformedBanners);

      const [categoryRes, brandRes] = await Promise.all([
        supabase.from('categories_new').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('brands').select('id, name, slug').eq('is_active', true).order('name')
      ]);

      if (categoryRes.error) throw categoryRes.error;
      if (brandRes.error) throw brandRes.error;
      
      setCategories(categoryRes.data || []);
      setBrands(brandRes.data || []);

    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (banner: Banner) => {
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      image_url: banner.image_url,
      category_id: banner.category_id || '',
      link_type: banner.link_type || 'category',
      link_category_id: banner.link_category_id || '',
      link_brand_id: banner.link_brand_id || '',
      link_url: banner.link_url || '',
      background_color: banner.background_color,
      text_color: banner.text_color,
      sort_order: banner.sort_order,
      is_active: banner.is_active
    });
    setEditingBanner(banner);
    setShowForm(true);
  };

  const handleDelete = async (bannerId: string) => {
    if (!confirm('Bu banner\'ı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('category_banners')
        .delete()
        .eq('id', bannerId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Banner silme hatası:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const bannerData = {
        ...formData,
        category_id: formData.category_id || null,
        link_category_id: formData.link_type === 'category' ? formData.link_category_id || null : null,
        link_brand_id: formData.link_type === 'brand' ? formData.link_brand_id || null : null,
        link_url: ['url', 'tag'].includes(formData.link_type) ? formData.link_url || null : null
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
        link_type: 'category',
        link_category_id: '',
        link_brand_id: '',
        link_url: '',
        background_color: '#ffffff',
        text_color: '#000000',
        sort_order: 0,
        is_active: true
      });
      setEditingBanner(null);
      setShowForm(false);
      
      await fetchData();

    } catch (error: unknown) {
      console.error('Banner kayıt hatası:', error instanceof Error ? error.message : 'Bilinmeyen hata');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      // Upload to 'images' bucket (standard bucket name)
      const fileName = `banners/${Date.now()}-${file.name}`;
      const { error } = await supabase
        .storage
        .from('images')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('images')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
    } catch (error) {
      console.error('Resim yükleme hatası:', error);
      alert('Resim yükleme hatası: ' + (error as any).message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Banner&apos;lar yükleniyor...</div>;
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
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Yükleniyor...' : 'Resim Yükle'}
                    </Button>
                  </div>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="Veya resim URL'si girin"
                    required
                  />
                  {formData.image_url && (
                    <div className="mt-2 relative w-32 h-20 rounded-lg overflow-hidden">
                      <Image
                        src={formData.image_url}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
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
                  <Label htmlFor="link_type">Link Türü</Label>
                  <select
                    id="link_type"
                    value={formData.link_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_type: e.target.value as any }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="category">Kategori</option>
                    <option value="brand">Marka</option>
                    <option value="tag">Etiket (Bestseller/Recommended/New)</option>
                    <option value="url">Özel URL</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Link Fields */}
              {formData.link_type === 'category' && (
                <div>
                  <Label>Link Kategorisi</Label>
                  <HierarchicalCategorySelector
                    value={formData.link_category_id}
                    onChange={(categoryId) => setFormData(prev => ({ ...prev, link_category_id: categoryId }))}
                    required={false}
                  />
                  <div className="text-xs text-muted-foreground mt-2">
                    Banner tıklandığında yönlendirilecek kategoriyi seçin. Alt kategori seçebilir, ana kategoriye de yönlendirebilirsiniz.
                  </div>
                </div>
              )}

              {formData.link_type === 'brand' && (
                <div>
                  <Label htmlFor="link_brand_id">Marka</Label>
                  <select
                    id="link_brand_id"
                    value={formData.link_brand_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_brand_id: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Marka seçin</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.link_type === 'tag' && (
                <div>
                  <Label htmlFor="link_url">Etiket</Label>
                  <select
                    id="link_url"
                    value={formData.link_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Etiket seçin</option>
                    <option value="bestseller">Çok Satanlar</option>
                    <option value="recommended">Önerilen</option>
                    <option value="new">Yeni Ürünler</option>
                  </select>
                </div>
              )}

              {formData.link_type === 'url' && (
                <div>
                  <Label htmlFor="link_url">URL</Label>
                  <Input
                    id="link_url"
                    value={formData.link_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                    placeholder="/custom-page veya https://external.com"
                  />
                </div>
              )}

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
              <div className="flex items-center justify-between">
                <Badge variant={banner.is_active ? "default" : "secondary"}>
                  {banner.is_active ? 'Aktif' : 'Pasif'}
                </Badge>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(banner)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Düzenle
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(banner.id)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Sil
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 