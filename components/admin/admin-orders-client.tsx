'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, MapPin, Calendar, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toPersianNumber } from '@/lib/utils';

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  shipping_address?: {
    full_name: string;
    phone_number: string;
    city: string;
  };
  order_items: Array<{
    quantity: number;
    product: {
      name: string;
    };
  }>;
}

interface AdminOrdersClientProps {
  orders: Order[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'pending':
      return { label: 'در انتظار تایید', color: 'bg-yellow-100 text-yellow-800' };
    case 'confirmed':
      return { label: 'تایید شده', color: 'bg-blue-100 text-blue-800' };
    case 'processing':
      return { label: 'در حال آماده‌سازی', color: 'bg-purple-100 text-purple-800' };
    case 'shipped':
      return { label: 'ارسال شده', color: 'bg-orange-100 text-orange-800' };
    case 'delivered':
      return { label: 'تحویل داده شده', color: 'bg-green-100 text-green-800' };
    case 'cancelled':
      return { label: 'لغو شده', color: 'bg-red-100 text-red-800' };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-800' };
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function AdminOrdersClient({ orders, pagination }: AdminOrdersClientProps) {
  const router = useRouter();
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          notes: `Durum admin tarafından ${getStatusInfo(newStatus).label} olarak güncellendi`
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Durum güncellenirken hata oluştu');
      }

      router.refresh();
    } catch (error) {
      console.error('Update status error:', error);
      alert(error instanceof Error ? error.message : 'Durum güncellenirken hata oluştu');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const goToPage = (page: number) => {
    router.push(`/admin/orders?page=${page}`);
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ سفارشی یافت نشد</h3>
        <p className="text-gray-600">هنوز هیچ سفارشی دریافت نشده است</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {orders.map((order) => {
          const statusInfo = getStatusInfo(order.status);
          const totalItems = order.order_items.reduce((sum, item) => sum + item.quantity, 0);

          return (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="text-right">
                    <h3 className="font-medium text-lg mb-2">
                      سفارش #{order.order_number}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      <Calendar className="w-4 h-4 inline ml-1" />
                      {formatDate(order.created_at)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <Package className="w-4 h-4 inline ml-1" />
                      {toPersianNumber(totalItems.toString())} قلم
                    </p>
                  </div>

                  <div className="text-right">
                    <h4 className="font-medium mb-2">اطلاعات مشتری</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      {order.shipping_address?.full_name || 'نام نامشخص'}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {order.shipping_address?.phone_number || 'تلفن نامشخص'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <MapPin className="w-4 h-4 inline ml-1" />
                      {order.shipping_address?.city || 'شهر نامشخص'}
                    </p>
                  </div>

                  <div className="text-right">
                    <h4 className="font-medium mb-2">مبلغ سفارش</h4>
                    <p className="text-2xl font-bold text-pink-600">
                      {toPersianNumber(order.total_amount.toLocaleString())} ؋
                    </p>
                  </div>

                  <div className="text-right space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">وضعیت سفارش</h4>
                      <Badge className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                        disabled={updatingStatus === order.id}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">در انتظار تایید</SelectItem>
                          <SelectItem value="confirmed">تایید شده</SelectItem>
                          <SelectItem value="processing">در حال آماده‌سازی</SelectItem>
                          <SelectItem value="shipped">ارسال شده</SelectItem>
                          <SelectItem value="delivered">تحویل داده شده</SelectItem>
                          <SelectItem value="cancelled">لغو شده</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                      >
                        <Eye className="w-4 h-4 ml-1" />
                        مشاهده جزئیات
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                صفحه {toPersianNumber(pagination.page.toString())} از {toPersianNumber(pagination.totalPages.toString())}
                ({toPersianNumber(pagination.total.toString())} سفارش)
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronRight className="w-4 h-4" />
                  قبلی
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, pagination.page - 2) + i;
                    if (pageNum > pagination.totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {toPersianNumber(pageNum.toString())}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  بعدی
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 