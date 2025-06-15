import { NextRequest, NextResponse } from 'next/server';
import { testHesabConnection, createHesabPayment } from '@/lib/hesab-payment';

export async function GET() {
  try {
    console.log('Testing Hesab.com API connectivity...');
    
    const connectionTest = await testHesabConnection();
    
    return NextResponse.json({
      success: true,
      connection: connectionTest,
      api_key_configured: !!process.env['HESAB_API_KEY'],
      api_key_preview: process.env['HESAB_API_KEY']?.substring(0, 10) + '...',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Hesab API test error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Test failed',
        api_key_configured: !!process.env['HESAB_API_KEY']
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Testing Hesab.com payment creation...');
    
    const body = await request.json();
    const { test_amount = 100 } = body;

    // Test payment creation with minimal data
    const testPaymentData = {
      amount: test_amount,
      currency: 'AFN',
      order_id: `TEST-${Date.now()}`,
      description: 'Test payment from NextJS app',
      customer_email: 'test@example.com',
      customer_phone: '+93700000000',
      customer_name: 'Test Customer',
      return_url: 'https://nextjs-with-supabase-liart-mu.vercel.app/payment/success',
      cancel_url: 'https://nextjs-with-supabase-liart-mu.vercel.app/payment/cancel',
      webhook_url: 'https://nextjs-with-supabase-liart-mu.vercel.app/api/payment/hesab/webhook/success'
    };

    console.log('Creating test payment with data:', testPaymentData);

    const result = await createHesabPayment(testPaymentData);

    return NextResponse.json({
      success: true,
      test_payment: result,
      request_data: testPaymentData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Hesab payment test error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Payment test failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 