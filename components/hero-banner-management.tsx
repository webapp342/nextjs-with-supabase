'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Upload, X } from 'lucide-react';
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
}

export function HeroBannerManagement() {
  const supabase = createClient();
  
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
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

  const fetchBanners = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Hero banner yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const uploadImage = async (file: File, isMobile = false) => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `hero-banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      if (isMobile) {
        setFormData(prev => ({ ...prev, mobile_image_url: publicUrl }));
      } else {
        setFormData(prev => ({ ...prev, image_url: publicUrl }));
      }

    } catch (error) {
      console.error('Resim yükleme hatası:', error);
      alert('Resim yüklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isMobile = false) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file, isMobile);
    }
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
    } catch (error) {
      console.error('Hero banner silme hatası:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.image_url) {
      alert('Başlık ve resim zorunludur');
      return;
    }

    try {
      const bannerData = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        mobile_image_url: formData.mobile_image_url || null,
        link_url: formData.link_url || null,
        link_text: formData.link_text || null,
        subtitle: formData.subtitle || null,
        description: formData.description || null
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('hero_banners')
          .update(bannerData)
          .eq('id', editingBanner.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hero_banners')
          .insert([bannerData]);

        if (error) throw error;
      }

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
        sort_order: 0,
        is_active: true,
        start_date: '',
        end_date: ''
      });
      setEditingBanner(null);
      setShowForm(false);
      
      await fetchBanners();

    } catch (error: unknown) {
      console.error('Hero banner kayıt hatası:', error instanceof Error ? error.message : 'Bilinmeyen hata');
      alert('Hero banner kaydedilirken hata oluştu');
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
      sort_order: 0,
      is_active: true,
      start_date: '',
      end_date: ''
    });
    setEditingBanner(null);
    setShowForm(false);
  };

  if (loading) {
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
            <div className="flex items-center justify-between">
              <CardTitle>
                {editingBanner ? 'Hero Banner Düzenle' : 'Yeni Hero Banner Ekle'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>
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

              {/* Image Upload */}
              <div className="space-y-4">
                <div>
                  <Label>Ana Resim *</Label>
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
                      onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Yükleniyor...' : 'Resim Yükle'}
                    </Button>
                  </div>
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

                <div>
                  <Label>Mobil Resim (Opsiyonel)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, true)}
                      disabled={uploading}
                    />
                  </div>
                  {formData.mobile_image_url && (
                    <div className="mt-2 relative w-32 h-20 rounded-lg overflow-hidden">
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
                  />
                </div>
                <div>
                  <Label htmlFor="link_text">Buton Metni</Label>
                  <Input
                    id="link_text"
                    value={formData.link_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_text: e.target.value }))}
                  />
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="background_color">Arka Plan Rengi</Label>
                  <Input
                    id="background_color"
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="text_color">Metin Rengi</Label>
                  <Input
                    id="text_color"
                    type="color"
                    value={formData.text_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="button_color">Buton Rengi</Label>
                  <Input
                    id="button_color"
                    type="color"
                    value={formData.button_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, button_color: e.target.value }))}
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="sort_order">Sıralama</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
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

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="is_active">Aktif</Label>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={uploading}>
                  {editingBanner ? 'Güncelle' : 'Kaydet'}
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
              {banner.subtitle && (
                <p className="text-sm text-muted-foreground mb-2">{banner.subtitle}</p>
              )}
              <div className="flex items-center justify-between mb-3">
                <Badge variant={banner.is_active ? "default" : "secondary"}>
                  {banner.is_active ? 'Aktif' : 'Pasif'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Sıra: {banner.sort_order}
                </span>
              </div>
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
            </CardContent>
          </Card>
        ))}
      </div>

      {banners.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Henüz hero banner eklenmemiş.
        </div>
      )}
    </div>
  );
} 
