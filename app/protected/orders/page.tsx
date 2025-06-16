import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAllSimpleOrders } from '@/lib/simple-orders';
import { SimpleOrdersClient } from '@/components/admin/simple-orders-client';

interface ProtectedOrdersPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
}

export default async function ProtectedOrdersPage({ searchParams }: ProtectedOrdersPageProps) {
  const supabase = await createClient();

  // Check authentication
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Check if user is admin/seller
  const userMetadata = data.user.user_metadata;
  const isSellerOrAdmin = userMetadata?.['user_type'] && (userMetadata['user_type'] === 'seller' || userMetadata['user_type'] === 'admin');
  if (!isSellerOrAdmin) {
    redirect("/");
  }

  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || '1');
  const limit = parseInt(resolvedSearchParams.limit || '20');

  try {
    const ordersData = await getAllSimpleOrders(page, limit);
    console.log(`Fetched ${ordersData.orders.length} orders for page ${page}`);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sipariş Yönetimi</h1>
            <p className="text-gray-600 dark:text-gray-400">Tüm siparişleri görüntüleyin ve yönetin</p>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Toplam: {ordersData.total} sipariş
          </div>
        </div>
        
        <SimpleOrdersClient 
          orders={ordersData.orders} 
          pagination={{
            page: ordersData.page,
            totalPages: ordersData.totalPages,
            total: ordersData.total
          }}
        />
      </div>
    );
  } catch (error) {
    console.error('Failed to load orders:', error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sipariş Yönetimi</h1>
          <p className="text-gray-600 dark:text-gray-400">Tüm siparişleri görüntüleyin ve yönetin</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">Siparişler yüklenirken hata oluştu</p>
          <p className="text-red-600 text-sm mt-2">Lütfen sayfayı yenileyin</p>
        </div>
      </div>
    );
  }
} 