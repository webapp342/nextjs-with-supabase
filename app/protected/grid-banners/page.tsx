'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

interface GridBanner {
  id: string
  title: string
  image_url: string
  mobile_image_url?: string
  link_type: 'category' | 'brand' | 'custom' | 'tag'
  link_category_id?: string
  link_brand_id?: string
  link_tag?: string
  link_url?: string
  sort_order: number
  is_active: boolean
  created_at: string
}

interface Category {
  id: string
  name: string
  slug: string
  level: number
  parent_id?: string
}

interface Brand {
  id: string
  name: string
  slug: string
}

export default function GridBannersPage() {
  const [banners, setBanners] = useState<GridBanner[]>([])
  const [, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editBanner, setEditBanner] = useState<GridBanner | null>(null)
  const [uploading, setUploading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<{
    title: string
    image_url: string
    mobile_image_url: string
    link_type: 'category' | 'brand' | 'custom' | 'tag'
    link_category_id: string
    link_brand_id: string
    link_tag: string
    link_url: string
    is_active: boolean
  }>({
    title: '',
    image_url: '',
    mobile_image_url: '',
    link_type: 'category',
    link_category_id: '',
    link_brand_id: '',
    link_tag: '',
    link_url: '',
    is_active: true
  })

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    try {
      // Fetch banners
      const { data: bannersData, error: bannersError } = await supabase
        .from('grid_banners')
        .select('*')
        .order('sort_order')
      
      if (bannersError) throw bannersError
      setBanners(bannersData || [])

      // Fetch categories for dropdown
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories_new')
        .select('id, name, slug, level, parent_id')
        .eq('is_active', true)
        .order('name')
      
      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

      // Fetch brands for dropdown
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name')
      
      if (brandsError) throw brandsError
      setBrands(brandsData || [])

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, isMobile = false) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `grid-banners/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      if (isMobile) {
        setFormData(prev => ({ ...prev, mobile_image_url: data.publicUrl }))
      } else {
        setFormData(prev => ({ ...prev, image_url: data.publicUrl }))
      }
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
      mobile_image_url: '',
      link_type: 'category',
      link_category_id: '',
      link_brand_id: '',
      link_tag: '',
      link_url: '',
      is_active: true
    })
    setEditBanner(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.image_url) {
      alert('Lütfen başlık ve resim alanlarını doldurun!')
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
    if (formData.link_type === 'custom' && !formData.link_url) {
      alert('Lütfen bir URL girin!')
      return
    }

    try {
      const bannerData = {
        title: formData.title,
        image_url: formData.image_url,
        mobile_image_url: formData.mobile_image_url || null,
        link_type: formData.link_type,
        link_category_id: formData.link_type === 'category' ? formData.link_category_id : null,
        link_brand_id: formData.link_type === 'brand' ? formData.link_brand_id : null,
        link_tag: formData.link_type === 'tag' ? formData.link_tag : null,
        link_url: formData.link_type === 'custom' ? formData.link_url : null,
        is_active: formData.is_active,
        sort_order: editBanner ? editBanner.sort_order : banners.length + 1
      }

      if (editBanner) {
        const { error } = await supabase
          .from('grid_banners')
          .update(bannerData)
          .eq('id', editBanner.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('grid_banners')
          .insert([bannerData])
        
        if (error) throw error
      }

      await fetchData()
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error saving banner:', error)
      alert('Banner kaydedilirken hata oluştu!')
    }
  }

  const handleEdit = (banner: GridBanner) => {
    setEditBanner(banner)
    setFormData({
      title: banner.title,
      image_url: banner.image_url,
      mobile_image_url: banner.mobile_image_url || '',
      link_type: banner.link_type,
      link_category_id: banner.link_category_id || '',
      link_brand_id: banner.link_brand_id || '',
      link_tag: banner.link_tag || '',
      link_url: banner.link_url || '',
      is_active: banner.is_active
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu banner\'ı silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('grid_banners')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Error deleting banner:', error)
      alert('Banner silinirken hata oluştu!')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('grid_banners')
        .update({ is_active: !isActive })
        .eq('id', id)
      
      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('Error updating banner status:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Grid Banner Yönetimi</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Banner Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editBanner ? 'Banner Düzenle' : 'Yeni Banner Ekle'}
              </DialogTitle>
              <DialogDescription>
                Grid banner bilgilerini doldurun. Tüm alanlar zorunludur.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Başlık *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Banner başlığı"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="desktop-image">Desktop Resim *</Label>
                  <Input
                    id="desktop-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, false)}
                    disabled={uploading}
                  />
                  {formData.image_url && (
                    <div className="mt-2">
                      <Image
                        src={formData.image_url}
                        alt="Desktop preview"
                        width={200}
                        height={133}
                        className="rounded-lg object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile-image">Mobile Resim (Opsiyonel)</Label>
                  <Input
                    id="mobile-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, true)}
                    disabled={uploading}
                  />
                  {formData.mobile_image_url && (
                    <div className="mt-2">
                      <Image
                        src={formData.mobile_image_url}
                        alt="Mobile preview"
                        width={200}
                        height={133}
                        className="rounded-lg object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="link-type">Link Türü *</Label>
                <Select
                  value={formData.link_type}
                  onValueChange={(value: 'category' | 'brand' | 'custom' | 'tag') => 
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
                    <SelectItem value="category">Kategori</SelectItem>
                    <SelectItem value="brand">Marka</SelectItem>
                    <SelectItem value="tag">Etiket</SelectItem>
                    <SelectItem value="custom">Özel URL</SelectItem>
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
                  <Label htmlFor="brand">Marka Seçin *</Label>
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

              {formData.link_type === 'custom' && (
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
                  {uploading ? 'Yükleniyor...' : editBanner ? 'Güncelle' : 'Kaydet'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => (
          <Card key={banner.id} className="overflow-hidden">
            <div className="aspect-[3/2] relative">
              <Image
                src={banner.image_url}
                alt={banner.title}
                fill
                className="object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="sm"
                  variant={banner.is_active ? "default" : "secondary"}
                  onClick={() => handleToggleActive(banner.id, banner.is_active)}
                >
                  {banner.is_active ? 'Aktif' : 'Pasif'}
                </Button>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-lg">{banner.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Tür:</strong> {banner.link_type}</p>
                <p><strong>Sıra:</strong> {banner.sort_order}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(banner)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Düzenle
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(banner.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Sil
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {banners.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Henüz banner eklenmemiş.</p>
          <p className="text-gray-400">Yeni banner eklemek için yukarıdaki butonu kullanın.</p>
        </div>
      )}
    </div>
  )
} 