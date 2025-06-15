'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Upload, Plus } from 'lucide-react';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { HierarchicalCategorySelector } from './hierarchical-category-selector';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  parent_id?: string;
  level: number;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}



interface Attribute {
  id: string;
  name: string;
  slug: string;
  type: string;
  unit?: string;
  is_required: boolean;
  is_filterable: boolean;
  sort_order: number;
  created_at: string;
}

interface AttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  color_code?: string;
  sort_order: number;
  created_at: string;
}

export function ProfessionalProductUploadForm() {
  const supabase = createClient();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    comparePrice: '',
    sku: '',
    barcode: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    stockQuantity: '',
    minStockLevel: '',
    categoryId: '',
    brandId: '',
    newBrandName: '',
    newBrandSlug: '',
    showNewBrandForm: false,
    tags: [] as string[],
    newTag: '',
    seoTitle: '',
    seoDescription: '',
    isActive: true,
    isFeatured: false,
    isOnSale: false,
    isBestseller: false,
    isRecommended: false,
    isNew: false
  });

  // Data state
  const [, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [attributeValues, setAttributeValues] = useState<AttributeValue[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<{[key: string]: string[]}>({});

  // Image state
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [categoriesRes, brandsRes, attributesRes, attributeValuesRes] = await Promise.all([
          supabase.from('categories_new').select('*').eq('is_active', true).order('sort_order'),
          supabase.from('brands').select('*').eq('is_active', true).order('name'),
          supabase.from('attributes').select('*').order('sort_order'),
          supabase.from('attribute_values').select('*').order('sort_order')
        ]);

        if (categoriesRes.data) setCategories(categoriesRes.data);
        if (brandsRes.data) setBrands(brandsRes.data);
        if (attributesRes.data) setAttributes(attributesRes.data);
        if (attributeValuesRes.data) setAttributeValues(attributeValuesRes.data);

      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage('Veri yüklenirken hata oluştu');
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [supabase]);



  // Generate slug from text
  const generateSlug = (text: string) => {
    return text.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string | boolean | number) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent as keyof typeof prev]: {
          ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
          [child as string]: value
        }
      }));
    } else {
      setFormData(prev => {
        const newData = { ...prev, [field]: value };
        
        // Auto-generate slug when brand name changes
        if (field === 'newBrandName' && typeof value === 'string') {
          newData.newBrandSlug = generateSlug(value);
        }
        

        
        return newData;
      });
    }
  };

  // Handle image file selection
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles]);
      
      // Create previews
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Handle image URL addition
  const handleImageUrlAdd = () => {
    const url = prompt('Görsel URL\'si girin:');
    if (url && url.trim()) {
      setImageUrls(prev => [...prev, url.trim()]);
    }
  };

  // Handle tag addition
  const addTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }));
    }
  };

  // Handle tag removal
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle attributes
  const handleAttributeChange = (attributeId: string, valueId: string, checked: boolean) => {
    setSelectedAttributes(prev => {
      const current = prev[attributeId] || [];
      if (checked) {
        return { ...prev, [attributeId]: [...current, valueId] };
      } else {
        return { ...prev, [attributeId]: current.filter(id => id !== valueId) };
      }
    });
  };

  // Handle new brand creation
  const handleCreateNewBrand = async () => {
    if (!formData.newBrandName.trim() || !formData.newBrandSlug.trim()) {
      setMessage('Marka adı ve slug gereklidir');
      return;
    }

    try {
      // Validate slug format
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(formData.newBrandSlug)) {
        setMessage('Slug sadece küçük harf, rakam ve tire içerebilir');
        return;
      }

      const { data: newBrand, error } = await supabase
        .from('brands')
        .insert([{
          name: formData.newBrandName.trim(),
          slug: formData.newBrandSlug.trim(),
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Add new brand to brands list and select it
      setBrands(prev => [...prev, newBrand]);
      setFormData(prev => ({
        ...prev,
        brandId: newBrand.id,
        newBrandName: '',
        newBrandSlug: '',
        showNewBrandForm: false
      }));
      setMessage('Yeni marka başarıyla eklendi!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Marka eklenirken hata oluştu';
      setMessage(`Hata: ${errorMessage}`);
    }
  };



  // Form validation
  const validateForm = () => {
    return formData.name.trim() && 
           formData.description.trim() && 
           formData.categoryId &&
           formData.price && 
           parseFloat(formData.price) > 0 &&
           (images.length > 0 || imageUrls.length > 0);
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) {
      setMessage('Lütfen tüm gerekli alanları doldurun (Ad, Açıklama, Kategori, Fiyat ve en az 1 görsel)');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Upload images to Supabase Storage
      const uploadPromises = images.map(async (image) => {
        const fileExtension = image.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const filePath = `product_images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const allImageUrls = [...uploadedUrls, ...imageUrls];

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Kullanıcı bilgileri alınamadı');

      // Insert product
      const productData = {
        name: formData.name,
        description: formData.description,
        short_description: formData.shortDescription,
        price: parseFloat(formData.price),
        compare_price: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
        sku: formData.sku || null,
        barcode: formData.barcode || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : null,
        width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : null,
        height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : null,
        stock_quantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : 0,
        min_stock_level: formData.minStockLevel ? parseInt(formData.minStockLevel) : 0,
        category_id: formData.categoryId,
        brand_id: formData.brandId || null,
        tags: formData.tags,
        seo_title: formData.seoTitle || null,
        seo_description: formData.seoDescription || null,
        image_urls: allImageUrls,
        is_active: formData.isActive,
        is_featured: formData.isFeatured,
        is_on_sale: formData.isOnSale,
        is_bestseller: formData.isBestseller,
        is_recommended: formData.isRecommended,
        is_new: formData.isNew,
        user_id: user.id
      };

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (productError) throw productError;

      // Insert product attributes
      const attributeInserts = [];
      for (const [, valueIds] of Object.entries(selectedAttributes)) {
        for (const valueId of valueIds) {
          attributeInserts.push({
            product_id: product.id,
            attribute_value_id: valueId
          });
        }
      }

      if (attributeInserts.length > 0) {
        const { error: attributeError } = await supabase
          .from('product_attributes')
          .insert(attributeInserts);

        if (attributeError) throw attributeError;
      }

      setMessage('Ürün başarıyla yüklendi!');
      
      // Reset form
      setFormData({
        name: '', description: '', shortDescription: '', price: '', comparePrice: '',
        sku: '', barcode: '', weight: '', dimensions: { length: '', width: '', height: '' },
        stockQuantity: '', minStockLevel: '', categoryId: '', brandId: '',
        newBrandName: '', newBrandSlug: '', showNewBrandForm: false,
        tags: [], newTag: '', seoTitle: '', seoDescription: '',
        isActive: true, isFeatured: false, isOnSale: false, isBestseller: false,
        isRecommended: false, isNew: false
      });
      setImages([]);
      setImageUrls([]);
      setImagePreviews([]);
      setSelectedAttributes({});

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
      setMessage(`Hata: ${errorMessage}`);
      console.error('Product upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
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
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Ürün Ekleme Formu</CardTitle>
          <p className="text-muted-foreground">
            Yeni ürün eklemek için aşağıdaki formu doldurun. * ile işaretli alanlar zorunludur.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold border-b pb-2">Temel Bilgiler</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Ürün Adı *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ürünün tam adını girin"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="brand">Marka</Label>
                  <div className="space-y-3">
                    <select
                      id="brand"
                      value={formData.brandId}
                      onChange={(e) => handleInputChange('brandId', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Marka seçin</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange('showNewBrandForm', !formData.showNewBrandForm)}
                      className="text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {formData.showNewBrandForm ? 'İptal' : 'Yeni Marka Ekle'}
                    </Button>

                    {formData.showNewBrandForm && (
                      <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                        <h4 className="font-medium text-sm">Yeni Marka Bilgileri</h4>
                          <div>
                            <Label htmlFor="newBrandName">Marka Adı *</Label>
                            <Input
                              id="newBrandName"
                              value={formData.newBrandName}
                              onChange={(e) => handleInputChange('newBrandName', e.target.value)}
                              placeholder="Örn: MAC, L'Oréal, پنسیس"
                            />
                          </div>
                          <div>
                            <Label htmlFor="newBrandSlug">Marka Slug *</Label>
                            <div className="flex gap-2">
                              <Input
                                id="newBrandSlug"
                                value={formData.newBrandSlug}
                                onChange={(e) => handleInputChange('newBrandSlug', e.target.value)}
                                placeholder="Örn: mac, loreal, pensis"
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleInputChange('newBrandSlug', generateSlug(formData.newBrandName))}
                                disabled={!formData.newBrandName.trim()}
                                className="whitespace-nowrap"
                              >
                                Otomatik
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              URL&apos;de kullanılacak (sadece küçük harf, rakam ve tire)
                            </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleCreateNewBrand}
                            disabled={!formData.newBrandName.trim() || !formData.newBrandSlug.trim()}
                          >
                            Marka Ekle
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleInputChange('showNewBrandForm', false)}
                          >
                            İptal
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

                <div>
                <HierarchicalCategorySelector
                    value={formData.categoryId}
                  onChange={(categoryId) => handleInputChange('categoryId', categoryId)}
                  required={true}
                />
                <div className="text-xs text-muted-foreground mt-2 space-y-1">
                  <p>En spesifik kategoriyi seçin. Bu kategori hem marka hem de genel kategori sayfalarında kullanılacak.</p>
                  <div className="bg-blue-50 p-2 rounded text-blue-700">
                    <p><strong>URL Yapısı:</strong></p>
                    <p>• <strong>Marka Sayfası:</strong> <code>/brand/{'{brand-slug}'}/{'{category-slug}'}</code></p>
                    <p>• <strong>Kategori Sayfası:</strong> <code>/categories/{'{category-hierarchy}'}</code></p>
                  </div>
                </div>
              </div>



              <div>
                <Label htmlFor="shortDescription">Kısa Açıklama</Label>
                <Input
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                  placeholder="Ürün için kısa bir açıklama (liste görünümünde gösterilir)"
                />
              </div>

              <div>
                <Label htmlFor="description">Detaylı Açıklama *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Ürünün özelliklerini, kullanım talimatlarını ve faydalarını detaylıca açıklayın"
                  rows={5}
                  required
                />
              </div>
            </div>

            {/* Pricing and Inventory */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold border-b pb-2">Fiyat ve Stok Bilgileri</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Satış Fiyatı (؋) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="comparePrice">Karşılaştırma Fiyatı (؋)</Label>
                  <Input
                    id="comparePrice"
                    type="number"
                    step="0.01"
                    value={formData.comparePrice}
                    onChange={(e) => handleInputChange('comparePrice', e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    İndirim öncesi fiyat (isteğe bağlı)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sku">Ürün Kodu (SKU)</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder="MAKYAJ-001"
                  />
                </div>
                <div>
                  <Label htmlFor="barcode">Barkod</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => handleInputChange('barcode', e.target.value)}
                    placeholder="1234567890123"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stockQuantity">Stok Miktarı</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => handleInputChange('stockQuantity', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="minStockLevel">Minimum Stok Seviyesi</Label>
                  <Input
                    id="minStockLevel"
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) => handleInputChange('minStockLevel', e.target.value)}
                    placeholder="5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="weight">Ağırlık (gram)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="100"
                />
              </div>

              <div>
                <Label>Boyutlar (cm)</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.dimensions.length}
                    onChange={(e) => handleInputChange('dimensions.length', e.target.value)}
                    placeholder="Uzunluk"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.dimensions.width}
                    onChange={(e) => handleInputChange('dimensions.width', e.target.value)}
                    placeholder="Genişlik"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.dimensions.height}
                    onChange={(e) => handleInputChange('dimensions.height', e.target.value)}
                    placeholder="Yükseklik"
                  />
                </div>
              </div>
            </div>

            {/* Attributes */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold border-b pb-2">Ürün Özellikleri</h3>
              <div className="text-sm text-muted-foreground mb-4">
                Ürününüzün özelliklerini seçin. Bu bilgiler müşterilerin doğru ürünü bulmasına yardımcı olur.
              </div>
              
              {attributes.map((attribute) => {
                const attributeValues_filtered = attributeValues.filter(v => v.attribute_id === attribute.id);
                if (attributeValues_filtered.length === 0) return null;

                return (
                  <div key={attribute.id} className="border rounded-lg p-4">
                    <h3 className="font-medium mb-3">
                      {attribute.name}
                      {attribute.is_required && <span className="text-red-500 ml-1">*</span>}
                      {attribute.unit && <span className="text-muted-foreground ml-1">({attribute.unit})</span>}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {attributeValues_filtered.map((value) => (
                        <label key={value.id} className="flex items-center space-x-2 p-2 border rounded hover:bg-accent cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedAttributes[attribute.id]?.includes(value.id) || false}
                            onChange={(e) => handleAttributeChange(attribute.id, value.id, e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">
                            {value.color_code && (
                              <span
                                className="inline-block w-3 h-3 rounded-full mr-1 border"
                                style={{ backgroundColor: value.color_code }}
                              />
                            )}
                            {value.value}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Images */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold border-b pb-2">Ürün Görselleri</h3>
              <div>
                <Label>Ürün Görselleri *</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  En az 1 görsel yüklemeniz gerekiyor. İlk görsel ana görsel olarak kullanılacaktır.
                </p>
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <label htmlFor="images" className="cursor-pointer">
                      <span className="text-primary hover:text-primary/80">Dosya seçin</span>
                      <span className="text-muted-foreground"> veya sürükleyip bırakın</span>
                      <input
                        id="images"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG, JPG, WEBP (max. 5MB)
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleImageUrlAdd}
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  URL ile Görsel Ekle
                </Button>
              </div>

              {/* Image Previews */}
              {(imagePreviews.length > 0 || imageUrls.length > 0) && (
                <div>
                  <Label>Görsel Önizleme</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={`file-${index}`} className="relative">
                        <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        {index === 0 && (
                          <Badge className="absolute bottom-2 left-2 text-xs">
                            Ana Görsel
                          </Badge>
                        )}
                      </div>
                    ))}
                    {imageUrls.map((url, index) => (
                      <div key={`url-${index}`} className="relative">
                        <Image
                          src={url}
                          alt={`URL ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-32 object-cover rounded-lg border"
                          unoptimized
                        />
                        {imagePreviews.length === 0 && index === 0 && (
                          <Badge className="absolute bottom-2 left-2 text-xs">
                            Ana Görsel
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SEO and Tags */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold border-b pb-2">SEO ve Etiketler</h3>
              
              <div>
                <Label htmlFor="tags">Etiketler</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={formData.newTag}
                    onChange={(e) => handleInputChange('newTag', e.target.value)}
                    placeholder="Etiket ekle"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    Ekle
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="seoTitle">SEO Başlık</Label>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle}
                  onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                  placeholder="Arama motorları için optimized başlık"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.seoTitle.length}/60 karakter (önerilen)
                </p>
              </div>

              <div>
                <Label htmlFor="seoDescription">SEO Açıklama</Label>
                <Textarea
                  id="seoDescription"
                  value={formData.seoDescription}
                  onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                  placeholder="Arama sonuçlarında gösterilecek açıklama"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.seoDescription.length}/160 karakter (önerilen)
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  />
                  <Label htmlFor="isActive">Ürünü aktif olarak yayınla</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                  />
                  <Label htmlFor="isFeatured">Öne çıkan ürün olarak işaretle</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isOnSale"
                    checked={formData.isOnSale}
                    onChange={(e) => handleInputChange('isOnSale', e.target.checked)}
                  />
                  <Label htmlFor="isOnSale">İndirimli ürün olarak işaretle</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isBestseller"
                    checked={formData.isBestseller}
                    onChange={(e) => handleInputChange('isBestseller', e.target.checked)}
                  />
                  <Label htmlFor="isBestseller">Çok satanlar listesine ekle</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isRecommended"
                    checked={formData.isRecommended}
                    onChange={(e) => handleInputChange('isRecommended', e.target.checked)}
                  />
                  <Label htmlFor="isRecommended">Önerilen ürünler listesine ekle</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isNew"
                    checked={formData.isNew}
                    onChange={(e) => handleInputChange('isNew', e.target.checked)}
                  />
                  <Label htmlFor="isNew">Yeni ürünler listesine ekle</Label>
                </div>
            </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t">
              <Button
                onClick={handleSubmit}
                disabled={loading || !validateForm()}
                className="px-8"
              >
                {loading ? 'Yükleniyor...' : 'Ürünü Yayınla'}
              </Button>
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded-md text-sm ${
              message.includes('başarıyla') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 