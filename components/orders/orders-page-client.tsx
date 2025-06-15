'use client';

import { useState } from 'react';
import { Package, MapPin, CreditCard, Calendar, Eye, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toPersianNumber } from '@/lib/utils';
import type { Order } from '@/types/cart';

interface OrdersPageClientProps {
  orders: Order[];
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'pending':
      return { label: 'در انتظار تایید', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    case 'confirmed':
      return { label: 'تایید شده', color: 'bg-blue-100 text-blue-800', icon: CheckCircle };
    case 'processing':
      return { label: 'در حال آماده‌سازی', color: 'bg-purple-100 text-purple-800', icon: Package };
    case 'shipped':
      return { label: 'ارسال شده', color: 'bg-orange-100 text-orange-800', icon: Truck };
    case 'delivered':
      return { label: 'تحویل داده شده', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    case 'cancelled':
      return { label: 'لغو شده', color: 'bg-red-100 text-red-800', icon: XCircle };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-800', icon: Clock };
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function OrdersPageClient({ orders }: OrdersPageClientProps) {
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

        return (
          <div key={order.id} className="bg-white rounded-lg shadow-sm border">
            {/* Order Header */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <div className="text-right">
                  <h3 className="font-medium text-lg">سفارش #{order.order_number}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    <Calendar className="w-4 h-4 inline ml-1" />
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <Badge className={statusInfo.color}>
                  <StatusIcon className="w-4 h-4 ml-1" />
                  {statusInfo.label}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-right">
                  <p className="text-gray-600">مبلغ کل</p>
                  <p className="font-medium text-lg">
                    {toPersianNumber(order.total_amount.toLocaleString())} ؋
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-gray-600">تعداد اقلام</p>
                  <p className="font-medium">
                    {toPersianNumber(order.order_items?.length || 0)} قلم
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-gray-600">روش پرداخت</p>
                  <p className="font-medium flex items-center">
                    <CreditCard className="w-4 h-4 ml-1" />
                    {order.payment_method === 'credit_card' ? 'کارت اعتباری' : order.payment_method}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleOrderDetails(order.id)}
                className="mt-4"
              >
                <Eye className="w-4 h-4 ml-1" />
                {isExpanded ? 'بستن جزئیات' : 'مشاهده جزئیات'}
              </Button>
            </div>

            {/* Order Details */}
            {isExpanded && (
              <div className="p-6 bg-gray-50">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium mb-4 text-right">اقلام سفارش</h4>
                    <div className="space-y-3">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 bg-white rounded-lg p-3">
                          <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0">
                            {item.product?.image_urls?.[0] && (
                              <img
                                src={item.product.image_urls[0]}
                                alt={item.product.name}
                                className="w-full h-full object-cover rounded"
                              />
                            )}
                          </div>
                          <div className="flex-1 text-right">
                            <p className="font-medium">{item.product?.name}</p>
                            <p className="text-sm text-gray-600">
                              {toPersianNumber(item.quantity)} × {toPersianNumber(item.price.toLocaleString())} ؋
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="font-medium">
                              {toPersianNumber(item.total.toLocaleString())} ؋
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <h4 className="font-medium mb-4 text-right flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      آدرس تحویل
                    </h4>
                    {order.shipping_address && (
                      <div className="bg-white rounded-lg p-4 text-right">
                        <p className="font-medium">{order.shipping_address.full_name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {order.shipping_address.phone_number}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          {order.shipping_address.address_line_1}
                          {order.shipping_address.address_line_2 && 
                            `, ${order.shipping_address.address_line_2}`
                          }
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip_code}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.shipping_address.country}
                        </p>
                      </div>
                    )}

                    {/* Order Notes */}
                    {order.notes && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2 text-right">یادداشت</h4>
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-sm text-gray-600 text-right">{order.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Timeline */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-4 text-right">وضعیت سفارش</h4>
                  <div className="flex items-center justify-between bg-white rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((status, index) => {
                        const statusInfo = getStatusInfo(status);
                        const StatusIcon = statusInfo.icon;
                        const isActive = order.status === status;
                        const isPassed = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'].indexOf(order.status) >= index;
                        
                        return (
                          <div key={status} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isActive ? 'bg-pink-500 text-white' : 
                              isPassed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                              <StatusIcon className="w-4 h-4" />
                            </div>
                            {index < 4 && (
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
          </div>
        );
      })}
    </div>
  );
} 