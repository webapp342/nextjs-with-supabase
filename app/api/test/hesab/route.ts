import { NextRequest, NextResponse } from 'next/server';
import { testHesabConnection, createHesabPayment } from '@/lib/hesab-payment';

export async function GET() {
  try {
    console.log('=== Hesab.com API Test Started ===');
    
    // Test 1: Check environment variables
    const apiKey = process.env['HESAB_API_KEY'];
    console.log('API Key configured:', !!apiKey);
    console.log('API Key preview:', apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found');
    
    // Test 2: Test API connectivity
    console.log('\n=== Testing API Connectivity ===');
    const connectionTest = await testHesabConnection();
    console.log('Connection test result:', connectionTest);
    
    // Test 3: Try creating a test payment (if connection works)
    let paymentTest = null;
    if (connectionTest.success) {
      console.log('\n=== Testing Payment Creation ===');
      try {
        paymentTest = await createHesabPayment({
          items: [
            {
              id: 'test-item-1',
              name: 'Test Product',
              price: 100,
              quantity: 1
            }
          ],
          email: 'test@example.com'
        });
        console.log('Payment test result:', paymentTest);
      } catch (error) {
        console.error('Payment test failed:', error);
        paymentTest = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    // Return comprehensive test results
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        api_key_configured: !!apiKey,
        api_key_preview: apiKey ? `${apiKey.substring(0, 10)}...` : null,
        site_url: process.env['NEXT_PUBLIC_SITE_URL'],
        node_env: process.env['NODE_ENV']
      },
      connectivity_test: connectionTest,
      payment_test: paymentTest,
      message: 'Hesab.com API test completed'
    });
    
  } catch (error) {
    console.error('Hesab test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST method for testing with custom parameters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Custom Hesab test with parameters:', body);
    
    // Convert body parameters to new format
    const items = body.items || [
      {
        id: body.item_id || 'test-item-1',
        name: body.item_name || body.description || 'Custom test product',
        price: body.amount || 100,
        quantity: 1
      }
    ];
    
    const testPayment = await createHesabPayment({
      items,
      email: body.customer_email || body.email || 'test@example.com'
    });
    
    return NextResponse.json({
      success: true,
      test_parameters: body,
      converted_request: {
        items,
        email: body.customer_email || body.email || 'test@example.com'
      },
      payment_result: testPayment,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Custom Hesab test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 