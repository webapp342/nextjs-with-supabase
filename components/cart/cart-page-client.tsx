'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cartClientActions } from '@/lib/cart-client';
import { toPersianNumber } from '@/lib/utils';
import { useCart } from '@/contexts/cart-context';
import type { CartWithItems } from '@/types/cart';

interface CartPageClientProps {
  initialCart: CartWithItems | null;
}

export function CartPageClient({ initialCart }: CartPageClientProps) {
  const router = useRouter();
  const [cart, setCart] = useState(initialCart);
  const [loading, setLoading] = useState<string | null>(null);
  const { refreshCart } = useCart();

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    setLoading(cartItemId);
    try {
      await cartClientActions.updateCartItem(cartItemId, newQuantity);
      
      // Refresh cart data
      const response = await cartClientActions.getCart();
      setCart(response.cart);
      
      // Refresh cart count in navbar
      await refreshCart();
    } catch (error) {
      console.error('Failed to update cart item:', error);
      alert('خطا در به‌روزرسانی سبد خرید');
    } finally {
      setLoading(null);
    }
  };

  const removeItem = async (cartItemId: string) => {
    setLoading(cartItemId);
    try {
      await cartClientActions.removeCartItem(cartItemId);
      
      // Refresh cart data
      const response = await cartClientActions.getCart();
      setCart(response.cart);
      
      // Refresh cart count in navbar
      await refreshCart();
    } catch (error) {
      console.error('Failed to remove cart item:', error);
      alert('خطا در حذف کالا از سبد خرید');
    } finally {
      setLoading(null);
    }
  };

  const proceedToCheckout = () => {
    router.push('/checkout/address');
  };

  if (!cart || cart.cart_items.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-medium text-gray-900 mb-2">سبد خرید شما خالی است</h2>
        <p className="text-gray-600 mb-6">برای شروع خرید، محصولات مورد نظر خود را به سبد اضافه کنید</p>
        <Button 
          onClick={() => router.push('/')}
          className="bg-pink-500 hover:bg-pink-600 text-white"
        >
          ادامه خرید
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart Items */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium text-right">کالاهای سبد خرید</h2>
          </div>
          
          <div className="divide-y">
            {cart.cart_items.map((item) => (
              <div key={item.id} className="p-6">
                <div className="flex items-center gap-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                      {item.product?.image_urls?.[0] ? (
                        <Image
                          src={item.product.image_urls[0]}
                          alt={item.product.name || 'Product'}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">تصویر</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 text-right">
                      {item.product?.name || 'نام محصول'}
                    </h3>
                    <p className="text-sm text-gray-600 text-right mt-1">
                      {item.product?.brand && `برند: ${item.product.brand}`}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={loading === item.id}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium min-w-[2rem] text-center">
                          {toPersianNumber(item.quantity)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                          disabled={loading === item.id || item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {toPersianNumber((item.price * item.quantity).toLocaleString())} ؋
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-xs text-gray-500">
                            {toPersianNumber(item.price.toLocaleString())} ؋ × {toPersianNumber(item.quantity)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <div className="flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeItem(item.id)}
                      disabled={loading === item.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm border sticky top-4">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium text-right">خلاصه سفارش</h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span>قیمت کالاها ({toPersianNumber(cart.total_items)})</span>
              <span>{toPersianNumber(cart.total_amount.toLocaleString())} ؋</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>هزینه ارسال</span>
              <span className="text-green-600">رایگان</span>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between font-medium">
                <span>مجموع</span>
                <span className="text-lg">{toPersianNumber(cart.total_amount.toLocaleString())} ؋</span>
              </div>
            </div>
            
            <Button 
              className="w-full bg-pink-500 hover:bg-pink-600 text-white mt-6"
              onClick={proceedToCheckout}
              disabled={cart.cart_items.length === 0}
            >
              ادامه فرآیند خرید
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push('/')}
            >
              ادامه خرید
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 