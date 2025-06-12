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
  country: string;
}

interface ProductType {
  id: string;
  name: string;
  slug: string;
  brand_id: string;
  category_id: string;
}

interface AttributeCategory {
  id: string;
  name: string;
  slug: string;
  type: string;
  is_required: boolean;
}

interface AttributeValue {
  id: string;
  value: string;
  slug: string;
  attribute_category_id: string;
  color_code?: string;
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
    categoryId: '', // Tek kategori ID'si
    brandId: '',
    productTypeId: '',
    newBrandName: '',
    newBrandCountry: '',
    showNewBrandForm: false,
    newProductTypeName: '',
    showNewProductTypeForm: false,
    tags: [] as string[],
    newTag: '',
    seoTitle: '',
    seoDescription: '',
    isActive: true,
    isFeatured: false,
    isOnSale: false
  });

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [filteredProductTypes, setFilteredProductTypes] = useState<ProductType[]>([]);
  const [attributeCategories, setAttributeCategories] = useState<AttributeCategory[]>([]);
  const [attributeValues, setAttributeValues] = useState<AttributeValue[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<{[key: string]: string[]}>({});

  // Image state
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [dataLoading, setDataLoading] = useState(true);

  const steps = [
    { id: 1, title: 'Temel Bilgiler', description: 'Ürün adı, açıklama ve kategori' },
    { id: 2, title: 'Fiyat ve Stok', description: 'Fiyat, stok miktarı ve ürün kodları' },
    { id: 3, title: 'Özellikler', description: 'Renk, boy, cilt tipi gibi özellikler' },
    { id: 4, title: 'Görseller', description: 'Ürün fotoğrafları' },
    { id: 5, title: 'SEO ve Etiketler', description: 'Arama motoru optimizasyonu' }
  ];

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [categoriesRes, brandsRes, productTypesRes, attributeCategoriesRes, attributeValuesRes] = await Promise.all([
          supabase.from('categories_new').select('*').eq('is_active', true).order('sort_order'),
          supabase.from('brands').select('*').eq('is_active', true).order('name'),
          supabase.from('product_types').select('*').eq('is_active', true).order('sort_order'),
          supabase.from('attribute_categories').select('*').order('name'),
          supabase.from('attribute_values').select('*').order('sort_order')
        ]);

        if (categoriesRes.data) setCategories(categoriesRes.data);
        if (brandsRes.data) setBrands(brandsRes.data);
        if (productTypesRes.data) setProductTypes(productTypesRes.data);
        if (attributeCategoriesRes.data) setAttributeCategories(attributeCategoriesRes.data);
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

  // Filter product types based on selected brand and category
  useEffect(() => {
    if (formData.brandId && formData.categoryId) {
      const filtered = productTypes.filter(pt => 
        pt.brand_id === formData.brandId && pt.category_id === formData.categoryId
      );
      setFilteredProductTypes(filtered);
    } else {
      setFilteredProductTypes([]);
    }
    
    // Reset product type selection if not valid for current brand/category
    if (formData.productTypeId) {
      const isValid = productTypes.some(pt => 
        pt.id === formData.productTypeId && 
        pt.brand_id === formData.brandId && 
        pt.category_id === formData.categoryId
      );
      if (!isValid) {
        setFormData(prev => ({ ...prev, productTypeId: '' }));
      }
    }
  }, [formData.brandId, formData.categoryId, productTypes, formData.productTypeId]);

  // Handle form input changes
  const handleInputChange = (field: string, value: string | boolean | number) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as Record<string, unknown>,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
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
    const url = prompt('Görsel URL\'sini girin:');
    if (url && url.trim()) {
      setImageUrls(prev => [...prev, url.trim()]);
    }
  };



  // Handle tags
  const addTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle attributes
  const handleAttributeChange = (categoryId: string, valueId: string, checked: boolean) => {
    setSelectedAttributes(prev => {
      const category = prev[categoryId] || [];
      if (checked) {
        return { ...prev, [categoryId]: [...category, valueId] };
      } else {
        return { ...prev, [categoryId]: category.filter(id => id !== valueId) };
      }
    });
  };

  // Handle new brand creation
  const handleCreateNewBrand = async () => {
    if (!formData.newBrandName.trim() || !formData.newBrandCountry.trim()) {
      setMessage('Marka adı ve ülke bilgisi gereklidir');
      return;
    }

    try {
      const slug = formData.newBrandName.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const { data: newBrand, error } = await supabase
        .from('brands')
        .insert([{
          name: formData.newBrandName.trim(),
          slug: slug,
          country: formData.newBrandCountry.trim(),
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
        newBrandCountry: '',
        showNewBrandForm: false
      }));
      setMessage('Yeni marka başarıyla eklendi!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Marka eklenirken hata oluştu';
      setMessage(`Hata: ${errorMessage}`);
    }
  };

  // Handle new product type creation
  const handleCreateNewProductType = async () => {
    if (!formData.newProductTypeName.trim() || !formData.brandId || !formData.categoryId) {
      setMessage('Ürün çeşidi adı, marka ve kategori seçimi gereklidir');
      return;
    }

    try {
      const slug = formData.newProductTypeName.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const { data: newProductType, error } = await supabase
        .from('product_types')
        .insert([{
          name: formData.newProductTypeName.trim(),
          slug: slug,
          brand_id: formData.brandId,
          category_id: formData.categoryId,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Add new product type to list and select it
      setProductTypes(prev => [...prev, newProductType]);
      setFormData(prev => ({
        ...prev,
        productTypeId: newProductType.id,
        newProductTypeName: '',
        showNewProductTypeForm: false
      }));
      setMessage('Yeni ürün çeşidi başarıyla eklendi!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Ürün çeşidi eklenirken hata oluştu';
      setMessage(`Hata: ${errorMessage}`);
    }
  };

  // Form validation
  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.name.trim() && formData.description.trim() && formData.categoryId;
      case 2:
        return formData.price && parseFloat(formData.price) > 0;
      case 3:
        return true; // Attributes are optional
      case 4:
        return images.length > 0 || imageUrls.length > 0;
      case 5:
        return true; // SEO is optional
      default:
        return false;
    }
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateStep(5)) {
      setMessage('Lütfen tüm gerekli alanları doldurun');
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
        product_type_id: formData.productTypeId || null,
        tags: formData.tags,
        seo_title: formData.seoTitle || null,
        seo_description: formData.seoDescription || null,
        image_urls: allImageUrls,
        is_active: formData.isActive,
        is_featured: formData.isFeatured,
        is_on_sale: formData.isOnSale,
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
        stockQuantity: '', minStockLevel: '', categoryId: '', brandId: '', productTypeId: '',
        newBrandName: '', newBrandCountry: '', showNewBrandForm: false,
        newProductTypeName: '', showNewProductTypeForm: false,
        tags: [], newTag: '', seoTitle: '', seoDescription: '',
        isActive: true, isFeatured: false, isOnSale: false
      });
      setImages([]);
      setImageUrls([]);
      setImagePreviews([]);
      setSelectedAttributes({});
      setCurrentStep(1);

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
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex flex-col items-center ${
                currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {step.id}
              </div>
              <div className="text-xs mt-2 text-center">
                <div className="font-medium">{step.title}</div>
                <div className="text-muted-foreground">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {steps[currentStep - 1]?.title} - Profesyonel Ürün Yükleme
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
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
                          {brand.name} ({brand.country})
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="newBrandName">Marka Adı *</Label>
                            <Input
                              id="newBrandName"
                              value={formData.newBrandName}
                              onChange={(e) => handleInputChange('newBrandName', e.target.value)}
                              placeholder="Örn: MAC, L'Oréal"
                            />
                          </div>
                          <div>
                            <Label htmlFor="newBrandCountry">Ülke *</Label>
                            <Input
                              id="newBrandCountry"
                              value={formData.newBrandCountry}
                              onChange={(e) => handleInputChange('newBrandCountry', e.target.value)}
                              placeholder="Örn: USA, France"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleCreateNewBrand}
                            disabled={!formData.newBrandName.trim() || !formData.newBrandCountry.trim()}
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

              {/* Product Type Selection - Only show if brand and category are selected */}
              {formData.brandId && formData.categoryId && (
                <div>
                  <Label htmlFor="productType">Ürün Çeşidi</Label>
                  <div className="space-y-3">
                    <select
                      id="productType"
                      value={formData.productTypeId}
                      onChange={(e) => handleInputChange('productTypeId', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Ürün çeşidi seçin (isteğe bağlı)</option>
                      {filteredProductTypes.map((productType) => (
                        <option key={productType.id} value={productType.id}>
                          {productType.name}
                        </option>
                      ))}
                    </select>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange('showNewProductTypeForm', !formData.showNewProductTypeForm)}
                      className="text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {formData.showNewProductTypeForm ? 'İptal' : 'Yeni Ürün Çeşidi Ekle'}
                    </Button>

                    {formData.showNewProductTypeForm && (
                      <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                        <h4 className="font-medium text-sm">Yeni Ürün Çeşidi</h4>
                        <div>
                          <Label htmlFor="newProductTypeName">Ürün Çeşidi Adı *</Label>
                          <Input
                            id="newProductTypeName"
                            value={formData.newProductTypeName}
                            onChange={(e) => handleInputChange('newProductTypeName', e.target.value)}
                            placeholder="Örn: Liquid Foundation, Waterproof Mascara"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Bu ürün çeşidi seçili marka ve kategori için kullanılabilir olacak
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleCreateNewProductType}
                            disabled={!formData.newProductTypeName.trim()}
                          >
                            Ürün Çeşidi Ekle
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleInputChange('showNewProductTypeForm', false)}
                          >
                            İptal
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Breadcrumb'da "Marka > Ürün Çeşidi" şeklinde gösterilir
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Kategori *</Label>
                  <select
                    id="category"
                    value={formData.categoryId}
                    onChange={(e) => handleInputChange('categoryId', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Kategori seçin</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {'—'.repeat(cat.level * 2)} {cat.icon && `${cat.icon} `}{cat.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ana kategori, alt kategori veya alt-alt kategori seçebilirsiniz
                  </p>
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
          )}

          {/* Step 2: Pricing and Inventory */}
          {currentStep === 2 && (
            <div className="space-y-6">
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
                  <Label htmlFor="comparePrice">İndirim Öncesi Fiyat (؋)</Label>
                  <Input
                    id="comparePrice"
                    type="number"
                    step="0.01"
                    value={formData.comparePrice}
                    onChange={(e) => handleInputChange('comparePrice', e.target.value)}
                    placeholder="0.00"
                  />
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
          )}

          {/* Step 3: Attributes */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-sm text-muted-foreground mb-4">
                Ürününüzün özelliklerini seçin. Bu bilgiler müşterilerin doğru ürünü bulmasına yardımcı olur.
              </div>
              
              {attributeCategories.map((category) => {
                const categoryValues = attributeValues.filter(v => v.attribute_category_id === category.id);
                if (categoryValues.length === 0) return null;

                return (
                  <div key={category.id} className="border rounded-lg p-4">
                    <h3 className="font-medium mb-3">
                      {category.name}
                      {category.is_required && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {categoryValues.map((value) => (
                        <label key={value.id} className="flex items-center space-x-2 p-2 border rounded hover:bg-accent cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedAttributes[category.id]?.includes(value.id) || false}
                            onChange={(e) => handleAttributeChange(category.id, value.id, e.target.checked)}
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
          )}

          {/* Step 4: Images */}
          {currentStep === 4 && (
            <div className="space-y-6">
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
          )}

          {/* Step 5: SEO and Tags */}
          {currentStep === 5 && (
            <div className="space-y-6">
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
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
            >
              Önceki
            </Button>

            <div className="text-sm text-muted-foreground">
              Adım {currentStep} / {steps.length}
            </div>

            {currentStep < steps.length ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(prev => Math.min(steps.length, prev + 1))}
                disabled={!validateStep(currentStep)}
              >
                Sonraki
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || !validateStep(currentStep)}
              >
                {loading ? 'Yükleniyor...' : 'Ürünü Yayınla'}
              </Button>
            )}
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
        </CardContent>
      </Card>
    </div>
  );
} 