
import { getAllOrders } from '@/lib/orders';
import { AdminOrdersClient } from '@/components/admin/admin-orders-client';

interface AdminOrdersPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || '1');
  const limit = parseInt(resolvedSearchParams.limit || '20');

  try {
    const ordersData = await getAllOrders(page, limit);

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Sipariş Yönetimi</h1>
            <div className="text-sm text-gray-600">
              Toplam: {ordersData.total} sipariş
            </div>
          </div>
          <AdminOrdersClient 
            orders={ordersData.orders} 
            pagination={{
              page: ordersData.page,
              totalPages: ordersData.totalPages,
              total: ordersData.total
            }}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to load admin orders:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-8">Sipariş Yönetimi</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">Siparişler yüklenirken hata oluştu</p>
            <p className="text-red-600 text-sm mt-2">Lütfen sayfayı yenileyin</p>
          </div>
        </div>
      </div>
    );
  }
} 