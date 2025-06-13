'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import Image from 'next/image';

interface CategorySection {
  id: string;
  category_id: string;
  section_type: 'banner' | 'product_grid' | 'featured_products' | 'bestsellers' | 'new_products' | 'recommended';
  title?: string;
  subtitle?: string;
  description?: string;
  
  // Banner fields
  image_url?: string;
  background_color?: string;
  text_color?: string;
  link_type?: 'category' | 'brand' | 'url' | 'tag';
  link_category_id?: string;
  link_brand_id?: string;
  link_url?: string;
  
  // Product section fields
  product_filter_type?: 'manual' | 'category' | 'brand' | 'tag' | 'price_range';
  filter_category_id?: string;
  filter_brand_id?: string;
  filter_tags?: string[];
  min_price?: number;
  max_price?: number;
  product_limit?: number;
  display_style?: 'grid' | 'horizontal_scroll' | 'list';
  
  sort_order: number;
  is_active: boolean;
  show_on_mobile: boolean;
  show_on_desktop: boolean;
  created_at: string;
  
  // Joined data
  category_name?: string;
  link_category_name?: string;
  link_brand_name?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  level: number;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  image_urls: string[];
  price: number;
  brand: string;
  category: string;
  is_active: boolean;
}

export function CategorySectionsManagement() {
  const supabase = createClient();
  
  const [sections, setSections] = useState<CategorySection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState<CategorySection | null>(null);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    section_type: 'banner' as CategorySection['section_type'],
    title: '',
    subtitle: '',
    image_url: '',
    background_color: '#ffffff',
    text_color: '#000000',
    link_type: 'category' as 'category' | 'brand' | 'url' | 'tag',
    link_category_id: '',
    link_brand_id: '',
    link_url: '',
    product_filter_type: 'category' as 'manual' | 'category' | 'brand' | 'tag' | 'price_range',
    filter_category_id: '',
    filter_brand_id: '',
    min_price: undefined as number | undefined,
    max_price: undefined as number | undefined,
    product_limit: 10,
    display_style: 'grid' as 'grid' | 'horizontal_scroll' | 'list',
    sort_order: 1,
    is_active: true,
    show_on_mobile: true,
    show_on_desktop: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchSections();
    }
  }, [selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [categoriesRes, brandsRes, productsRes] = await Promise.all([
        supabase.from('categories_new').select('id, name, slug, level').eq('is_active', true).eq('level', 0).order('name'),
        supabase.from('brands').select('id, name, slug').eq('is_active', true).order('name'),
        supabase.from('products').select('id, name, image_urls, price, brand, category, is_active').eq('is_active', true).order('name')
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (brandsRes.data) setBrands(brandsRes.data);
      if (productsRes.data) setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    if (!selectedCategory) return;

    try {
      const { data, error } = await supabase
        .from('category_page_sections')
        .select('*')
        .eq('category_id', selectedCategory)
        .order('sort_order');

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      setMessage('Section\'lar yüklenirken hata oluştu');
    }
  };

  const fetchSectionProducts = async (sectionId: string) => {
    try {
      const { data, error } = await supabase
        .from('category_section_products')
        .select('product_id')
        .eq('section_id', sectionId);

      if (error) throw error;
      return data?.map(item => item.product_id) || [];
    } catch (error) {
      console.error('Error fetching section products:', error);
      return [];
    }
  };

  const saveSectionProducts = async (sectionId: string, productIds: string[]) => {
    try {
      // Önce mevcut ürünleri sil
      await supabase
        .from('category_section_products')
        .delete()
        .eq('section_id', sectionId);

      // Yeni ürünleri ekle
      if (productIds.length > 0) {
        const insertData = productIds.map(productId => ({
          section_id: sectionId,
          product_id: productId
        }));

        const { error } = await supabase
          .from('category_section_products')
          .insert(insertData);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving section products:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    // Validasyon kontrolleri
    if (!selectedCategory || selectedCategory.trim() === '') {
      setMessage('Lütfen önce bir kategori seçin');
      return;
    }

    if (formData.section_type === 'banner' && (!formData.image_url || formData.image_url.trim() === '')) {
      setMessage('Banner için görsel URL zorunludur');
      return;
    }

    try {
      const sectionData = {
        ...formData,
        category_id: selectedCategory,
        // Boş string'leri null'a çevir
        title: formData.title.trim() || null,
        subtitle: formData.subtitle.trim() || null,
        image_url: formData.image_url.trim() || null,
        link_url: formData.link_url.trim() || null,
        link_category_id: formData.link_category_id.trim() || null,
        link_brand_id: formData.link_brand_id.trim() || null,
        filter_category_id: formData.filter_category_id.trim() || null,
        filter_brand_id: formData.filter_brand_id.trim() || null,
        min_price: formData.min_price || null,
        max_price: formData.max_price || null
      };

      let sectionId: string;

      if (editingSection) {
        const { error } = await supabase
          .from('category_page_sections')
          .update(sectionData)
          .eq('id', editingSection.id);

        if (error) throw error;
        sectionId = editingSection.id;
        setMessage('Section başarıyla güncellendi!');
      } else {
        const { data, error } = await supabase
          .from('category_page_sections')
          .insert([sectionData])
          .select('id')
          .single();

        if (error) throw error;
        sectionId = data.id;
        setMessage('Section başarıyla oluşturuldu!');
      }

      // Manuel ürün seçimi varsa kaydet
      if (formData.product_filter_type === 'manual' && selectedProducts.length > 0) {
        await saveSectionProducts(sectionId, selectedProducts);
      }

      resetForm();
      fetchSections();
    } catch (error) {
      console.error('Error saving section:', error);
      setMessage(`Section kaydedilirken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  };

  const handleDelete = async (sectionId: string) => {
    if (!confirm('Bu section\'ı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('category_page_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;
      setMessage('Section başarıyla silindi!');
      fetchSections();
    } catch (error) {
      console.error('Error deleting section:', error);
      setMessage('Section silinirken hata oluştu');
    }
  };

  const resetForm = () => {
    setFormData({
      section_type: 'banner',
      title: '',
      subtitle: '',
      image_url: '',
      background_color: '#ffffff',
      text_color: '#000000',
      link_type: 'category',
      link_category_id: '',
      link_brand_id: '',
      link_url: '',
      product_filter_type: 'category',
      filter_category_id: '',
      filter_brand_id: '',
      min_price: undefined,
      max_price: undefined,
      product_limit: 10,
      display_style: 'grid',
      sort_order: 1,
      is_active: true,
      show_on_mobile: true,
      show_on_desktop: true
    });
    setSelectedProducts([]);
    setProductSearchTerm('');
    setEditingSection(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Category Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Kategori Seçimi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category_select">Düzenlenecek Ana Kategori *</Label>
              <select
                id="category_select"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setMessage(''); // Clear any previous error messages
                }}
                className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm ${
                  selectedCategory 
                    ? 'border-input bg-background' 
                    : 'border-red-300 bg-red-50'
                }`}
                required
              >
                <option value="">-- Ana kategori seçin --</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {!selectedCategory && (
                <p className="text-sm text-red-600 mt-1">
                  Section oluşturmak için önce bir kategori seçmelisiniz
                </p>
              )}
            </div>
            {selectedCategory && (
              <div className="flex items-end">
                <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Yeni Section Ekle
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {message && (
        <div className={`mb-4 p-3 rounded-md text-sm ${
          message.includes('başarıyla') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Simple Form */}
      {showForm && selectedCategory && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {editingSection ? 'Section Düzenle' : 'Yeni Section Oluştur'}
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="section_type">Section Türü *</Label>
                  <select
                    id="section_type"
                    value={formData.section_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, section_type: e.target.value as CategorySection['section_type'] }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="banner">Banner</option>
                    <option value="product_grid">Ürün Grid</option>
                    <option value="featured_products">Öne Çıkan Ürünler</option>
                    <option value="bestsellers">Çok Satanlar</option>
                    <option value="new_products">Yeni Ürünler</option>
                    <option value="recommended">Önerilen Ürünler</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="title">Başlık</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Section başlığı"
                  />
                </div>
              </div>

              {formData.section_type === 'banner' && (
                <div>
                  <Label htmlFor="image_url">Görsel URL *</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              )}

              {/* Ürün Section'ları için ayarlar */}
              {formData.section_type !== 'banner' && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-semibold">Ürün Ayarları</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="product_filter_type">Ürün Seçim Türü *</Label>
                      <select
                        id="product_filter_type"
                        value={formData.product_filter_type}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, product_filter_type: e.target.value as CategorySection['product_filter_type'] }));
                          setSelectedProducts([]);
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="manual">Manuel Seçim</option>
                        <option value="category">Kategori Filtresi</option>
                        <option value="brand">Marka Filtresi</option>
                        <option value="price_range">Fiyat Aralığı</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="product_limit">Ürün Limiti</Label>
                      <Input
                        id="product_limit"
                        type="number"
                        min="1"
                        max="50"
                        value={formData.product_limit}
                        onChange={(e) => setFormData(prev => ({ ...prev, product_limit: parseInt(e.target.value) || 10 }))}
                      />
                    </div>
                  </div>

                  {/* Manuel Ürün Seçimi */}
                  {formData.product_filter_type === 'manual' && (
                    <div className="space-y-3">
                      <Label>Ürün Seçimi ({selectedProducts.length} ürün seçildi)</Label>
                      
                      <Input
                        placeholder="Ürün ara..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        className="mb-3"
                      />

                      <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
                        {products
                          .filter(product => 
                            product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                            product.brand.toLowerCase().includes(productSearchTerm.toLowerCase())
                          )
                          .slice(0, 20)
                          .map(product => (
                            <div key={product.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                              <input
                                type="checkbox"
                                id={`product-${product.id}`}
                                checked={selectedProducts.includes(product.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedProducts(prev => [...prev, product.id]);
                                  } else {
                                    setSelectedProducts(prev => prev.filter(id => id !== product.id));
                                  }
                                }}
                                className="rounded"
                              />
                              <div className="flex items-center space-x-3 flex-1">
                                {product.image_urls && product.image_urls.length > 0 && (
                                  <Image
                                    src={product.image_urls[0]}
                                    alt={product.name}
                                    width={40}
                                    height={40}
                                    className="rounded object-cover"
                                    unoptimized
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{product.name}</p>
                                  <p className="text-xs text-gray-500">{product.brand} - ₺{product.price}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {/* Kategori Filtresi */}
                  {formData.product_filter_type === 'category' && (
                    <div>
                      <Label htmlFor="filter_category_id">Filtre Kategorisi</Label>
                      <select
                        id="filter_category_id"
                        value={formData.filter_category_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, filter_category_id: e.target.value }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Tüm kategoriler</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Marka Filtresi */}
                  {formData.product_filter_type === 'brand' && (
                    <div>
                      <Label htmlFor="filter_brand_id">Filtre Markası</Label>
                      <select
                        id="filter_brand_id"
                        value={formData.filter_brand_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, filter_brand_id: e.target.value }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Tüm markalar</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Fiyat Aralığı */}
                  {formData.product_filter_type === 'price_range' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="min_price">Min Fiyat</Label>
                        <Input
                          id="min_price"
                          type="number"
                          min="0"
                          value={formData.min_price || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, min_price: parseFloat(e.target.value) || undefined }))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_price">Max Fiyat</Label>
                        <Input
                          id="max_price"
                          type="number"
                          min="0"
                          value={formData.max_price || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, max_price: parseFloat(e.target.value) || undefined }))}
                          placeholder="999999"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="display_style">Görünüm Stili</Label>
                    <select
                      id="display_style"
                      value={formData.display_style}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_style: e.target.value as CategorySection['display_style'] }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="grid">Grid</option>
                      <option value="horizontal_scroll">Yatay Kaydırma</option>
                      <option value="list">Liste</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  İptal
                </Button>
                <Button onClick={handleSave} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {editingSection ? 'Güncelle' : 'Oluştur'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sections List */}
      {selectedCategory && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            {categories.find(c => c.id === selectedCategory)?.name} - Section&apos;lar
          </h2>
          
          {sections.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">Bu kategori için henüz section oluşturulmamış.</p>
                <Button onClick={() => setShowForm(true)} className="mt-4">
                  İlk Section&apos;ı Oluştur
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sections.map((section) => (
                <Card key={section.id}>
                  <CardContent className="p-4">
                    {section.section_type === 'banner' && section.image_url && (
                      <div className="relative h-32 w-full mb-4 rounded-lg overflow-hidden">
                        <Image
                          src={section.image_url}
                          alt={section.title || 'Banner'}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">
                          {section.section_type === 'banner' ? 'Banner' :
                           section.section_type === 'product_grid' ? 'Ürün Grid' :
                           section.section_type === 'featured_products' ? 'Öne Çıkan' :
                           section.section_type === 'bestsellers' ? 'Çok Satan' :
                           section.section_type === 'new_products' ? 'Yeni' :
                           'Önerilen'}
                        </Badge>
                        <span className="text-sm text-gray-500">#{section.sort_order}</span>
                      </div>

                      {section.title && (
                        <h3 className="font-semibold text-sm">{section.title}</h3>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <Badge variant={section.is_active ? "default" : "secondary"}>
                          {section.is_active ? 'Aktif' : 'Pasif'}
                        </Badge>

                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFormData({
                                section_type: section.section_type,
                                title: section.title || '',
                                subtitle: section.subtitle || '',
                                image_url: section.image_url || '',
                                background_color: section.background_color || '#ffffff',
                                text_color: section.text_color || '#000000',
                                link_type: section.link_type || 'category',
                                link_category_id: section.link_category_id || '',
                                link_brand_id: section.link_brand_id || '',
                                link_url: section.link_url || '',
                                product_filter_type: section.product_filter_type || 'category',
                                filter_category_id: section.filter_category_id || '',
                                filter_brand_id: section.filter_brand_id || '',
                                min_price: section.min_price,
                                max_price: section.max_price,
                                product_limit: section.product_limit || 10,
                                display_style: section.display_style || 'grid',
                                sort_order: section.sort_order,
                                is_active: section.is_active,
                                show_on_mobile: section.show_on_mobile,
                                show_on_desktop: section.show_on_desktop
                              });
                              setEditingSection(section);
                              
                              // Manuel seçim ise mevcut ürünleri yükle
                              if (section.product_filter_type === 'manual') {
                                fetchSectionProducts(section.id).then(productIds => {
                                  setSelectedProducts(productIds);
                                });
                              }
                              
                              setShowForm(true);
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(section.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
 