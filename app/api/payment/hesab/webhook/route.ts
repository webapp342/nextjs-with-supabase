import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseHesabOrderRef } from '@/lib/hesab-payment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // Log the webhook for debugging
    console.log('Hesab webhook received:', body);
    console.log('Headers:', Object.fromEntries(request.headers.entries()));

    const webhookData = JSON.parse(body);
    console.log('Parsed webhook data:', webhookData);

    const { status, order_id: hesabOrderRef, payment_id } = webhookData;

    if (!hesabOrderRef) {
      console.error('Missing order reference in webhook');
      return NextResponse.json(
        { error: 'Missing order reference' },
        { status: 400 }
      );
    }

    // Parse order ID from Hesab order reference
    const orderId = parseHesabOrderRef(hesabOrderRef);
    if (!orderId) {
      console.error('Invalid order reference format:', hesabOrderRef);
      return NextResponse.json(
        { error: 'Invalid order reference' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from('simple_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderId, orderError);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order based on payment status
    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    switch (status) {
      case 'completed':
      case 'success':
      case 'paid':
        updateData.payment_status = 'completed';
        updateData.status = 'confirmed';
        updateData.notes = `${order.notes}\nPayment completed via Hesab.com - Payment ID: ${payment_id}`;
        console.log('Payment successful for order:', orderId);
        break;
      
      case 'failed':
      case 'cancelled':
      case 'canceled':
        updateData.payment_status = 'failed';
        updateData.status = 'cancelled';
        updateData.notes = `${order.notes}\nPayment failed/cancelled - Payment ID: ${payment_id}`;
        console.log('Payment failed for order:', orderId);
        break;
      
      case 'pending':
        updateData.payment_status = 'pending';
        updateData.notes = `${order.notes}\nPayment pending - Payment ID: ${payment_id}`;
        console.log('Payment pending for order:', orderId);
        break;
      
      default:
        console.log('Unknown payment status:', status);
        updateData.notes = `${order.notes}\nUnknown payment status: ${status} - Payment ID: ${payment_id}`;
    }

    // Update the order
    const { error: updateError } = await supabase
      .from('simple_orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    console.log(`Order ${orderId} updated with payment status: ${status}`);

    return NextResponse.json({ 
      success: true,
      message: 'Webhook processed successfully',
      order_id: orderId,
      status: status
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
} 