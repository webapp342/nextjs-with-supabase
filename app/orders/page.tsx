import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserSimpleOrders } from '@/lib/simple-orders';
import { SimpleOrdersPageClient } from '@/components/orders/simple-orders-page-client';
import { ChevronRight, Home, Package } from 'lucide-react';

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  try {
    const orders = await getUserSimpleOrders(user.id);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <nav className="mb-8" aria-label="Breadcrumb">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
              <a 
                href="/" 
                className="flex items-center text-gray-600 hover:text-pink-600 transition-colors duration-200"
              >
                <Home className="w-4 h-4 ml-1" />
                خانه
              </a>
              <ChevronRight className="w-4 h-4 text-gray-400 rotate-180" />
              <span className="flex items-center text-pink-600 font-medium">
                <Package className="w-4 h-4 ml-1" />
                سفارش‌های من
              </span>
            </div>
          </nav>

          {/* Orders Content */}
          <SimpleOrdersPageClient orders={orders} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to load orders:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <nav className="mb-8" aria-label="Breadcrumb">
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
              <a 
                href="/" 
                className="flex items-center text-gray-600 hover:text-pink-600 transition-colors duration-200"
              >
                <Home className="w-4 h-4 ml-1" />
                خانه
              </a>
              <ChevronRight className="w-4 h-4 text-gray-400 rotate-180" />
              <span className="flex items-center text-pink-600 font-medium">
                <Package className="w-4 h-4 ml-1" />
                سفارش‌های من
              </span>
            </div>
          </nav>

          {/* Error State */}
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">خطا در بارگذاری سفارش‌ها</h1>
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
              <p className="text-red-800 mb-2">متأسفانه در بارگذاری سفارش‌های شما مشکلی پیش آمد</p>
              <p className="text-red-600 text-sm">
                خطا: {error instanceof Error ? error.message : 'خطای نامشخص'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.reload()} 
                className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                تلاش مجدد
              </button>
              <a 
                href="/" 
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-xl font-medium transition-colors"
              >
                بازگشت به خانه
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
} 