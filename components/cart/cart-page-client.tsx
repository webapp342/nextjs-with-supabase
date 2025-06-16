'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag, AlertTriangle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cartClientActions } from '@/lib/cart-client';
import { toPersianNumber } from '@/lib/utils';
import { useCart } from '@/contexts/cart-context';
import type { CartWithItems } from '@/types/cart';
import { Input } from '@/components/ui/input';

interface CartPageClientProps {
  initialCart: CartWithItems | null;
}

export function CartPageClient({ initialCart }: CartPageClientProps) {
  const router = useRouter();
  const [cart, setCart] = useState(initialCart);
  const [loading, setLoading] = useState<string | null>(null);
  const { refreshCart } = useCart();
  const [couponCode, setCouponCode] = useState('');

  // --- UI helpers ----------------------------------------------------
  // Free shipping threshold (in Tomans)
  const FREE_SHIPPING_THRESHOLD = 2_000_000;
  const remainingForFreeShipping = cart ? Math.max(0, FREE_SHIPPING_THRESHOLD - cart.total_amount) : 0;
  const freeShippingProgress = cart ? Math.min(1, cart.total_amount / FREE_SHIPPING_THRESHOLD) : 0;

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

  const applyCoupon = () => {
    // TODO: integrate real coupon logic
    alert('در نسخه نمایشی، اعمال کد تخفیف پشتیبانی نمی‌شود');
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
    <div dir="rtl" className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/*  Reservation notice                                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-lg p-4 flex items-start gap-2 text-sm">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>
          کالا پس از پرداخت برای شما رزرو خواهد شد. افزودن کالا به سبد به معنای رزرو قیمت یا تعداد نیست.
        </span>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  Free shipping progress                                            */}
      {/* ------------------------------------------------------------------ */}
      {cart && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-pink-600 text-right">
            {remainingForFreeShipping > 0
              ? `${toPersianNumber(remainingForFreeShipping.toLocaleString())} تومان مانده تا ارسال رایگان!`
              : '🎉 ارسال شما رایگان شد!'}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-pink-500 h-full transition-all"
              style={{ width: `${freeShippingProgress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Back to shop link */}
      <Button
        variant="link"
        className="text-pink-500 hover:text-pink-600 p-0 h-auto text-sm flex items-center gap-1 w-max"
        onClick={() => router.push('/')}
      >
        <ChevronRight className="w-4 h-4" />
        بازگشت به فروشگاه
      </Button>

      {/* ------------------------------------------------------------------ */}
      {/*  Main grid (items + summary)                                       */}
      {/* ------------------------------------------------------------------ */}
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
                            {toPersianNumber((item.price * item.quantity).toLocaleString())} تومان
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-xs text-gray-500">
                              {toPersianNumber(item.price.toLocaleString())} تومان × {toPersianNumber(item.quantity)}
                            </div>
                          )}

                          {/* Discount & Compare Price */}
                          {item.product?.compare_price && item.product.compare_price > item.price && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="bg-red-500 text-white rounded-md text-[10px] px-1.5 py-0.5">
                                ٪{toPersianNumber(
                                  Math.round(
                                    ((item.product.compare_price - item.price) / item.product.compare_price) * 100,
                                  ).toString(),
                                )}
                              </span>
                              <span className="text-xs text-gray-500 line-through">
                                {toPersianNumber(item.product.compare_price.toLocaleString())} تومان
                              </span>
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

            {/* Coupon Code */}
            <div className="p-6 border-t flex flex-col sm:flex-row gap-4">
              <Input
                dir="ltr"
                placeholder="کد تخفیف را اینجا وارد کنید"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 text-right"
              />
              <Button
                onClick={applyCoupon}
                className="bg-pink-500 hover:bg-pink-600 text-white whitespace-nowrap"
                disabled={!couponCode.trim()}
              >
                بررسی کد
              </Button>
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
                <span>{toPersianNumber(cart.total_amount.toLocaleString())} تومان</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>هزینه ارسال</span>
                <span className="text-green-600">رایگان</span>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between font-medium">
                  <span>مجموع</span>
                  <span className="text-lg">{toPersianNumber(cart.total_amount.toLocaleString())} تومان</span>
                </div>
              </div>
              
              <Button 
                className="w-full bg-pink-500 hover:bg-pink-600 text-white mt-6"
                onClick={proceedToCheckout}
                disabled={cart.cart_items.length === 0}
              >
                ادامه فرآیند خرید
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  Mobile sticky summary bar                                        */}
      {/* ------------------------------------------------------------------ */}
      {cart && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t shadow md:hidden">
          <div className="flex items-center justify-between p-4">
            <div className="text-right">
              <p className="text-xs text-gray-600">جمع سبد خرید</p>
              <p className="font-medium text-lg">{toPersianNumber(cart.total_amount.toLocaleString())} تومان</p>
            </div>
            <Button
              className="bg-pink-500 hover:bg-pink-600 text-white py-3 px-6 rounded-lg"
              onClick={proceedToCheckout}
              disabled={cart.cart_items.length === 0}
            >
              ثبت سفارش
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 