'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Palette,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import Image from 'next/image';

interface HeroBanner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  mobile_image_url?: string;
  link_url?: string;
  link_text?: string;
  background_color: string;
  text_color: string;
  button_color: string;
  sort_order: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

interface FormData {
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  mobile_image_url: string;
  link_url: string;
  link_text: string;
  background_color: string;
  text_color: string;
  button_color: string;
  sort_order: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
}

export function HeroBannerManagement() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const supabase = createClient();

  const [formData, setFormData] = useState<FormData>({
    title: '',
    subtitle: '',
    description: '',
    image_url: '',
    mobile_image_url: '',
    link_url: '',
    link_text: '',
    background_color: '#ffffff',
    text_color: '#000000',
    button_color: '#e91e63',
    sort_order: 0,
    is_active: true,
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Hero banner yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      image_url: '',
      mobile_image_url: '',
      link_url: '',
      link_text: '',
      background_color: '#ffffff',
      text_color: '#000000',
      button_color: '#e91e63',
      sort_order: banners.length,
      is_active: true,
      start_date: '',
      end_date: ''
    });
    setEditingBanner(null);
    setShowForm(false);
  };

  const handleEdit = (banner: HeroBanner) => {
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      image_url: banner.image_url,
      mobile_image_url: banner.mobile_image_url || '',
      link_url: banner.link_url || '',
      link_text: banner.link_text || '',
      background_color: banner.background_color,
      text_color: banner.text_color,
      button_color: banner.button_color,
      sort_order: banner.sort_order,
      is_active: banner.is_active,
      start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
      end_date: banner.end_date ? banner.end_date.split('T')[0] : ''
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
      
      await fetchBanners();
      alert('Hero banner başarıyla silindi!');
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme hatası: ' + (error as any).message);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMobile = false) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const setUploadState = isMobile ? setUploadingMobile : setUploading;
    setUploadState(true);

    try {
      const fileName = `hero-banners/${isMobile ? 'mobile-' : ''}${Date.now()}-${file.name}`;
      const { data, error } = await supabase
        .storage
        .from('images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase
        .storage
        .from('images')
        .getPublicUrl(fileName);

      const field = isMobile ? 'mobile_image_url' : 'image_url';
      setFormData(prev => ({ ...prev, [field]: publicUrl }));
    } catch (error) {
      console.error('Resim yükleme hatası:', error);
      alert('Resim yükleme hatası: ' + (error as any).message);
    } finally {
      setUploadState(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('hero_banners')
          .update(submitData)
          .eq('id', editingBanner.id);

        if (error) throw error;
        alert('Hero banner başarıyla güncellendi!');
      } else {
        const { error } = await supabase
          .from('hero_banners')
          .insert([submitData]);

        if (error) throw error;
        alert('Hero banner başarıyla eklendi!');
      }

      await fetchBanners();
      resetForm();
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Kaydetme hatası: ' + (error as any).message);
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
      await fetchBanners();
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

      await fetchBanners();
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
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Desktop Image */}
              <div>
                <Label>Desktop Görseli *</Label>
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
                    <div className="relative w-full h-32 rounded-lg overflow-hidden">
                      <Image
                        src={formData.image_url}
                        alt="Desktop Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Image */}
              <div>
                <Label>Mobil Görseli (Opsiyonel)</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, true)}
                      disabled={uploadingMobile}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingMobile}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingMobile ? 'Yükleniyor...' : 'Mobil Resim Yükle'}
                    </Button>
                  </div>
                  <Input
                    type="url"
                    value={formData.mobile_image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobile_image_url: e.target.value }))}
                    placeholder="Veya mobil resim URL'si girin"
                  />
                  {formData.mobile_image_url && (
                    <div className="relative w-32 h-20 rounded-lg overflow-hidden">
                      <Image
                        src={formData.mobile_image_url}
                        alt="Mobile Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Link Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="link_url">Link URL</Label>
                  <Input
                    id="link_url"
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="link_text">Buton Metni</Label>
                  <Input
                    id="link_text"
                    value={formData.link_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_text: e.target.value }))}
                    placeholder="Şimdi Satın Al"
                  />
                </div>
              </div>

              {/* Color Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="background_color">Arkaplan Rengi</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="background_color"
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.background_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="text_color">Metin Rengi</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="text_color"
                      type="color"
                      value={formData.text_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.text_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="button_color">Buton Rengi</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="button_color"
                      type="color"
                      value={formData.button_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, button_color: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.button_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, button_color: e.target.value }))}
                      placeholder="#e91e63"
                    />
                  </div>
                </div>
              </div>

              {/* Schedule Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Başlangıç Tarihi</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Bitiş Tarihi</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
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
                <div className="relative w-32 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={banner.image_url}
                    alt={banner.title}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Banner Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{banner.title}</h3>
                      {banner.subtitle && (
                        <p className="text-gray-600 text-sm">{banner.subtitle}</p>
                      )}
                      {banner.description && (
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{banner.description}</p>
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
                    {banner.mobile_image_url && (
                      <div className="flex items-center gap-1">
                        <span>📱 Mobil görsel var</span>
                      </div>
                    )}
                    {banner.start_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(banner.start_date).toLocaleDateString('tr-TR')}</span>
                      </div>
                    )}
                  </div>

                  {/* Color Preview */}
                  <div className="mt-3 flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: banner.background_color }}
                      title="Arkaplan rengi"
                    />
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: banner.text_color }}
                      title="Metin rengi"
                    />
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: banner.button_color }}
                      title="Buton rengi"
                    />
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
