'use client';

import { useState } from 'react';
import { Package, Calendar, MapPin, Eye, EyeOff, Truck, CheckCircle, Clock, XCircle, Star, ArrowRight, Download, Phone, CreditCard } from 'lucide-react';
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
  created_at: string;
  updated_at?: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  subtotal: number;
  shipping_cost: number;
  total_amount: number;
  shipping_address: {
    full_name: string;
    phone_number: string;
    address_line_1: string;
    city: string;
    state?: string;
    postal_code?: string;
  };
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
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: Clock,
        bgColor: 'bg-yellow-50',
        dotColor: 'bg-yellow-400'
      };
    case 'confirmed':
      return { 
        label: 'تایید شده', 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        icon: CheckCircle,
        bgColor: 'bg-blue-50',
        dotColor: 'bg-blue-500'
      };
    case 'shipped':
      return { 
        label: 'ارسال شده', 
        color: 'bg-purple-100 text-purple-800 border-purple-200', 
        icon: Truck,
        bgColor: 'bg-purple-50',
        dotColor: 'bg-purple-500'
      };
    case 'delivered':
      return { 
        label: 'تحویل داده شده', 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle,
        bgColor: 'bg-green-50',
        dotColor: 'bg-green-500'
      };
    case 'cancelled':
      return { 
        label: 'لغو شده', 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: XCircle,
        bgColor: 'bg-red-50',
        dotColor: 'bg-red-500'
      };
    default:
      return { 
        label: status, 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        icon: Clock,
        bgColor: 'bg-gray-50',
        dotColor: 'bg-gray-400'
      };
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export function SimpleOrdersPageClient({ orders }: SimpleOrdersPageClientProps) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (orders.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center py-16 px-4">
        <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
          <Package className="w-12 h-12 text-pink-500" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">هیچ سفارشی یافت نشد</h3>
        <p className="text-gray-600 mb-8 max-w-md leading-relaxed">
          شما هنوز هیچ سفارشی ثبت نکرده‌اید. برای شروع خرید و ثبت اولین سفارش خود کلیک کنید.
        </p>
        <Button 
          onClick={() => window.location.href = '/'}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 text-lg rounded-xl"
        >
          شروع خرید
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">سفارش‌های من</h1>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {toPersianNumber(orders.length)} سفارش
          </Badge>
        </div>
        <p className="text-gray-600">مدیریت و پیگیری سفارش‌های خود</p>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {orders.map((order) => {
          const statusInfo = getStatusInfo(order.status);
          const StatusIcon = statusInfo.icon;
          const isExpanded = expandedOrder === order.id;
          const totalItems = order.simple_order_items.reduce((sum, item) => sum + item.quantity, 0);

          return (
            <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-l-pink-400">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 pb-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Order Header Info */}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${statusInfo.bgColor} rounded-xl flex items-center justify-center`}>
                      <StatusIcon className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl text-gray-900">
                          سفارش #{order.order_number}
                        </CardTitle>
                        <Badge className={`${statusInfo.color} border text-sm font-medium`}>
                          <div className={`w-2 h-2 rounded-full ${statusInfo.dotColor} ml-2`} />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(order.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {toPersianNumber(totalItems)} کالا
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-pink-600">
                        {toPersianNumber(order.total_amount.toLocaleString())} ؋
                      </div>
                      {order.shipping_cost > 0 && (
                        <div className="text-sm text-gray-500">
                          شامل {toPersianNumber(order.shipping_cost.toLocaleString())} ؋ ارسال
                        </div>
                      )}
                    </div>
                    <Button
                      variant={isExpanded ? "default" : "outline"}
                      onClick={() => toggleOrderDetails(order.id)}
                      className="flex items-center gap-2"
                    >
                      {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {isExpanded ? 'بستن جزئیات' : 'مشاهده جزئیات'}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {/* Quick Order Info */}
                <div className="p-6 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Payment Status */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">وضعیت پرداخت</div>
                        <div className={`font-medium ${
                          order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {order.payment_status === 'paid' ? 'پرداخت شده' : 'در انتظار پرداخت'}
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">آدرس تحویل</div>
                        <div className="font-medium text-gray-900">{order.shipping_address.city}</div>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">تماس</div>
                        <div className="font-medium text-gray-900">{order.shipping_address.full_name}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="bg-gray-50 border-t">
                    <div className="p-6">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Order Items */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            اقلام سفارش
                          </h4>
                          <div className="space-y-4">
                            {order.simple_order_items?.map((item) => (
                              <div key={item.id} className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm">
                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                  {item.product_image_url ? (
                                    <img
                                      src={item.product_image_url}
                                      alt={item.product_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 text-right">
                                  <h5 className="font-medium text-gray-900 mb-1">{item.product_name}</h5>
                                  <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-600">
                                      {toPersianNumber(item.quantity)} × {toPersianNumber(item.unit_price.toLocaleString())} ؋
                                    </div>
                                    <div className="font-semibold text-pink-600">
                                      {toPersianNumber(item.total_price.toLocaleString())} ؋
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Details & Status */}
                        <div className="space-y-6">
                          {/* Shipping Address */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <MapPin className="w-5 h-5" />
                              آدرس ارسال
                            </h4>
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                              <div className="space-y-2 text-sm">
                                <div className="font-medium text-gray-900">{order.shipping_address.full_name}</div>
                                <div className="text-gray-600">{order.shipping_address.phone_number}</div>
                                <div className="text-gray-600">{order.shipping_address.address_line_1}</div>
                                <div className="text-gray-600">
                                  {order.shipping_address.city}
                                  {order.shipping_address.state && `, ${order.shipping_address.state}`}
                                  {order.shipping_address.postal_code && ` - ${order.shipping_address.postal_code}`}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Order Status Timeline */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <Truck className="w-5 h-5" />
                              وضعیت سفارش
                            </h4>
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                              <div className="space-y-4">
                                {['pending', 'confirmed', 'shipped', 'delivered'].map((status, index) => {
                                  const stepStatusInfo = getStatusInfo(status);
                                  const StepIcon = stepStatusInfo.icon;
                                  const isActive = order.status === status;
                                  const isPassed = ['pending', 'confirmed', 'shipped', 'delivered'].indexOf(order.status) >= index;
                                  
                                  return (
                                    <div key={status} className="flex items-center gap-4">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        isActive ? 'bg-pink-500 text-white' : 
                                        isPassed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                                      }`}>
                                        <StepIcon className="w-5 h-5" />
                                      </div>
                                      <div className="flex-1">
                                        <div className={`font-medium ${isActive ? 'text-pink-600' : isPassed ? 'text-green-600' : 'text-gray-500'}`}>
                                          {stepStatusInfo.label}
                                        </div>
                                        {isActive && (
                                          <div className="text-sm text-gray-500">
                                            آخرین بروزرسانی: {formatDate(order.updated_at || order.created_at)}
                                          </div>
                                        )}
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
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button variant="outline" className="flex items-center gap-2">
                              <Download className="w-4 h-4" />
                              دانلود فاکتور
                            </Button>
                            {order.status === 'delivered' && (
                              <Button variant="outline" className="flex items-center gap-2">
                                <Star className="w-4 h-4" />
                                نظردهی و امتیاز
                              </Button>
                            )}
                            {(order.status === 'pending' || order.status === 'confirmed') && (
                              <Button variant="outline" className="text-red-600 hover:bg-red-50">
                                لغو سفارش
                              </Button>
                            )}
                          </div>
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

      {/* Load More Button (if needed) */}
      {orders.length > 0 && (
        <div className="mt-12 text-center">
          <Button variant="outline" className="px-8 py-3 text-lg">
            <ArrowRight className="w-5 h-5 ml-2" />
            مشاهده سفارش‌های قدیمی‌تر
          </Button>
        </div>
      )}
    </div>
  );
} 