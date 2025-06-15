import { Suspense } from 'react';
import { XCircle, ShoppingCart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { toPersianNumber } from '@/lib/utils';

interface PaymentCancelPageProps {
  searchParams: Promise<{
    order_id?: string;
    payment_id?: string;
  }>;
}

async function PaymentCancelContent({ searchParams }: PaymentCancelPageProps) {
  const resolvedSearchParams = await searchParams;
  const { order_id } = resolvedSearchParams;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            پرداخت لغو شد
          </h1>
          
          <p className="text-gray-600 mb-6">
            پرداخت شما لغو شد. سفارش شما ذخیره شده و می‌توانید مجدداً پرداخت کنید.
          </p>

          {order_id && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">شماره سفارش:</p>
              <p className="font-mono text-lg font-medium">
                {toPersianNumber(order_id)}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link href="/cart" className="block">
              <Button className="w-full">
                <ShoppingCart className="w-4 h-4 ml-2" />
                بازگشت به سبد خرید
              </Button>
            </Link>
            
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                <ArrowRight className="w-4 h-4 ml-2" />
                ادامه خرید
              </Button>
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              در صورت بروز مشکل، با پشتیبانی تماس بگیرید.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentCancelPage({ searchParams }: PaymentCancelPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    }>
      <PaymentCancelContent searchParams={searchParams} />
    </Suspense>
  );
} 