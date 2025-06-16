'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, MapPin, Calendar, ChevronLeft, ChevronRight, Clock, CheckCircle, Truck, Home, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toPersianNumber } from '@/lib/utils';

interface SimpleOrderWithItems {
  id: string;
  order_number: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  total_amount: number;
  shipping_address: {
    full_name: string;
    phone_number: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state?: string;
    zip_code: string;
    country: string;
  };
  payment_method?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  customer_notes?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  simple_order_items: Array<{
    quantity: number;
    product_name: string;
  }>;
}

interface SimpleOrdersClientProps {
  orders: SimpleOrderWithItems[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'pending':
      return { 
        label: 'در انتظار تایید', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock
      };
    case 'confirmed':
      return { 
        label: 'تایید شده', 
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: CheckCircle
      };
    case 'shipped':
      return { 
        label: 'ارسال شده', 
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: Truck
      };
    case 'delivered':
      return { 
        label: 'تحویل داده شده', 
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: Home
      };
    case 'cancelled':
      return { 
        label: 'لغو شده', 
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle
      };
    default:
      return { 
        label: status, 
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Package
      };
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

export function SimpleOrdersClient({ orders, pagination }: SimpleOrdersClientProps) {
  const router = useRouter();
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const response = await fetch(`/api/protected/simple-orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          admin_notes: `Durum admin tarafından ${getStatusInfo(newStatus).label} olarak güncellendi - ${new Date().toLocaleString('fa-IR')}`
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
    router.push(`/protected/orders?page=${page}`);
  };

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ سفارشی یافت نشد</h3>
          <p className="text-gray-600">هنوز هیچ سفارشی دریافت نشده است</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => {
          const statusInfo = getStatusInfo(order.status);
          const StatusIcon = statusInfo.icon;
          const totalItems = order.simple_order_items.reduce((sum, item) => sum + item.quantity, 0);

          return (
            <Card key={order.id} className="hover:shadow-lg transition-all duration-200 border-r-4 border-r-pink-500">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">سفارش #{order.order_number}</CardTitle>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${statusInfo.color} flex items-center gap-1 px-3 py-1`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusInfo.label}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Customer Info */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 mb-3">اطلاعات مشتری</h4>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{order.shipping_address.full_name}</p>
                      <p className="text-gray-600">{order.shipping_address.phone_number}</p>
                      <p className="text-gray-600 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {order.shipping_address.city}
                      </p>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 mb-3">جزئیات سفارش</h4>
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center gap-1">
                        <Package className="w-4 h-4 text-gray-500" />
                        {toPersianNumber(totalItems.toString())} قلم
                      </p>
                      <p className="text-gray-600">
                        مبلغ کل: <span className="font-medium text-pink-600">
                          {toPersianNumber(order.subtotal.toLocaleString())} ؋
                        </span>
                      </p>
                      {order.shipping_cost > 0 && (
                        <p className="text-gray-600">
                          هزینه ارسال: {toPersianNumber(order.shipping_cost.toLocaleString())} ؋
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 mb-3">اطلاعات پرداخت</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-2xl font-bold text-pink-600">
                        {toPersianNumber(order.total_amount.toLocaleString())} ؋
                      </p>
                      <p className="text-gray-600">
                        روش پرداخت: {order.payment_method || 'کارت اعتباری'}
                      </p>
                      <Badge className={order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {order.payment_status === 'paid' ? 'پرداخت شده' : 'در انتظار پرداخت'}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">عملیات</h4>
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
                          <SelectItem value="shipped">ارسال شده</SelectItem>
                          <SelectItem value="delivered">تحویل داده شده</SelectItem>
                          <SelectItem value="cancelled">لغو شده</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {(order.customer_notes || order.admin_notes) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {order.customer_notes && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-700">یادداشت مشتری:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{order.customer_notes}</p>
                      </div>
                    )}
                    {order.admin_notes && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">یادداشت ادمین:</p>
                        <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">{order.admin_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
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