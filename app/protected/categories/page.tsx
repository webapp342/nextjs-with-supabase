'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X, Upload, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image_url?: string;
  parent_id?: string;
  level: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Category>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasImageColumn, setHasImageColumn] = useState(true);

  const supabase = createClient();

  const fetchCategories = useCallback(async () => {
    try {
      setError(null);
      
      // First try to fetch with image_url column
      const result = await supabase
        .from('categories_new')
        .select('*')
        .order('level, sort_order, name');
      
      let data = result.data;
      const fetchError = result.error;
      
      if (fetchError) {
        // If error mentions image_url column, try without it
        if (fetchError.message.includes('image_url')) {
          setHasImageColumn(false);
          const { data: dataWithoutImage, error: errorWithoutImage } = await supabase
            .from('categories_new')
            .select('id, name, slug, description, icon, parent_id, level, sort_order, is_active, created_at, updated_at')
            .order('level, sort_order, name');
          
          if (errorWithoutImage) throw errorWithoutImage;
          data = dataWithoutImage;
        } else {
          throw fetchError;
        }
      }
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('خطا در بارگذاری دسته‌بندی‌ها. لطفاً صفحه را رفرش کنید.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData(category);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '',
      image_url: '',
      level: 0,
      sort_order: 0,
      is_active: true
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({});
    setError(null);
  };

  const handleImageUpload = async (file: File) => {
    if (!file || !hasImageColumn) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `category-${Date.now()}.${fileExt}`;
      const filePath = `categories/${fileName}`;

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
      setError('خطا در آپلود تصویر');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      
      // Remove image_url from formData if column doesn't exist
      const dataToSave = hasImageColumn ? formData : { ...formData };
      if (!hasImageColumn) {
        delete dataToSave.image_url;
      }
      
      if (isCreating) {
        const { error } = await supabase
          .from('categories_new')
          .insert([dataToSave]);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories_new')
          .update(dataToSave)
          .eq('id', editingId);
        
        if (error) throw error;
      }

      await fetchCategories();
      handleCancel();
    } catch (error) {
      console.error('Error saving category:', error);
      setError('خطا در ذخیره کردن. لطفاً دوباره تلاش کنید.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا مطمئن هستید؟')) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('categories_new')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('خطا در حذف. لطفاً دوباره تلاش کنید.');
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const runMigration = async () => {
    try {
      setError(null);
      const { error } = await supabase.rpc('exec', {
        sql: 'ALTER TABLE public.categories_new ADD COLUMN IF NOT EXISTS image_url text;'
      });
      
      if (error) throw error;
      
      setHasImageColumn(true);
      await fetchCategories();
      alert('ستون image_url با موفقیت اضافه شد!');
    } catch (error) {
      console.error('Error running migration:', error);
      setError('خطا در اجرای migration. لطفاً از طریق Supabase Dashboard این SQL را اجرا کنید: ALTER TABLE public.categories_new ADD COLUMN image_url text;');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-right">مدیریت دسته‌بندی‌ها</h1>
        <Button onClick={handleCreate} className="bg-pink-600 hover:bg-pink-700">
          <Plus className="w-4 h-4 mr-2" />
          دسته‌بندی جدید
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Migration Notice */}
      {!hasImageColumn && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertCircle className="w-5 h-5" />
                <span>ستون image_url در جدول categories_new وجود ندارد. برای استفاده از قابلیت آپلود تصویر، ابتدا migration را اجرا کنید.</span>
              </div>
              <Button onClick={runMigration} variant="outline" size="sm">
                اجرای Migration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-right">
              {isCreating ? 'ایجاد دسته‌بندی جدید' : 'ویرایش دسته‌بندی'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-right block mb-2">نام دسته‌بندی</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      name,
                      slug: generateSlug(name)
                    }));
                  }}
                  className="text-right"
                  placeholder="نام دسته‌بندی را وارد کنید"
                />
              </div>
              <div>
                <Label htmlFor="slug" className="text-right block mb-2">نامک (Slug)</Label>
                <Input
                  id="slug"
                  value={formData.slug || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="text-left"
                  placeholder="category-slug"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-right block mb-2">توضیحات</Label>
              <Input
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="text-right"
                placeholder="توضیحات دسته‌بندی"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="icon" className="text-right block mb-2">آیکون (ایموجی)</Label>
                <Input
                  id="icon"
                  value={formData.icon || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="text-center text-2xl"
                  placeholder="🛍️"
                />
              </div>
              <div>
                <Label htmlFor="sort_order" className="text-right block mb-2">ترتیب نمایش</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) }))}
                  className="text-center"
                />
              </div>
            </div>

            {/* Image Upload - Only show if column exists */}
            {hasImageColumn && (
              <div>
                <Label className="text-right block mb-2">تصویر دسته‌بندی</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    آپلود تصویر
                  </label>
                  {formData.image_url && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                      <Image
                        src={formData.image_url}
                        alt="Category image"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
                {formData.image_url && (
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    className="mt-2 text-left text-sm"
                    placeholder="URL تصویر"
                  />
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                لغو
              </Button>
              <Button onClick={handleSave} className="bg-pink-600 hover:bg-pink-700">
                <Save className="w-4 h-4 mr-2" />
                ذخیره
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <div className="grid gap-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {hasImageColumn && category.image_url ? (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border">
                        <Image
                          src={category.image_url}
                          alt={category.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                        {category.icon || '📁'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-right">{category.name}</h3>
                      <p className="text-sm text-gray-500 text-left">{category.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? 'فعال' : 'غیرفعال'}
                    </Badge>
                    <Badge variant="outline">سطح {category.level}</Badge>
                    <Badge variant="outline">ترتیب {category.sort_order}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {category.description && (
                <p className="text-sm text-gray-600 mt-2 text-right">{category.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 