'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Lock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { toPersianNumber } from '@/lib/utils';
import type { CartWithItems, Address } from '@/types/cart';

interface PaymentFormClientProps {
  cart: CartWithItems;
}

export function PaymentFormClient({ cart }: PaymentFormClientProps) {
  const router = useRouter();
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    // Get selected address from session storage
    const selectedAddressId = sessionStorage.getItem('selectedAddressId');
    if (!selectedAddressId) {
      router.push('/checkout/address');
      return;
    }

    // Fetch address details
    const fetchAddress = async () => {
      try {
        const response = await fetch('/api/addresses');
        if (response.ok) {
          const { addresses } = await response.json();
          const address = addresses.find((addr: Address) => addr.id === selectedAddressId);
          if (address) {
            setSelectedAddress(address);
          } else {
            router.push('/checkout/address');
          }
        }
      } catch (error) {
        console.error('Failed to fetch address:', error);
        router.push('/checkout/address');
      }
    };

    fetchAddress();
  }, [router]);

  const completeOrder = async () => {
    if (!selectedAddress) {
      alert('آدرس تحویل یافت نشد');
      return;
    }

    setLoading(true);
    try {
      // Prepare items for Hesab API
      const items = cart.cart_items.map(item => ({
        name: item.product?.name || 'محصول',
        price: item.price,
        quantity: item.quantity,
        product_id: item.product?.id
      }));

      // Get user email from auth
      const { data: { user } } = await fetch('/api/auth/user').then(res => res.json()).catch(() => ({ data: { user: null } }));
      
      const paymentData = {
        items,
        shipping_info: {
          full_name: selectedAddress.full_name,
          phone_number: selectedAddress.phone_number,
          address: `${selectedAddress.address_line_1}${selectedAddress.address_line_2 ? ', ' + selectedAddress.address_line_2 : ''}`,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zip_code: selectedAddress.zip_code
        },
        customer_email: user?.email || 'customer@example.com',
        total_amount: cart.total_amount
      };

      console.log('Creating Hesab payment with data:', paymentData);

      // Create Hesab payment
      const response = await fetch('/api/payment/hesab/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();
      console.log('Payment creation result:', result);

      if (!response.ok) {
        throw new Error(result.error || 'ایجاد پرداخت ناموفق بود');
      }

      if (result.success && result.payment_url) {
        // Store temp order ID for later reference
        if (result.temp_order_id) {
          sessionStorage.setItem('hesab_temp_order_id', result.temp_order_id);
        }

        // Clear address selection
        sessionStorage.removeItem('selectedAddressId');

        // Add event listener for payment success before redirecting
        const handlePaymentSuccess = (event: MessageEvent) => {
          console.log('Payment success event received:', event);
          
          // Check if event is from Hesab.com
          if (event.origin !== 'https://api.hesab.com' && event.origin !== 'https://hesab.com') {
            console.log('Ignoring event from unknown origin:', event.origin);
            return;
          }

          if (event.data && event.data.type === 'paymentSuccess') {
            console.log('Payment successful, processing...', event.data);
            
            // Remove event listener
            window.removeEventListener('message', handlePaymentSuccess);
            
            // Redirect to success page
            const tempOrderId = sessionStorage.getItem('hesab_temp_order_id');
            const successUrl = `/payment/success?temp_order_id=${tempOrderId}&transaction_id=${event.data.data?.transaction_id || ''}`;
            
            console.log('Redirecting to success page:', successUrl);
            window.location.href = successUrl;
          }
        };

        // Listen for payment success events
        window.addEventListener('message', handlePaymentSuccess);
        
        console.log('Redirecting to Hesab payment page:', result.payment_url);
        
        // Redirect to Hesab payment page
        window.location.href = result.payment_url;
      } else {
        throw new Error(result.error || 'Payment URL not received');
      }

    } catch (error) {
      console.error('Failed to create payment:', error);
      alert(error instanceof Error ? error.message : 'خطا در ایجاد پرداخت');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedAddress) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Payment Form */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium text-right flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              اطلاعات پرداخت
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Payment Gateway Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800">
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">پرداخت امن از طریق Hesab.com</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                پس از تأیید سفارش، به درگاه پرداخت امن Hesab.com منتقل خواهید شد
              </p>
            </div>

            {/* Payment Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">روش‌های پرداخت پشتیبانی شده:</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span>کارت‌های بانکی (ویزا، مسترکارت)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span>کیف پول دیجیتال</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span>انتقال بانکی</span>
                </div>
              </div>
            </div>

            {/* Delivery Address Summary */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-right mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                آدرس تحویل
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 text-right">
                <p className="font-medium">{selectedAddress.full_name}</p>
                <p className="text-sm text-gray-600 mt-1">{selectedAddress.phone_number}</p>
                <p className="text-sm text-gray-600">
                  {selectedAddress.address_line_1}
                  {selectedAddress.address_line_2 && `, ${selectedAddress.address_line_2}`}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zip_code}
                </p>
                <Button
                  variant="link"
                  className="text-pink-500 hover:text-pink-600 p-0 h-auto text-sm mt-2"
                  onClick={() => router.push('/checkout/address')}
                >
                  تغییر آدرس
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm border sticky top-4">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium text-right">خلاصه سفارش</h2>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Cart Items Summary */}
            <div className="space-y-3">
              {cart.cart_items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0"></div>
                  <div className="flex-1 text-right">
                    <p className="font-medium truncate">{item.product?.name}</p>
                    <p className="text-gray-600">
                      {toPersianNumber(item.quantity)} × {toPersianNumber(item.price.toLocaleString())} ؋
                    </p>
                  </div>
                </div>
              ))}
              {cart.cart_items.length > 3 && (
                <p className="text-sm text-gray-600 text-center">
                  و {toPersianNumber(cart.cart_items.length - 3)} کالای دیگر
                </p>
              )}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>قیمت کالاها ({toPersianNumber(cart.total_items)})</span>
                <span>{toPersianNumber(cart.total_amount.toLocaleString())} ؋</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>هزینه ارسال</span>
                <span className="text-green-600">رایگان</span>
              </div>
              
              <div className="border-t pt-2">
                <div className="flex justify-between font-medium">
                  <span>مجموع</span>
                  <span className="text-lg">{toPersianNumber(cart.total_amount.toLocaleString())} ؋</span>
                </div>
              </div>
            </div>
            
            <Button 
              className="w-full bg-pink-500 hover:bg-pink-600 text-white mt-6"
              onClick={completeOrder}
                              disabled={loading}
            >
                              {loading ? 'در حال انتقال...' : 'پرداخت امن'}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push('/checkout/address')}
              disabled={loading}
            >
              بازگشت به آدرس تحویل
            </Button>

            {/* Payment Notice */}
            <div className="text-xs text-gray-500 text-center mt-4">
              <p>⚠️ این یک فرم آزمایشی است</p>
              <p>هیچ پرداخت واقعی انجام نمی‌شود</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 