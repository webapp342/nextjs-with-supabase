import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCartWithItems } from '@/lib/cart';
import { CartPageClient } from '@/components/cart/cart-page-client';

export default async function CartPage() {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login?redirect=/cart');
  }

  // Get cart with items
  const cart = await getCartWithItems(user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
            <a href="/" className="text-gray-600 hover:text-gray-900">خانه</a>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">سبد خرید</span>
          </div>
        </nav>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-right font-lalezar">سبد خرید</h1>
          <p className="text-gray-600 text-right mt-2">
            {cart?.total_items ? `${cart.total_items} کالا در سبد خرید شما` : 'سبد خرید شما خالی است'}
          </p>
        </div>

        <CartPageClient initialCart={cart} />
      </div>
    </div>
  );
} 