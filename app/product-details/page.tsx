'use client';

import { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft } from 'lucide-react';
import { toPersianNumber } from '@/lib/utils';
import { Breadcrumb } from '@/components/breadcrumb';
import { useSearchParams, useRouter } from 'next/navigation';
import { cartClientActions } from '@/lib/cart-client';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/cart-context';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_urls: string[];
  brand: string;
  user_id: string;
  brand_id: string;
  category_id: string;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

function ProductDetailsContent() {
  const [product, setProduct] = useState<Product | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get('id');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { refreshCart } = useCart();
  
  const supabase = createClient();

  useEffect(() => {
    // Check authentication
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase.auth]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError('Product ID is missing.');
        setLoading(false);
        return;
      }

      // Fetch product with brand and category info
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) {
        setError(productError.message);
        setLoading(false);
        return;
      }

      setProduct(productData as Product);

      // Fetch brand info
      if (productData.brand_id) {
        const { data: brandData } = await supabase
          .from('brands')
          .select('id, name, slug')
          .eq('id', productData.brand_id)
          .single();
        
        if (brandData) setBrand(brandData);
      }

      // Fetch category info
      if (productData.category_id) {
        const { data: categoryData } = await supabase
          .from('categories_new')
          .select('id, name, slug')
          .eq('id', productData.category_id)
          .single();
        
        if (categoryData) setCategory(categoryData);
      }

      setLoading(false);
    };

    fetchProduct();
  }, [productId, supabase]);

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/auth/login?redirect=' + encodeURIComponent(`/product-details?id=${productId}`));
      return;
    }

    if (!product) return;

    setAddingToCart(true);
    try {
      await cartClientActions.addToCart(product.id, quantity);
      
      // Refresh cart count in navbar
      await refreshCart();
      
      // Show success message or redirect
      alert('محصول با موفقیت به سبد خرید اضافه شد');
      
      // Optionally redirect to cart
      // router.push('/cart');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('خطا در افزودن محصول به سبد خرید');
    } finally {
      setAddingToCart(false);
    }
  };

  const updateQuantity = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return <p>Ürün detayları yükleniyor...</p>;
  }

  if (error) {
    return <p>Ürün detayları yüklenirken hata oluştu: {error}</p>;
  }

  if (!product) {
    return <p>Ürün bulunamadı.</p>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Kategori Breadcrumb - Fotoğrafın Üstünde */}
      <Breadcrumb />
      
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative w-full h-96 bg-gray-50 rounded-lg overflow-hidden">
            {product.image_urls && product.image_urls.length > 0 && product.image_urls[0] ? (
              <Image 
                src={product.image_urls[0]} 
                alt={product.name} 
                width={600}
                height={600}
                className="w-full h-auto object-contain rounded-lg"
                unoptimized
              />
            ) : (
              <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">تصویر موجود نیست</span>
              </div>
            )}
          </div>
          
          {/* Thumbnail Images */}
          {product.image_urls && product.image_urls.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.image_urls.slice(1, 5).map((url, index) => (
                <div key={index} className="relative w-full h-20 bg-gray-50 rounded-md overflow-hidden">
                  <Image 
                    src={url} 
                    alt={`${product.name} - ${index + 2}`} 
                    fill
                    className="object-cover cursor-pointer hover:opacity-80" 
                    unoptimized 
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Brand + Category Breadcrumb - Fotoğrafın Altında */}
        {brand && category && (
          <div className="lg:col-span-2">
            <div className="py-2" dir="rtl">
              <div className="text-sm text-gray-600 text-right">
                <div className="flex items-center gap-2 ">
                  <a 
                    href={`/brand/${brand.slug}`}
                    className="text-gray-700 hover:text-gray-900 transition-colors font-lalezar"
                  >
                    {brand.name}
                  </a>
                  <ChevronLeft className="w-4 h-4 text-gray-400" />
                  <a 
                    href={`/brand/${brand.slug}/${category.slug}`}
                    className="text-gray-900 hover:text-gray-700 transition-colors font-lalezar"
                  >
                    {category.name} {brand.name}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Info */}
        <div className="space-y-6">
          {/* Brand */}
          

          {/* Product Name */}
          <h1 className="text-2xl text-right leading-tight font-lalezar">
            {product.name}
          </h1>

          {/* Price */}
          <div className="space-y-2">
            <div className="text-2xl font-bold text-right">
              <span className="text-left font-far-akbar font-bold">؋ &lrm;{toPersianNumber(product.price.toLocaleString())}</span>
            </div>
            <div className="text-sm text-gray-500 text-right">
              شامل مالیات بر ارزش افزوده
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-right">رنگ:</h3>
            <div className="flex flex-wrap gap-2 justify-end">
              {['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'].map((color, index) => (
                <button
                  key={index}
                  className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-500"
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-right">تعداد:</h3>
            <div className="flex items-center justify-end gap-3">
              <button 
                className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                onClick={() => updateQuantity(quantity + 1)}
              >
                +
              </button>
              <span className="text-lg font-medium">{toPersianNumber(quantity)}</span>
              <button 
                className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                onClick={() => updateQuantity(quantity - 1)}
                disabled={quantity <= 1}
              >
                -
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button 
            className="w-full bg-pink-500 text-white py-3 rounded-lg font-medium hover:bg-pink-600 transition-colors"
            onClick={handleAddToCart}
            disabled={addingToCart}
          >
            {addingToCart ? 'در حال افزودن...' : 'افزودن به سبد خرید'}
          </Button>

          {/* Auth Notice */}
          {!user && (
            <p className="text-sm text-gray-600 text-center">
              برای افزودن به سبد خرید، ابتدا 
              <button 
                onClick={() => router.push('/auth/login')}
                className="text-pink-500 hover:text-pink-600 mx-1"
              >
                وارد شوید
              </button>
            </p>
          )}

          {/* Product Features */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-medium text-right">ویژگی‌های محصول</h3>
            <ul className="space-y-2 text-sm text-gray-600 text-right">
              <li>• مناسب برای انواع پوست</li>
              <li>• ماندگاری بالا</li>
              <li>• ضد آب</li>
              <li>• حاوی ویتامین E</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Product Description */}
      <div className="mt-12">
        <h2 className="text-xl mb-4 text-right font-lalezar">توضیحات محصول</h2>
        <div className="bg-gray-50 rounded-lg p-6">
          <p className="text-gray-700 leading-relaxed text-right whitespace-pre-wrap">
            {product.description}
          </p>
        </div>
      </div>

      {/* Related Products Section */}
      <div className="mt-12">
        <h2 className="text-xl mb-6 text-right font-lalezar">محصولات مشابه</h2>
        <div className="text-center py-8 text-gray-500">
          محصولات مشابه به زودی...
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailsPage() {
  return (
    <Suspense fallback={<div>Sayfa yükleniyor...</div>}>
      <ProductDetailsContent />
    </Suspense>
  );
}