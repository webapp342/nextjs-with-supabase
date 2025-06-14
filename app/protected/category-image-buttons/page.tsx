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
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';

import { HierarchicalCategorySelector } from '@/components/hierarchical-category-selector';
import Image from 'next/image';

interface CategoryImageButton {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  link_type: 'category' | 'brand' | 'custom' | 'tag';
  link_category_id?: string;
  link_brand_id?: string;
  link_tag?: string;
  sort_order: number;
  is_active: boolean;
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

export default function CategoryImageButtonsPage() {
  const [buttons, setButtons] = useState<CategoryImageButton[]>([]);
  const [, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editButton, setEditButton] = useState<CategoryImageButton | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    image_url: string;
    link_type: 'category' | 'brand' | 'custom' | 'tag';
    link_category_id: string;
    link_brand_id: string;
    link_tag: string;
    link_url: string;
    is_active: boolean;
  }>({
    title: '',
    image_url: '',
    link_type: 'category',
    link_category_id: '',
    link_brand_id: '',
    link_tag: '',
    link_url: '',
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
      // Fetch buttons
      const { data: buttonsData, error: buttonsError } = await supabase
        .from('category_image_buttons')
        .select('*')
        .order('sort_order');
      
      if (buttonsError) throw buttonsError;
      setButtons(buttonsData || []);

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `category-image-buttons/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
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

      const buttonData = {
        title: formData.title,
        image_url: formData.image_url,
        link_url,
        link_type: formData.link_type,
        link_category_id: formData.link_type === 'category' && formData.link_category_id ? formData.link_category_id : null,
        link_brand_id: formData.link_type === 'brand' && formData.link_brand_id ? formData.link_brand_id : null,
        link_tag: formData.link_type === 'tag' && formData.link_tag ? formData.link_tag : null,
        is_active: formData.is_active,
        sort_order: editButton ? editButton.sort_order : buttons.length + 1
      };

      if (editButton) {
        const { error } = await supabase
          .from('category_image_buttons')
          .update(buttonData)
          .eq('id', editButton.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('category_image_buttons')
          .insert([buttonData]);
        
        if (error) throw error;
      }

      setDialogOpen(false);
      setEditButton(null);
      setFormData({
        title: '',
        image_url: '',
        link_type: 'category',
        link_category_id: '',
        link_brand_id: '',
        link_tag: '',
        link_url: '',
        is_active: true
      });
      fetchData();

    } catch (error) {
      console.error('Error saving button:', error);
    }
  };

  const handleEdit = (button: CategoryImageButton) => {
    setEditButton(button);
    setFormData({
      title: button.title,
      image_url: button.image_url,
      link_type: button.link_type,
      link_category_id: button.link_category_id || '',
      link_brand_id: button.link_brand_id || '',
      link_tag: button.link_tag || '',
      link_url: button.link_url,
      is_active: button.is_active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu butonu silmek istediğinizde emin misiniz?')) return;
    
    try {
      const { error } = await supabase
        .from('category_image_buttons')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting button:', error);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('category_image_buttons')
        .update({ is_active: !isActive })
        .eq('id', id);
      
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating button:', error);
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
          <h1 className="text-2xl font-bold">Resimli Kategori Butonları Yönetimi</h1>
          <p className="text-muted-foreground">Ana sayfada gösterilecek resimli kategori butonlarını yönetin</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditButton(null);
              setFormData({
                title: '',
                image_url: '',
                link_type: 'category',
                link_category_id: '',
                link_brand_id: '',
                link_tag: '',
                link_url: '',
                is_active: true
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Buton Ekle
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editButton ? 'Buton Düzenle' : 'Yeni Buton Ekle'}
              </DialogTitle>
              <DialogDescription>
                {editButton ? 'Mevcut butonu düzenleyin' : 'Ana sayfada gösterilecek yeni bir resimli kategori butonu ekleyin'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Buton Adı</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Buton adını girin"
                  required
                />
              </div>

              <div>
                <Label htmlFor="image">Resim</Label>
                <div className="space-y-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  {uploading && <p className="text-sm text-muted-foreground">Yükleniyor...</p>}
                  {formData.image_url && (
                    <div className="relative w-20 h-20">
                      <Image
                        src={formData.image_url}
                        alt="Preview"
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}
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
                  {editButton ? 'Güncelle' : 'Ekle'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {buttons.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Henüz buton eklenmemiş</p>
            </CardContent>
          </Card>
        ) : (
          buttons.map((button) => (
            <Card key={button.id} className={!button.is_active ? 'opacity-50' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className="relative w-8 h-8">
                      <Image
                        src={button.image_url}
                        alt={button.title}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    {button.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={button.is_active ? "default" : "secondary"}
                      size="sm"
                      onClick={() => handleToggleActive(button.id, button.is_active)}
                    >
                      {button.is_active ? 'Aktif' : 'Pasif'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(button)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(button.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Link Türü:</strong> {button.link_type === 'category' ? 'Kategori' : button.link_type === 'brand' ? 'Marka' : button.link_type === 'tag' ? 'Tag' : 'Özel URL'}</p>
                  <p><strong>URL:</strong> {button.link_url}</p>
                  <p><strong>Sıra:</strong> {button.sort_order}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 