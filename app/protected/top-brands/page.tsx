'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { HierarchicalCategorySelector } from '@/components/hierarchical-category-selector'
import Image from 'next/image'

interface TopBrand {
  id: string
  title: string
  image_url: string
  brand_id: string
  link_type: 'category' | 'brand' | 'url' | 'tag'
  link_category_id?: string
  link_brand_id?: string
  link_url?: string
  link_tag?: string
  sort_order: number
  is_active: boolean
  created_at: string
  brand: {
    id: string
    name: string
    slug: string
  }
}

interface Brand {
  id: string
  name: string
  slug: string
}

export default function TopBrandsPage() {
  const [topBrands, setTopBrands] = useState<TopBrand[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editBrand, setEditBrand] = useState<TopBrand | null>(null)
  const [uploading, setUploading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<{
    title: string
    image_url: string
    brand_id: string
    link_type: 'category' | 'brand' | 'url' | 'tag'
    link_category_id: string
    link_brand_id: string
    link_url: string
    link_tag: string
    is_active: boolean
  }>({
    title: '',
    image_url: '',
    brand_id: '',
    link_type: 'brand',
    link_category_id: '',
    link_brand_id: '',
    link_url: '',
    link_tag: '',
    is_active: true
  })

  const supabase = createClient()

  // Helper function to build hierarchical category URL
  const buildCategoryUrl = async (categoryId: string): Promise<string> => {
    try {
      const { data: category, error } = await supabase
        .from('categories_new')
        .select('id, slug, parent_id, level')
        .eq('id', categoryId)
        .single()

      if (error || !category) return '/category'

      // Build path by traversing up the hierarchy
      const pathSegments = [category.slug]
      let currentCategory = category

      while (currentCategory.parent_id) {
        const { data: parentCategory, error: parentError } = await supabase
          .from('categories_new')
          .select('id, slug, parent_id, level')
          .eq('id', currentCategory.parent_id)
          .single()

        if (parentError || !parentCategory) break
        
        pathSegments.unshift(parentCategory.slug)
        currentCategory = parentCategory
      }

      return `/category/${pathSegments.join('/')}`
    } catch (error) {
      console.error('Error building category URL:', error)
      return '/category'
    }
  }

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      
      // First check if tables exist and fetch brands
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name')
      
      if (brandsError) {
        console.error('Error fetching brands:', brandsError)
        setError('Markalar yüklenirken hata oluştu. Lütfen sayfayı yenileyin.')
        throw brandsError
      }
      setBrands(brandsData || [])

      // Then try to fetch top brands - table might not exist yet
      const { data: topBrandsData, error: topBrandsError } = await supabase
        .from('top_brands')
        .select(`
          id,
          title,
          image_url,
          brand_id,
          link_type,
          link_category_id,
          link_brand_id,
          link_url,
          link_tag,
          sort_order,
          is_active,
          created_at,
          brands!top_brands_brand_id_fkey(id, name, slug)
        `)
        .order('sort_order')
      
      if (topBrandsError) {
        console.error('Error fetching top brands:', topBrandsError)
        // If table doesn't exist, just set empty array
        if (topBrandsError.code === 'PGRST116' || topBrandsError.message?.includes('does not exist')) {
          console.warn('top_brands table does not exist yet. Please run database migrations.')
          setError('Top brands tablosu henüz oluşturulmamış. Lütfen veritabanı migration\'larını çalıştırın.')
          setTopBrands([])
        } else {
          setError('En iyi markalar yüklenirken hata oluştu.')
          throw topBrandsError
        }
      } else {
        // Transform the data to match our interface
        const transformedTopBrands = (topBrandsData || []).map(item => ({
          ...item,
          brand: Array.isArray(item.brands) ? item.brands[0] : item.brands
        }));
        setTopBrands(transformedTopBrands as TopBrand[])
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      // Show user-friendly error
      if (error instanceof Error) {
        console.error('Detailed error:', error.message)
      }
      if (!error) {
        setError('Veriler yüklenirken beklenmeyen bir hata oluştu.')
      }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `top-brands/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, image_url: data.publicUrl }))
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Resim yüklenirken hata oluştu!')
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      image_url: '',
      brand_id: '',
      link_type: 'brand',
      link_category_id: '',
      link_brand_id: '',
      link_url: '',
      link_tag: '',
      is_active: true
    })
    setEditBrand(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.image_url || !formData.brand_id) {
      alert('Lütfen başlık, resim ve marka alanlarını doldurun!')
      return
    }

    // Validate link fields based on link type
    if (formData.link_type === 'category' && !formData.link_category_id) {
      alert('Lütfen bir kategori seçin!')
      return
    }
    if (formData.link_type === 'brand' && !formData.link_brand_id) {
      alert('Lütfen bir marka seçin!')
      return
    }
    if (formData.link_type === 'tag' && !formData.link_tag) {
      alert('Lütfen bir etiket girin!')
      return
    }
    if (formData.link_type === 'url' && !formData.link_url) {
      alert('Lütfen bir URL girin!')
      return
    }

    try {
      let link_url = formData.link_url
      
      // Generate URL based on link type
      if (formData.link_type === 'category' && formData.link_category_id) {
        link_url = await buildCategoryUrl(formData.link_category_id)
      } else if (formData.link_type === 'brand' && formData.link_brand_id) {
        const brand = brands.find(b => b.id === formData.link_brand_id)
        if (brand) {
          link_url = `/brand/${brand.slug}`
        }
      } else if (formData.link_type === 'tag' && formData.link_tag) {
        link_url = `/tags/${formData.link_tag}`
      }

      const brandData = {
        title: formData.title,
        image_url: formData.image_url,
        brand_id: formData.brand_id,
        link_type: formData.link_type,
        link_category_id: formData.link_type === 'category' ? formData.link_category_id : null,
        link_brand_id: formData.link_type === 'brand' ? formData.link_brand_id : null,
        link_url: formData.link_type === 'url' ? formData.link_url : link_url,
        link_tag: formData.link_type === 'tag' ? formData.link_tag : null,
        is_active: formData.is_active,
        sort_order: editBrand ? editBrand.sort_order : topBrands.length + 1
      }

      if (editBrand) {
        const { error } = await supabase
          .from('top_brands')
          .update(brandData)
          .eq('id', editBrand.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('top_brands')
          .insert([brandData])
        
        if (error) throw error
      }

      await fetchData()
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error saving brand:', error)
      alert('Marka kaydedilirken hata oluştu!')
    }
  }

  const handleEdit = (brand: TopBrand) => {
    setEditBrand(brand)
    setFormData({
      title: brand.title,
      image_url: brand.image_url,
      brand_id: brand.brand_id,
      link_type: brand.link_type,
      link_category_id: brand.link_category_id || '',
      link_brand_id: brand.link_brand_id || '',
      link_url: brand.link_url || '',
      link_tag: brand.link_tag || '',
      is_active: brand.is_active
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu markayı silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('top_brands')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Error deleting brand:', error)
      alert('Marka silinirken hata oluştu!')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('top_brands')
        .update({ is_active: !isActive })
        .eq('id', id)

      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Error toggling active status:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">En İyi Markalar Yönetimi</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Hata</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-2 text-sm text-red-500">
            <p>Çözüm önerileri:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Sayfayı yenileyin (F5)</li>
              <li>Veritabanı bağlantınızı kontrol edin</li>
              <li>Supabase dashboard&apos;dan top_brands tablosunun var olduğunu kontrol edin</li>
              <li>Gerekirse aşağıdaki SQL&apos;i Supabase SQL Editor&apos;da çalıştırın:</li>
            </ul>
          </div>
          <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs font-mono overflow-x-auto">
            <pre>{`-- Top brands tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.top_brands (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  image_url text NOT NULL,
  brand_id uuid NOT NULL,
  link_type character varying DEFAULT 'brand'::character varying,
  link_category_id uuid,
  link_brand_id uuid,
  link_url text,
  link_tag character varying,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT top_brands_pkey PRIMARY KEY (id),
  CONSTRAINT top_brands_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id)
);

-- RLS politikalarını etkinleştir
ALTER TABLE public.top_brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.top_brands FOR SELECT USING (true);`}</pre>
          </div>
          <Button 
            onClick={() => {
              setError(null)
              fetchData()
            }}
            className="mt-4"
          >
            Tekrar Dene
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">En İyi Markalar Yönetimi</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Marka Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editBrand ? 'Marka Düzenle' : 'Yeni Marka Ekle'}
              </DialogTitle>
              <DialogDescription>
                En iyi markalar bölümünde gösterilecek marka bilgilerini doldurun.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Başlık *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Marka başlığı"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Marka Seçin *</Label>
                <Select
                  value={formData.brand_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, brand_id: value }))}
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

              <div className="space-y-2">
                <Label htmlFor="image">Marka Resmi *</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {formData.image_url && (
                  <div className="mt-2">
                    <Image
                      src={formData.image_url}
                      alt="Preview"
                      width={100}
                      height={100}
                      className="rounded-lg object-contain border"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="link-type">Link Türü *</Label>
                <Select
                  value={formData.link_type}
                  onValueChange={(value: 'category' | 'brand' | 'url' | 'tag') => 
                    setFormData(prev => ({ 
                      ...prev, 
                      link_type: value,
                      link_category_id: '',
                      link_brand_id: '',
                      link_tag: '',
                      link_url: ''
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Link türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brand">Marka</SelectItem>
                    <SelectItem value="category">Kategori</SelectItem>
                    <SelectItem value="tag">Etiket</SelectItem>
                    <SelectItem value="url">Özel URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.link_type === 'category' && (
                <div className="space-y-2">
                  <Label>Kategori Seçin *</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="link-brand">Link Marka Seçin *</Label>
                  <Select
                    value={formData.link_brand_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, link_brand_id: value }))}
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
                <div className="space-y-2">
                  <Label htmlFor="tag">Etiket *</Label>
                  <Input
                    id="tag"
                    value={formData.link_tag}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_tag: e.target.value }))}
                    placeholder="Etiket adı"
                    required
                  />
                </div>
              )}

              {formData.link_type === 'url' && (
                <div className="space-y-2">
                  <Label htmlFor="url">URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                    placeholder="https://example.com"
                    required
                  />
                </div>
              )}

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

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Yükleniyor...' : (editBrand ? 'Güncelle' : 'Ekle')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {topBrands.map((brand) => (
          <Card key={brand.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                    <Image
                      src={brand.image_url}
                      alt={brand.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{brand.title}</h3>
                    <p className="text-gray-600">{brand.brand.name}</p>
                    <p className="text-sm text-gray-500">
                      Link: {brand.link_type} | Sıra: {brand.sort_order}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant={brand.is_active ? "default" : "secondary"}
                    size="sm"
                    onClick={() => handleToggleActive(brand.id, brand.is_active)}
                  >
                    {brand.is_active ? 'Aktif' : 'Pasif'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(brand)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(brand.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {topBrands.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Henüz marka eklenmemiş. İlk markanızı eklemek için yukarıdaki butonu kullanın.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 