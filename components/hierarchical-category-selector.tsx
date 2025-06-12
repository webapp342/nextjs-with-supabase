'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  parent_id?: string;
  level: number;
  sort_order: number;
  is_active: boolean;
}

interface HierarchicalCategorySelectorProps {
  value: string; // Selected category ID (most specific)
  onChange: (categoryId: string) => void;
  required?: boolean;
}

export function HierarchicalCategorySelector({ 
  value, 
  onChange, 
  required = false 
}: HierarchicalCategorySelectorProps) {
  const supabase = createClient();
  
  // Categories by level
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [subSubCategories, setSubSubCategories] = useState<Category[]>([]);
  
  // Selected values
  const [selectedMain, setSelectedMain] = useState('');
  const [selectedSub, setSelectedSub] = useState('');
  const [selectedSubSub, setSelectedSubSub] = useState('');
  
  // New category forms
  const [showNewMainForm, setShowNewMainForm] = useState(false);
  const [showNewSubForm, setShowNewSubForm] = useState(false);
  const [showNewSubSubForm, setShowNewSubSubForm] = useState(false);
  
  const [newMainCategory, setNewMainCategory] = useState('');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [newSubSubCategory, setNewSubSubCategory] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Load all categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data: categories, error } = await supabase
          .from('categories_new')
          .select('*')
          .eq('is_active', true)
          .order('level, sort_order, name');

        if (error) throw error;

        // Separate by level
        const main = categories.filter(c => c.level === 0);
        setMainCategories(main);
        
        // If we have a current value, reconstruct the hierarchy
        if (value) {
          await reconstructHierarchy(value, categories);
        }
        
      } catch (error) {
        console.error('Error loading categories:', error);
        setMessage('Kategoriler yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Reconstruct category hierarchy from selected value
  const reconstructHierarchy = async (categoryId: string, allCategories: Category[]) => {
    const category = allCategories.find(c => c.id === categoryId);
    if (!category) return;

    if (category.level === 0) {
      // Main category selected
      setSelectedMain(categoryId);
    } else if (category.level === 1) {
      // Sub category selected
      setSelectedSub(categoryId);
      setSelectedMain(category.parent_id || '');
      
      // Load sub categories for this main
      const subs = allCategories.filter(c => c.parent_id === category.parent_id);
      setSubCategories(subs);
    } else if (category.level === 2) {
      // Sub-sub category selected
      setSelectedSubSub(categoryId);
      
      // Find parent sub category
      const parentSub = allCategories.find(c => c.id === category.parent_id);
      if (parentSub) {
        setSelectedSub(parentSub.id);
        setSelectedMain(parentSub.parent_id || '');
        
        // Load categories for UI
        const subs = allCategories.filter(c => c.parent_id === parentSub.parent_id);
        setSubCategories(subs);
        
        const subSubs = allCategories.filter(c => c.parent_id === parentSub.id);
        setSubSubCategories(subSubs);
      }
    }
  };

  // Handle main category change
  const handleMainCategoryChange = async (mainId: string) => {
    setSelectedMain(mainId);
    setSelectedSub('');
    setSelectedSubSub('');
    setSubCategories([]);
    setSubSubCategories([]);

    if (mainId) {
      // Load sub categories
      try {
        const { data: subs, error } = await supabase
          .from('categories_new')
          .select('*')
          .eq('parent_id', mainId)
          .eq('level', 1)
          .eq('is_active', true)
          .order('sort_order, name');

        if (error) throw error;
        setSubCategories(subs);
        
        // Update form value to main category
        onChange(mainId);
      } catch (error) {
        console.error('Error loading sub categories:', error);
      }
    } else {
      onChange('');
    }
  };

  // Handle sub category change
  const handleSubCategoryChange = async (subId: string) => {
    setSelectedSub(subId);
    setSelectedSubSub('');
    setSubSubCategories([]);

    if (subId) {
      // Load sub-sub categories
      try {
        const { data: subSubs, error } = await supabase
          .from('categories_new')
          .select('*')
          .eq('parent_id', subId)
          .eq('level', 2)
          .eq('is_active', true)
          .order('sort_order, name');

        if (error) throw error;
        setSubSubCategories(subSubs);
        
        // Update form value to sub category
        onChange(subId);
      } catch (error) {
        console.error('Error loading sub-sub categories:', error);
      }
    } else {
      // If no sub selected, fall back to main
      onChange(selectedMain);
    }
  };

  // Handle sub-sub category change
  const handleSubSubCategoryChange = (subSubId: string) => {
    setSelectedSubSub(subSubId);
    
    if (subSubId) {
      // Update form value to most specific category
      onChange(subSubId);
    } else {
      // If no sub-sub selected, fall back to sub
      onChange(selectedSub);
    }
  };

  // Create new main category
  const createNewMainCategory = async () => {
    if (!newMainCategory.trim()) {
      setMessage('Ana kategori adı gereklidir');
      return;
    }

    try {
      const slug = newMainCategory.toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const { data: newCategory, error } = await supabase
        .from('categories_new')
        .insert([{
          name: newMainCategory.trim(),
          slug: slug,
          level: 0,
          sort_order: mainCategories.length,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      setMainCategories(prev => [...prev, newCategory]);
      setSelectedMain(newCategory.id);
      onChange(newCategory.id);
      setNewMainCategory('');
      setShowNewMainForm(false);
      setMessage('Yeni ana kategori başarıyla eklendi!');
      
    } catch (error: any) {
      setMessage(`Hata: ${error.message}`);
    }
  };

  // Create new sub category
  const createNewSubCategory = async () => {
    if (!newSubCategory.trim() || !selectedMain) {
      setMessage('Alt kategori adı ve ana kategori seçimi gereklidir');
      return;
    }

    try {
      const slug = newSubCategory.toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const { data: newCategory, error } = await supabase
        .from('categories_new')
        .insert([{
          name: newSubCategory.trim(),
          slug: slug,
          parent_id: selectedMain,
          level: 1,
          sort_order: subCategories.length,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      setSubCategories(prev => [...prev, newCategory]);
      setSelectedSub(newCategory.id);
      onChange(newCategory.id);
      setNewSubCategory('');
      setShowNewSubForm(false);
      setMessage('Yeni alt kategori başarıyla eklendi!');
      
    } catch (error: any) {
      setMessage(`Hata: ${error.message}`);
    }
  };

  // Create new sub-sub category
  const createNewSubSubCategory = async () => {
    if (!newSubSubCategory.trim() || !selectedSub) {
      setMessage('Alt-alt kategori adı ve alt kategori seçimi gereklidir');
      return;
    }

    try {
      const slug = newSubSubCategory.toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const { data: newCategory, error } = await supabase
        .from('categories_new')
        .insert([{
          name: newSubSubCategory.trim(),
          slug: slug,
          parent_id: selectedSub,
          level: 2,
          sort_order: subSubCategories.length,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      setSubSubCategories(prev => [...prev, newCategory]);
      setSelectedSubSub(newCategory.id);
      onChange(newCategory.id);
      setNewSubSubCategory('');
      setShowNewSubSubForm(false);
      setMessage('Yeni alt-alt kategori başarıyla eklendi!');
      
    } catch (error: any) {
      setMessage(`Hata: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
        <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
        <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Category */}
      <div>
        <Label htmlFor="mainCategory">
          Ana Kategori {required && '*'}
        </Label>
        <div className="space-y-3">
          <select
            id="mainCategory"
            value={selectedMain}
            onChange={(e) => handleMainCategoryChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required={required}
          >
            <option value="">Ana kategori seçin</option>
            {mainCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon && `${category.icon} `}{category.name}
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowNewMainForm(!showNewMainForm)}
            className="text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showNewMainForm ? 'İptal' : 'Yeni Ana Kategori'}
          </Button>

          {showNewMainForm && (
            <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <h4 className="font-medium text-sm">Yeni Ana Kategori</h4>
              <Input
                value={newMainCategory}
                onChange={(e) => setNewMainCategory(e.target.value)}
                placeholder="Ana kategori adı"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={createNewMainCategory}
                  disabled={!newMainCategory.trim()}
                >
                  Ekle
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewMainForm(false)}
                >
                  İptal
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub Category */}
      {selectedMain && (
        <div>
          <Label htmlFor="subCategory">Alt Kategori</Label>
          <div className="space-y-3">
            <select
              id="subCategory"
              value={selectedSub}
              onChange={(e) => handleSubCategoryChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Alt kategori seçin (isteğe bağlı)</option>
              {subCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon && `${category.icon} `}{category.name}
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNewSubForm(!showNewSubForm)}
              className="text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              {showNewSubForm ? 'İptal' : 'Yeni Alt Kategori'}
            </Button>

            {showNewSubForm && (
              <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <h4 className="font-medium text-sm">Yeni Alt Kategori</h4>
                <Input
                  value={newSubCategory}
                  onChange={(e) => setNewSubCategory(e.target.value)}
                  placeholder="Alt kategori adı"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={createNewSubCategory}
                    disabled={!newSubCategory.trim()}
                  >
                    Ekle
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewSubForm(false)}
                  >
                    İptal
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Sub Category */}
      {selectedSub && (
        <div>
          <Label htmlFor="subSubCategory">Alt-Alt Kategori</Label>
          <div className="space-y-3">
            <select
              id="subSubCategory"
              value={selectedSubSub}
              onChange={(e) => handleSubSubCategoryChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Alt-alt kategori seçin (isteğe bağlı)</option>
              {subSubCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon && `${category.icon} `}{category.name}
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNewSubSubForm(!showNewSubSubForm)}
              className="text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              {showNewSubSubForm ? 'İptal' : 'Yeni Alt-Alt Kategori'}
            </Button>

            {showNewSubSubForm && (
              <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <h4 className="font-medium text-sm">Yeni Alt-Alt Kategori</h4>
                <Input
                  value={newSubSubCategory}
                  onChange={(e) => setNewSubSubCategory(e.target.value)}
                  placeholder="Alt-alt kategori adı"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={createNewSubSubCategory}
                    disabled={!newSubSubCategory.trim()}
                  >
                    Ekle
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewSubSubForm(false)}
                  >
                    İptal
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Category Path */}
      {(selectedMain || selectedSub || selectedSubSub) && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-700 font-medium">Seçilen Kategori Yolu:</div>
          <div className="text-sm text-blue-600 mt-1" dir="rtl">
            {selectedSubSub ? 
              `${mainCategories.find(c => c.id === selectedMain)?.name} ← ${subCategories.find(c => c.id === selectedSub)?.name} ← ${subSubCategories.find(c => c.id === selectedSubSub)?.name}` :
              selectedSub ?
              `${mainCategories.find(c => c.id === selectedMain)?.name} ← ${subCategories.find(c => c.id === selectedSub)?.name}` :
              mainCategories.find(c => c.id === selectedMain)?.name
            }
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-md text-sm ${
          message.includes('başarıyla') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
} 