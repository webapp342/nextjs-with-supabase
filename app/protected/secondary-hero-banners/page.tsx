'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, GripVertical, Calendar } from 'lucide-react';
import { HierarchicalCategorySelector } from '@/components/hierarchical-category-selector';
import Image from 'next/image';

interface SecondaryHeroBanner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  mobile_image_url?: string;
  link_url: string;
  link_text?: string;
  link_type: 'category' | 'brand' | 'custom' | 'tag';
  link_category_id?: string;
  link_brand_id?: string;
  link_tag?: string;
  background_color: string;
  text_color: string;
  button_color: string;
  sort_order: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  level: number;
  parent_id?: string;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface FormData {
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  mobile_image_url: string;
  link_text: string;
  link_type: 'category' | 'brand' | 'custom' | 'tag';
  link_category_id: string;
  link_brand_id: string;
  link_tag: string;
  link_url: string;
  background_color: string;
  text_color: string;
  button_color: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export default function SecondaryHeroBannersPage() {
  const [banners, setBanners] = useState<SecondaryHeroBanner[]>([]);
  const [, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<SecondaryHeroBanner | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: '',
    subtitle: '',
    description: '',
    image_url: '',
    mobile_image_url: '',
    link_text: '',
    link_type: 'category',
    link_category_id: '',
    link_brand_id: '',
    link_tag: '',
    link_url: '',
    background_color: '#ffffff',
    text_color: '#000000',
    button_color: '#e91e63',
    start_date: '',
    end_date: '',
    is_active: true
  });

  const supabase = createClient();

  // Helper function to build hierarchical category URL
  const buildCategoryUrl = async (categoryId: string): Promise<string> => {
    try {
      const { data: category, error } = await supabase
        .from('categories_new')
        .select('id, slug, parent_id, level')
        .eq('id', categoryId)
        .single();

      if (error || !category) return '/category';

      // Build path by traversing up the hierarchy
      const pathSegments = [category.slug];
      let currentCategory = category;

      while (currentCategory.parent_id) {
        const { data: parentCategory, error: parentError } = await supabase
          .from('categories_new')
          .select('id, slug, parent_id, level')
          .eq('id', currentCategory.parent_id)
          .single();

        if (parentError || !parentCategory) break;
        
        pathSegments.unshift(parentCategory.slug);
        currentCategory = parentCategory;
      }

      return `/category/${pathSegments.join('/')}`;
    } catch (error) {
      console.error('Error building category URL:', error);
      return '/category';
    }
  };

  const fetchData = useCallback(async () => {
    try {
      // Fetch banners
      const { data: bannersData, error: bannersError } = await supabase
        .from('secondary_hero_banners')
        .select('*')
        .order('sort_order');
      
      if (bannersError) throw bannersError;
      setBanners(bannersData || []);

      // Fetch categories for dropdown
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories_new')
        .select('id, name, slug, level, parent_id')
        .eq('is_active', true)
        .order('name');
      
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch brands for dropdown
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');
      
      if (brandsError) throw brandsError;
      setBrands(brandsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, isMobile = false) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `secondary-hero-banners/${fileName}`;

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
      console.error('Error uploading image:', error);
      alert('Resim yüklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title) {
      alert('Lütfen bir başlık girin');
      return;
    }
    if (!formData.image_url) {
      alert('Lütfen bir resim yükleyin');
      return;
    }
    if (formData.link_type === 'category' && !formData.link_category_id) {
      alert('Lütfen bir kategori seçin');
      return;
    }
    if (formData.link_type === 'brand' && !formData.link_brand_id) {
      alert('Lütfen bir marka seçin');
      return;
    }
    if (formData.link_type === 'tag' && !formData.link_tag) {
      alert('Lütfen bir tag seçin');
      return;
    }
    if (formData.link_type === 'custom' && !formData.link_url) {
      alert('Lütfen bir URL girin');
      return;
    }
    
    try {
      let link_url = formData.link_url;
      
      // Generate URL based on link type
      if (formData.link_type === 'category' && formData.link_category_id) {
        link_url = await buildCategoryUrl(formData.link_category_id);
      } else if (formData.link_type === 'brand' && formData.link_brand_id) {
        const brand = brands.find(b => b.id === formData.link_brand_id);
        if (brand) {
          link_url = `/brand/${brand.slug}`;
        }
      } else if (formData.link_type === 'tag' && formData.link_tag) {
        link_url = `/tags/${formData.link_tag}`;
      }

      const bannerData = {
        title: formData.title,
        subtitle: formData.subtitle || null,
        description: formData.description || null,
        image_url: formData.image_url,
        mobile_image_url: formData.mobile_image_url || null,
        link_url,
        link_text: formData.link_text || null,
        link_type: formData.link_type,
        link_category_id: formData.link_type === 'category' && formData.link_category_id ? formData.link_category_id : null,
        link_brand_id: formData.link_type === 'brand' && formData.link_brand_id ? formData.link_brand_id : null,
        link_tag: formData.link_type === 'tag' && formData.link_tag ? formData.link_tag : null,
        background_color: formData.background_color,
        text_color: formData.text_color,
        button_color: formData.button_color,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_active: formData.is_active,
        sort_order: editBanner ? editBanner.sort_order : banners.length + 1
      };

      if (editBanner) {
        const { error } = await supabase
          .from('secondary_hero_banners')
          .update(bannerData)
          .eq('id', editBanner.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('secondary_hero_banners')
          .insert([bannerData]);
        
        if (error) throw error;
      }

      setDialogOpen(false);
      setEditBanner(null);
      setFormData({
        title: '',
        subtitle: '',
        description: '',
        image_url: '',
        mobile_image_url: '',
        link_text: '',
        link_type: 'category',
        link_category_id: '',
        link_brand_id: '',
        link_tag: '',
        link_url: '',
        background_color: '#ffffff',
        text_color: '#000000',
        button_color: '#e91e63',
        start_date: '',
        end_date: '',
        is_active: true
      });
      fetchData();

    } catch (error) {
      console.error('Error saving banner:', error);
    }
  };

  const handleEdit = (banner: SecondaryHeroBanner) => {
    setEditBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      description: banner.description || '',
      image_url: banner.image_url,
      mobile_image_url: banner.mobile_image_url || '',
      link_text: banner.link_text || '',
      link_type: banner.link_type,
      link_category_id: banner.link_category_id || '',
      link_brand_id: banner.link_brand_id || '',
      link_tag: banner.link_tag || '',
      link_url: banner.link_url,
      background_color: banner.background_color,
      text_color: banner.text_color,
      button_color: banner.button_color,
      start_date: banner.start_date?.split('T')[0] ?? '',
      end_date: banner.end_date?.split('T')[0] ?? '',
      is_active: banner.is_active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu banner\'ı silmek istediğinizde emin misiniz?')) return;
    
    try {
      const { error } = await supabase
        .from('secondary_hero_banners')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('secondary_hero_banners')
        .update({ is_active: !isActive })
        .eq('id', id);
      
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating banner:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">İkinci Hero Banner Yönetimi</h1>
          <p className="text-muted-foreground">Ana sayfada özel hero section&apos;da gösterilecek slide edilebilen banner&apos;ları yönetin</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditBanner(null);
              setFormData({
                title: '',
                subtitle: '',
                description: '',
                image_url: '',
                mobile_image_url: '',
                link_text: '',
                link_type: 'category',
                link_category_id: '',
                link_brand_id: '',
                link_tag: '',
                link_url: '',
                background_color: '#ffffff',
                text_color: '#000000',
                button_color: '#e91e63',
                start_date: '',
                end_date: '',
                is_active: true
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Hero Banner Ekle
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editBanner ? 'Hero Banner Düzenle' : 'Yeni Hero Banner Ekle'}
              </DialogTitle>
              <DialogDescription>
                {editBanner ? 'Mevcut hero banner&apos;ı düzenleyin' : 'İkinci hero section&apos;da gösterilecek yeni bir banner ekleyin'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Başlık</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Hero banner başlığı"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="subtitle">Alt Başlık</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Hero banner alt başlığı"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Hero banner açıklaması"
                />
              </div>

              <div>
                <Label htmlFor="link_text">Buton Metni</Label>
                <Input
                  id="link_text"
                  value={formData.link_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, link_text: e.target.value }))}
                  placeholder="Buton metni (opsiyonel)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="desktop_image">Masaüstü Resmi</Label>
                  <div className="space-y-2">
                    <Input
                      id="desktop_image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, false)}
                      disabled={uploading}
                    />
                    {formData.image_url && (
                      <div className="relative w-20 h-12">
                        <Image
                          src={formData.image_url}
                          alt="Desktop Preview"
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="mobile_image">Mobil Resmi (Opsiyonel)</Label>
                  <div className="space-y-2">
                    <Input
                      id="mobile_image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, true)}
                      disabled={uploading}
                    />
                    {formData.mobile_image_url && (
                      <div className="relative w-20 h-12">
                        <Image
                          src={formData.mobile_image_url}
                          alt="Mobile Preview"
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="background_color">Arkaplan Rengi</Label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Başlangıç Tarihi (Opsiyonel)</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Bitiş Tarihi (Opsiyonel)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="link_type">Link Türü</Label>
                <Select 
                  value={formData.link_type} 
                  onValueChange={(value: 'category' | 'brand' | 'custom' | 'tag') => 
                    setFormData(prev => ({ ...prev, link_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="category">Kategori</SelectItem>
                    <SelectItem value="brand">Marka</SelectItem>
                    <SelectItem value="tag">Tag</SelectItem>
                    <SelectItem value="custom">Özel URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.link_type === 'category' && (
                <div>
                  <Label htmlFor="category">Kategori</Label>
                  <HierarchicalCategorySelector
                    value={formData.link_category_id}
                    onChange={(categoryId) => 
                      setFormData(prev => ({ ...prev, link_category_id: categoryId }))
                    }
                    required
                  />
                </div>
              )}

              {formData.link_type === 'brand' && (
                <div>
                  <Label htmlFor="brand">Marka</Label>
                  <Select 
                    value={formData.link_brand_id} 
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, link_brand_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Marka seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.link_type === 'tag' && (
                <div>
                  <Label htmlFor="tag">Tag</Label>
                  <Select 
                    value={formData.link_tag} 
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, link_tag: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tag seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bestseller">En Çok Satanlar</SelectItem>
                      <SelectItem value="recommended">Önerilen Ürünler</SelectItem>
                      <SelectItem value="new">Yeni Ürünler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.link_type === 'custom' && (
                <div>
                  <Label htmlFor="link_url">URL</Label>
                  <Input
                    id="link_url"
                    value={formData.link_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                    placeholder="/custom-page"
                    required
                  />
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={uploading}>
                  {editBanner ? 'Güncelle' : 'Ekle'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {banners.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Henüz hero banner eklenmemiş</p>
            </CardContent>
          </Card>
        ) : (
          banners.map((banner) => (
            <Card key={banner.id} className={!banner.is_active ? 'opacity-50' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className="relative w-16 h-10">
                      <Image
                        src={banner.image_url}
                        alt={banner.title}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    {banner.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {(banner.start_date || banner.end_date) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {banner.start_date && new Date(banner.start_date).toLocaleDateString('tr-TR')}
                        {banner.start_date && banner.end_date && ' - '}
                        {banner.end_date && new Date(banner.end_date).toLocaleDateString('tr-TR')}
                      </div>
                    )}
                    <Button
                      variant={banner.is_active ? "default" : "secondary"}
                      size="sm"
                      onClick={() => handleToggleActive(banner.id, banner.is_active)}
                    >
                      {banner.is_active ? 'Aktif' : 'Pasif'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(banner)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(banner.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Alt Başlık:</strong> {banner.subtitle || 'Yok'}</p>
                  <p><strong>Link Türü:</strong> {banner.link_type === 'category' ? 'Kategori' : banner.link_type === 'brand' ? 'Marka' : banner.link_type === 'tag' ? 'Tag' : 'Özel URL'}</p>
                  <p><strong>URL:</strong> {banner.link_url}</p>
                  <p><strong>Sıra:</strong> {banner.sort_order}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}