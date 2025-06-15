import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCartWithItems } from '@/lib/cart';
import { AddressFormClient } from '@/components/checkout/address-form-client';

export default async function CheckoutAddressPage() {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login?redirect=/checkout/address');
  }

  // Check if cart has items
  const cart = await getCartWithItems(user.id);
  if (!cart || cart.cart_items.length === 0) {
    redirect('/cart');
  }

  // Get user's existing addresses
  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
            <a href="/" className="text-gray-600 hover:text-gray-900">خانه</a>
            <span className="text-gray-400">/</span>
            <a href="/cart" className="text-gray-600 hover:text-gray-900">سبد خرید</a>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">آدرس تحویل</span>
          </div>
        </nav>

        {/* Checkout Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 rtl:space-x-reverse">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">
                ✓
              </div>
              <span className="ml-2 text-sm text-gray-600">سبد خرید</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm">
                2
              </div>
              <span className="ml-2 text-sm font-medium">آدرس تحویل</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm">
                3
              </div>
              <span className="ml-2 text-sm text-gray-600">پرداخت</span>
            </div>
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-right font-lalezar">آدرس تحویل سفارش</h1>
          <p className="text-gray-600 text-right mt-2">
            آدرس محل تحویل سفارش خود را انتخاب یا وارد کنید
          </p>
        </div>

        <AddressFormClient 
          initialAddresses={addresses || []} 
          cart={cart}
        />
      </div>
    </div>
  );
} 