'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PaymentSuccessProcessorProps {
  data?: string;
  orderId?: string | undefined;
}

export function PaymentSuccessProcessor({ data, orderId }: PaymentSuccessProcessorProps) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const processPayment = async () => {
      // If we already have an order_id, no need to process
      if (orderId) return;

      // If no data parameter, no need to process
      if (!data) return;

      // Prevent multiple processing
      if (processing) return;

      setProcessing(true);

      try {
        // Parse the payment data from URL
        const paymentData = JSON.parse(decodeURIComponent(data));
        console.log('Payment data received:', paymentData);

        if (paymentData.success && paymentData.transaction_id) {
          // Create order directly from cart
          const response = await fetch('/api/orders/create-from-cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              transaction_id: paymentData.transaction_id,
              payment_method: 'hesab_gateway'
            }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log('Order creation result:', result);

            if (result.success && result.order_number) {
              // Redirect to success page with order number
              router.replace(`/payment/success?order_id=${result.order_number}`);
              return;
            }
          } else {
            const error = await response.text();
            console.error('Failed to create order:', error);
            
            // Still show success page even if order creation fails
            // User can contact support
          }
        }
      } catch (error) {
        console.error('Error processing payment data:', error);
      } finally {
        setProcessing(false);
      }
    };

    processPayment();
  }, [data, orderId, processing, router]);

  // This component doesn't render anything visible
  return null;
} 