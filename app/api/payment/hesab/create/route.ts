import { NextRequest, NextResponse } from 'next/server';
import { createHesabPayment, convertOrderToHesabItems } from '@/lib/hesab-payment';
import { createTempOrder } from '@/lib/temp-orders';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Hesab payment creation request:', body);

    const { 
      items, 
      shipping_info,
      customer_email,
      total_amount 
    } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Items are required'
      }, { status: 400 });
    }

    if (!customer_email) {
      return NextResponse.json({
        success: false,
        error: 'Customer email is required'
      }, { status: 400 });
    }

    // Create temporary order first
    const tempOrderResult = await createTempOrder({
      items,
      shipping_info,
      customer_email,
      total_amount
    });

    if (!tempOrderResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create temporary order',
        details: tempOrderResult.error
      }, { status: 500 });
    }

    console.log('Temporary order created:', tempOrderResult.temp_order_id);

    // Convert items to Hesab format
    const hesabItems = convertOrderToHesabItems(items);
    
    console.log('Converted items for Hesab:', hesabItems);

    // Create Hesab payment session with temp order reference
    const paymentData: any = {
      items: hesabItems,
      email: customer_email
    };

    // Add temp order reference if available
    if (tempOrderResult.temp_order_id) {
      paymentData.order_id = tempOrderResult.temp_order_id;
      console.log('Including temp order reference in HesabPay request:', tempOrderResult.temp_order_id);
    } else {
      console.warn('No temp order ID available to pass to HesabPay - webhook tracking may fail');
    }

    const paymentResult = await createHesabPayment(paymentData);

    console.log('Hesab payment result:', paymentResult);

    if (paymentResult.success && paymentResult.payment_url) {
      return NextResponse.json({
        success: true,
        payment_url: paymentResult.payment_url,
        session_id: paymentResult.session_id,
        temp_order_id: tempOrderResult.temp_order_id,
        message: 'Payment session created successfully'
      });
    } else {
      // Clean up temp order if payment creation failed
      console.error('Payment creation failed, cleaning up temp order');
      
      return NextResponse.json({
        success: false,
        error: paymentResult.error || 'Payment session creation failed',
        message: paymentResult.message,
        temp_order_id: tempOrderResult.temp_order_id
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Hesab payment creation error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 