'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Edit, 
  Trash2, 
  Search, 
  Eye,
  Package
} from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_urls?: string[];
  is_active: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  stock_quantity: number;
  brand?: string;
  category?: string;
  created_at: string;
}

export function ProductManagement() {
  const supabase = createClient();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);

      if (error) throw error;
      
      // Update local state
      setProducts(prev => 
        prev.map(product => 
          product.id === productId 
            ? { ...product, is_active: !currentStatus }
            : product
        )
      );
    } catch (error) {
      console.error('Ürün durumu güncellenirken hata:', error);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      // Update local state
      setProducts(prev => prev.filter(product => product.id !== productId));
    } catch (error) {
      console.error('Ürün silinirken hata:', error);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && product.is_active) ||
                         (filter === 'inactive' && !product.is_active);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ürün</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kategori/Marka</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fiyat</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stok</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Durum</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i}>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8"></div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12"></div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1">
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Ürün adı, marka veya kategori ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Tümü ({products.length})
              </Button>
              <Button
                variant={filter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('active')}
              >
                Aktif ({products.filter(p => p.is_active).length})
              </Button>
              <Button
                variant={filter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('inactive')}
              >
                Pasif ({products.filter(p => !p.is_active).length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz ürün bulunmuyor'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Farklı anahtar kelimeler deneyin' : 'İlk ürününüzü eklemek için Ürün Ekleme sayfasını kullanın'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ürün
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Kategori/Marka
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fiyat
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Stok
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                            {product.image_urls && product.image_urls.length > 0 && product.image_urls[0] ? (
                              <Image 
                                src={product.image_urls[0]} 
                                alt={product.name} 
                                width={100}
                                height={100}
                                className="w-full h-full object-cover rounded"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                                <span className="text-gray-400 text-xs">تصویر موجود نیست</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {product.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(product.created_at).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {product.category || '-'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {product.brand || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          ₺{product.price.toLocaleString('tr-TR')}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {product.stock_quantity}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <Badge 
                            variant={product.is_active ? "default" : "secondary"}
                            className="w-fit text-xs"
                          >
                            {product.is_active ? 'Aktif' : 'Pasif'}
                          </Badge>
                          <div className="flex gap-1">
                            {product.is_featured && (
                              <Badge variant="outline" className="text-xs">Öne Çıkan</Badge>
                            )}
                            {product.is_bestseller && (
                              <Badge variant="outline" className="text-xs">Bestseller</Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => toggleProductStatus(product.id, product.is_active)}
                          >
                            {product.is_active ? 'Pasif' : 'Aktif'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>
              Toplam {filteredProducts.length} ürün gösteriliyor
            </span>
            <span>
              {products.filter(p => p.is_active).length} aktif • {products.filter(p => !p.is_active).length} pasif
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 