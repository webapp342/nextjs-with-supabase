import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserSimpleOrders } from '@/lib/simple-orders';
import { SimpleOrdersPageClient } from '@/components/orders/simple-orders-page-client';

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  try {
    const orders = await getUserSimpleOrders(user.id);

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-right mb-8">سفارش‌های من</h1>
          <SimpleOrdersPageClient orders={orders} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to load orders:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-right mb-8">سفارش‌های من</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">خطا در بارگذاری سفارش‌ها</p>
            <p className="text-red-600 text-sm mt-2">
              Hata: {error instanceof Error ? error.message : 'Bilinmeyen hata'}
            </p>
            <p className="text-red-600 text-sm mt-2">لطفاً دوباره تلاش کنید</p>
          </div>
        </div>
      </div>
    );
  }
} 