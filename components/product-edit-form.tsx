'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  description?: string;
  short_description?: string;
  price: number;
  compare_price?: number;
  sku?: string;
  barcode?: string;
  stock_quantity?: number;
  min_stock_level?: number;
  category_id?: string;
  brand_id?: string;
  tags?: string[];
  seo_title?: string;
  seo_description?: string;
  image_urls?: string[];
  is_active: boolean;
  is_featured: boolean;
  is_on_sale: boolean;
  is_bestseller: boolean;
  is_recommended: boolean;
  is_new: boolean;
  stock_tracking_link?: string;
}

interface ProductEditFormProps {
  product: Product;
}

export function ProductEditForm({ product }: ProductEditFormProps) {
  const supabase = createClient();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: product.name || '',
    description: product.description || '',
    short_description: product.short_description || '',
    price: product.price?.toString() || '',
    compare_price: product.compare_price?.toString() || '',
    sku: product.sku || '',
    barcode: product.barcode || '',
    stock_quantity: product.stock_quantity?.toString() || '0',
    min_stock_level: product.min_stock_level?.toString() || '0',
    stock_tracking_link: product.stock_tracking_link || '',
    is_active: product.is_active,
    is_featured: product.is_featured,
    is_on_sale: product.is_on_sale,
    is_bestseller: product.is_bestseller,
    is_recommended: product.is_recommended,
    is_new: product.is_new
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.price) {
      setMessage('Lütfen ürün adı ve fiyat alanlarını doldurun');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        short_description: formData.short_description,
        price: parseFloat(formData.price),
        compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
        sku: formData.sku || null,
        barcode: formData.barcode || null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        min_stock_level: parseInt(formData.min_stock_level) || 0,
        stock_tracking_link: formData.stock_tracking_link || null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        is_on_sale: formData.is_on_sale,
        is_bestseller: formData.is_bestseller,
        is_recommended: formData.is_recommended,
        is_new: formData.is_new,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', product.id);

      if (error) throw error;

      setMessage('Ürün başarıyla güncellendi!');
      
      setTimeout(() => {
        router.push('/protected/products/manage');
      }, 1500);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
      setMessage(`Hata: ${errorMessage}`);
      console.error('Product update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Ürün Düzenleme</CardTitle>
          <p className="text-muted-foreground">
            Ürün bilgilerini güncelleyin.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Temel Bilgiler</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Ürün Adı *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ürün adı"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Fiyat (؋) *</Label>
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
              </div>

              <div>
                <Label htmlFor="short_description">Kısa Açıklama</Label>
                <Input
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) => handleInputChange('short_description', e.target.value)}
                  placeholder="Ürün için kısa açıklama"
                />
              </div>

              <div>
                <Label htmlFor="description">Detaylı Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Ürün hakkında detaylı bilgi"
                  rows={4}
                />
              </div>
            </div>

            {/* Price and Stock */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Fiyat ve Stok</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="compare_price">İndirim Öncesi Fiyat (؋)</Label>
                  <Input
                    id="compare_price"
                    type="number"
                    step="0.01"
                    value={formData.compare_price}
                    onChange={(e) => handleInputChange('compare_price', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="stock_quantity">Stok Miktarı</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                    placeholder="0"
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
                    placeholder="PROD-001"
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
                  <Label htmlFor="min_stock_level">Minimum Stok Seviyesi</Label>
                  <Input
                    id="min_stock_level"
                    type="number"
                    value={formData.min_stock_level}
                    onChange={(e) => handleInputChange('min_stock_level', e.target.value)}
                    placeholder="5"
                  />
                </div>
                <div>
                  <Label htmlFor="stock_tracking_link">Stok Takip Linki</Label>
                  <Input
                    id="stock_tracking_link"
                    type="url"
                    value={formData.stock_tracking_link}
                    onChange={(e) => handleInputChange('stock_tracking_link', e.target.value)}
                    placeholder="https://example.com/stock-tracking"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Stok takip için harici link (isteğe bağlı)
                  </p>
                </div>
              </div>
            </div>

            {/* Status Checkboxes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Ürün Durumu</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  />
                  <Label htmlFor="is_active">Aktif</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                  />
                  <Label htmlFor="is_featured">Öne Çıkan</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_on_sale"
                    checked={formData.is_on_sale}
                    onChange={(e) => handleInputChange('is_on_sale', e.target.checked)}
                  />
                  <Label htmlFor="is_on_sale">İndirimli</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_bestseller"
                    checked={formData.is_bestseller}
                    onChange={(e) => handleInputChange('is_bestseller', e.target.checked)}
                  />
                  <Label htmlFor="is_bestseller">Çok Satan</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_recommended"
                    checked={formData.is_recommended}
                    onChange={(e) => handleInputChange('is_recommended', e.target.checked)}
                  />
                  <Label htmlFor="is_recommended">Önerilen</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_new"
                    checked={formData.is_new}
                    onChange={(e) => handleInputChange('is_new', e.target.checked)}
                  />
                  <Label htmlFor="is_new">Yeni</Label>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => router.push('/protected/products/manage')}
              >
                İptal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8"
              >
                {loading ? 'Güncelleniyor...' : 'Ürünü Güncelle'}
              </Button>
            </div>

            {message && (
              <div className={`text-center text-sm p-3 rounded ${
                message.includes('Hata') 
                  ? 'text-red-700 bg-red-50 border border-red-200' 
                  : 'text-green-700 bg-green-50 border border-green-200'
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