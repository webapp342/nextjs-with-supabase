'use client';

import { useState } from 'react';
import { Package, Calendar, MapPin, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toPersianNumber } from '@/lib/utils';

interface SimpleOrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image_url?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

interface SimpleOrder {
  id: string;
  order_number: string;
  status: string;
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
  payment_status: string;
  customer_notes?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  simple_order_items: SimpleOrderItem[];
}

interface SimpleOrdersPageClientProps {
  orders: SimpleOrder[];
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'pending':
      return { 
        label: 'در انتظار تایید', 
        color: 'bg-yellow-100 text-yellow-800',
        icon: Package
      };
    case 'confirmed':
      return { 
        label: 'تایید شده', 
        color: 'bg-blue-100 text-blue-800',
        icon: Package
      };
    case 'shipped':
      return { 
        label: 'ارسال شده', 
        color: 'bg-purple-100 text-purple-800',
        icon: Package
      };
    case 'delivered':
      return { 
        label: 'تحویل داده شده', 
        color: 'bg-green-100 text-green-800',
        icon: Package
      };
    case 'cancelled':
      return { 
        label: 'لغو شده', 
        color: 'bg-red-100 text-red-800',
        icon: Package
      };
    default:
      return { 
        label: status, 
        color: 'bg-gray-100 text-gray-800',
        icon: Package
      };
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function SimpleOrdersPageClient({ orders }: SimpleOrdersPageClientProps) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ سفارشی یافت نشد</h3>
        <p className="text-gray-600 mb-6">شما هنوز هیچ سفارشی ثبت نکرده‌اید</p>
        <Button 
          onClick={() => window.location.href = '/'}
          className="bg-pink-500 hover:bg-pink-600 text-white"
        >
          شروع خرید
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => {
        const statusInfo = getStatusInfo(order.status);
        const StatusIcon = statusInfo.icon;
        const isExpanded = expandedOrder === order.id;
        const totalItems = order.simple_order_items.reduce((sum, item) => sum + item.quantity, 0);

        return (
          <Card key={order.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-right">سفارش #{order.order_number}</CardTitle>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Order Summary */}
                <div className="text-right">
                  <h4 className="font-medium mb-2">خلاصه سفارش</h4>
                  <p className="text-sm text-gray-600 mb-1">
                    <Package className="w-4 h-4 inline ml-1" />
                    {toPersianNumber(totalItems.toString())} قلم
                  </p>
                  <p className="text-lg font-bold text-pink-600">
                    {toPersianNumber(order.total_amount.toLocaleString())} ؋
                  </p>
                  {order.shipping_cost > 0 && (
                    <p className="text-sm text-gray-600">
                      هزینه ارسال: {toPersianNumber(order.shipping_cost.toLocaleString())} ؋
                    </p>
                  )}
                </div>

                {/* Payment Status */}
                <div className="text-right">
                  <h4 className="font-medium mb-2">وضعیت پرداخت</h4>
                  <Badge className={order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {order.payment_status === 'paid' ? 'پرداخت شده' : 'در انتظار پرداخت'}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">
                    {order.payment_method || 'کارت اعتباری'}
                  </p>
                </div>

                {/* Actions */}
                <div className="text-right">
                  <h4 className="font-medium mb-2">عملیات</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleOrderDetails(order.id)}
                    className="w-full"
                  >
                    {isExpanded ? (
                      <>
                        <EyeOff className="w-4 h-4 ml-1" />
                        مخفی کردن جزئیات
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 ml-1" />
                        مشاهده جزئیات
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t pt-6 mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Order Items */}
                    <div>
                      <h4 className="font-medium mb-4 text-right">اقلام سفارش</h4>
                      <div className="space-y-3">
                        {order.simple_order_items?.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                            <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0">
                              {item.product_image_url ? (
                                <img
                                  src={item.product_image_url}
                                  alt={item.product_name}
                                  className="w-full h-full object-cover rounded"
                                />
                              ) : (
                                <Package className="w-6 h-6 text-gray-400 m-3" />
                              )}
                            </div>
                            <div className="flex-1 text-right">
                              <p className="font-medium">{item.product_name}</p>
                              <p className="text-sm text-gray-600">
                                {toPersianNumber(item.quantity)} × {toPersianNumber(item.unit_price.toLocaleString())} ؋
                              </p>
                            </div>
                            <div className="text-left">
                              <p className="font-medium">
                                {toPersianNumber(item.total_price.toLocaleString())} ؋
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div>
                      <h4 className="font-medium mb-4 text-right">آدرس تحویل</h4>
                      <div className="bg-gray-50 rounded-lg p-4 text-right">
                        <p className="font-medium mb-2">{order.shipping_address.full_name}</p>
                        <p className="text-sm text-gray-600 mb-1">{order.shipping_address.phone_number}</p>
                        <p className="text-sm text-gray-600 mb-1">
                          <MapPin className="w-4 h-4 inline ml-1" />
                          {order.shipping_address.address_line_1}
                          {order.shipping_address.address_line_2 && `, ${order.shipping_address.address_line_2}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.shipping_address.city}, {order.shipping_address.zip_code}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {(order.customer_notes || order.admin_notes) && (
                    <div className="mt-6 pt-6 border-t">
                      {order.customer_notes && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2 text-right">یادداشت شما</h4>
                          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded text-right">
                            {order.customer_notes}
                          </p>
                        </div>
                      )}
                      {order.admin_notes && (
                        <div>
                          <h4 className="font-medium mb-2 text-right">یادداشت فروشنده</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded text-right">
                            {order.admin_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Order Status Timeline */}
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-4 text-right">وضعیت سفارش</h4>
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-4">
                        {['pending', 'confirmed', 'shipped', 'delivered'].map((status, index) => {
                          const statusInfo = getStatusInfo(status);
                          const StatusIcon = statusInfo.icon;
                          const isActive = order.status === status;
                          const isPassed = ['pending', 'confirmed', 'shipped', 'delivered'].indexOf(order.status) >= index;
                          
                          return (
                            <div key={status} className="flex items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isActive ? 'bg-pink-500 text-white' : 
                                isPassed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                              }`}>
                                <StatusIcon className="w-4 h-4" />
                              </div>
                              {index < 3 && (
                                <div className={`w-8 h-0.5 ${
                                  isPassed && !isActive ? 'bg-green-500' : 'bg-gray-200'
                                }`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{statusInfo.label}</p>
                        <p className="text-xs text-gray-600">
                          آخرین بروزرسانی: {formatDate(order.updated_at || order.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 