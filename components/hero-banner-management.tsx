'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload,
  Eye,
  EyeOff,
  Calendar,
  Link as LinkIcon,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import Image from 'next/image';


interface HeroBanner {
  id: string;
  title: string;
  image_url: string;
  mobile_image_url?: string;
  link_type?: 'category' | 'brand' | 'url' | 'tag';
  link_category_id?: string;
  link_brand_id?: string;
  link_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
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

interface FormData {
  title: string;
  image_url: string;
  mobile_image_url: string;
  link_type: 'category' | 'brand' | 'url' | 'tag';
  link_category_id: string;
  link_brand_id: string;
  link_url: string;
  sort_order: number;
  is_active: boolean;
}

export function HeroBannerManagement() {
  const supabase = createClient();
  
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    image_url: '',
    mobile_image_url: '',
    link_type: 'url',
    link_category_id: '',
    link_brand_id: '',
    link_url: '',
    sort_order: 0,
    is_active: true
  });

  const fetchData = useCallback(async () => {
    try {
      const { data: bannerData, error: bannerError } = await supabase
        .from('hero_banners')
        .select('*')
        .order('sort_order');

      if (bannerError) throw bannerError;
      setBanners(bannerData || []);

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

  const resetForm = () => {
    setFormData({
      title: '',
      image_url: '',
      mobile_image_url: '',
      link_type: 'url',
      link_category_id: '',
      link_brand_id: '',
      link_url: '',
      sort_order: banners.length,
      is_active: true
    });
    setEditingBanner(null);
    setShowForm(false);
  };

  const handleEdit = (banner: HeroBanner) => {
    setFormData({
      title: banner.title,
      image_url: banner.image_url,
      mobile_image_url: banner.mobile_image_url || '',
      link_type: banner.link_type || 'url',
      link_category_id: banner.link_category_id || '',
      link_brand_id: banner.link_brand_id || '',
      link_url: banner.link_url || '',
      sort_order: banner.sort_order,
      is_active: banner.is_active
    });
    setEditingBanner(banner);
    setShowForm(true);
  };

  const handleDelete = async (bannerId: string) => {
    if (!confirm('Bu hero banner\'ı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('hero_banners')
        .delete()
        .eq('id', bannerId);

      if (error) throw error;
      
      await fetchData();
      alert('Hero banner başarıyla silindi!');
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme hatası: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMobile = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const fileName = `hero-banners/${isMobile ? 'mobile-' : ''}${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('banners')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase
        .storage
        .from('products')
        .getPublicUrl(fileName);

      const field = isMobile ? 'mobile_image_url' : 'image_url';
      setFormData(prev => ({ ...prev, [field]: publicUrl }));
    } catch (error) {
      console.error('Resim yükleme hatası:', error);
      alert('Resim yükleme hatası: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bannerData = {
        title: formData.title,
        image_url: formData.image_url,
        mobile_image_url: formData.mobile_image_url || null,
        link_type: formData.link_type,
        link_category_id: formData.link_type === 'category' ? formData.link_category_id || null : null,
        link_brand_id: formData.link_type === 'brand' ? formData.link_brand_id || null : null,
        link_url: formData.link_type === 'url' ? formData.link_url : 
                 formData.link_type === 'category' ? `/category/${categories.find(c => c.id === formData.link_category_id)?.name || ''}` :
                 formData.link_type === 'brand' ? `/brand/${brands.find(b => b.id === formData.link_brand_id)?.slug || ''}` :
                 formData.link_url || null,
        sort_order: formData.sort_order,
        is_active: formData.is_active
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('hero_banners')
          .update(bannerData)
          .eq('id', editingBanner.id);

        if (error) throw error;
        alert('Hero banner başarıyla güncellendi!');
      } else {
        const { error } = await supabase
          .from('hero_banners')
          .insert([bannerData]);

        if (error) throw error;
        alert('Hero banner başarıyla eklendi!');
      }

      await fetchData();
      resetForm();
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Kaydetme hatası: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (bannerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('hero_banners')
        .update({ is_active: !currentStatus })
        .eq('id', bannerId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
    }
  };

  const updateSortOrder = async (bannerId: string, direction: 'up' | 'down') => {
    const banner = banners.find(b => b.id === bannerId);
    if (!banner) return;

    const newOrder = direction === 'up' ? banner.sort_order - 1 : banner.sort_order + 1;
    const swapBanner = banners.find(b => b.sort_order === newOrder);

    if (!swapBanner) return;

    try {
      // Swap sort orders
      await supabase
        .from('hero_banners')
        .update({ sort_order: newOrder })
        .eq('id', bannerId);

      await supabase
        .from('hero_banners')
        .update({ sort_order: banner.sort_order })
        .eq('id', swapBanner.id);

      await fetchData();
    } catch (error) {
      console.error('Sıralama güncelleme hatası:', error);
    }
  };

  if (loading && banners.length === 0) {
    return <div className="p-8 text-center">Hero banner&apos;lar yükleniyor...</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Hero Banner Yönetimi</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Hero Banner
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingBanner ? 'Hero Banner Düzenle' : 'Yeni Hero Banner Ekle'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Başlık *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Desktop Image */}
              <div>
                <Label>Desktop Görseli *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Önerilen boyut: 1200x400px veya daha büyük. Yüksek kaliteli görsel kullanın.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, false)}
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Yükleniyor...' : 'Desktop Resim Yükle'}
                    </Button>
                  </div>
                  <Input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="Veya resim URL'si girin"
                    required
                  />
                  {formData.image_url && (
                    <div className="relative h-32 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={formData.image_url}
                        alt="Desktop Preview"
                        fill
                        className="object-cover w-full h-full"
                        quality={95}
                        unoptimized
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Image */}
              <div>
                <Label>Mobil Görseli (Opsiyonel)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Önerilen boyut: 800x600px veya daha büyük. Mobil cihazlar için optimize edilmiş görsel.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, true)}
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Yükleniyor...' : 'Mobil Resim Yükle'}
                    </Button>
                  </div>
                  <Input
                    type="url"
                    value={formData.mobile_image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobile_image_url: e.target.value }))}
                    placeholder="Veya mobil resim URL'si girin"
                  />
                  {formData.mobile_image_url && (
                    <div className="relative h-32 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={formData.mobile_image_url}
                        alt="Mobile Preview"
                        fill
                        className="object-cover w-full h-full"
                        quality={95}
                        unoptimized
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Link Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="link_type">Link Türü</Label>
                  <select
                    value={formData.link_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_type: e.target.value as 'category' | 'brand' | 'url' | 'tag' }))}
                  >
                    <option value="category">Kategori</option>
                    <option value="brand">Marka</option>
                    <option value="url">URL</option>
                    <option value="tag">Etiket</option>
                  </select>
                </div>

                {formData.link_type === 'category' && (
                  <div>
                    <Label htmlFor="link_category_id">Kategori</Label>
                    <select
                      value={formData.link_category_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, link_category_id: e.target.value }))}
                    >
                      <option value="">Kategori seçin</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.link_type === 'brand' && (
                  <div>
                    <Label htmlFor="link_brand_id">Marka</Label>
                    <select
                      value={formData.link_brand_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, link_brand_id: e.target.value }))}
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

                {formData.link_type === 'url' && (
                  <div>
                    <Label htmlFor="link_url">Link URL</Label>
                    <Input
                      id="link_url"
                      value={formData.link_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                      placeholder="/category/makeup"
                    />
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sort_order">Sıralama</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="is_active">Aktif</Label>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Kaydediliyor...' : (editingBanner ? 'Güncelle' : 'Ekle')}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Banner List */}
      <div className="grid gap-4">
        {banners.map((banner) => (
          <Card key={banner.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Banner Image */}
                <div className="relative w-32 h-20 rounded-lg overflow-hidden flex-shrink-0 border">
                  <Image
                    src={banner.image_url}
                    alt={banner.title}
                    fill
                    className="object-cover w-full h-full"
                    quality={95}
                    unoptimized
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  />
                </div>

                {/* Banner Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{banner.title}</h3>
                      {banner.mobile_image_url && (
                        <p className="text-gray-600 text-sm">📱 Mobil görsel var</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={banner.is_active ? "default" : "secondary"}>
                        {banner.is_active ? 'Aktif' : 'Pasif'}
                      </Badge>
                      <Badge variant="outline">
                        Sıra: {banner.sort_order}
                      </Badge>
                    </div>
                  </div>

                  {/* Banner Details */}
                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                    {banner.link_url && (
                      <div className="flex items-center gap-1">
                        <LinkIcon className="w-4 h-4" />
                        <span>Link var</span>
                      </div>
                    )}
                    {banner.created_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(banner.created_at).toLocaleDateString('tr-TR')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateSortOrder(banner.id, 'up')}
                      disabled={banner.sort_order === 0}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateSortOrder(banner.id, 'down')}
                      disabled={banner.sort_order === banners.length - 1}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(banner.id, banner.is_active)}
                  >
                    {banner.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(banner)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(banner.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {banners.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Henüz hero banner eklenmemiş. İlk hero banner&apos;ınızı eklemek için yukarıdaki butonu kullanın.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 
