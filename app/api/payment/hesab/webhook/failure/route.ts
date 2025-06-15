import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // Log the webhook for debugging
    console.log('Hesab FAILURE webhook received:', body);
    console.log('Headers:', Object.fromEntries(request.headers.entries()));

    const webhookData = JSON.parse(body);
    console.log('Parsed FAILURE webhook data:', webhookData);

    const { payment_id, order_id: tempOrderRef, reason } = webhookData;

    if (!tempOrderRef) {
      console.error('Missing temp order reference in FAILURE webhook');
      return NextResponse.json(
        { error: 'Missing order reference' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the temporary order data (just to verify it exists)
    const { data: tempOrder, error: tempOrderError } = await supabase
      .from('temp_orders')
      .select('*')
      .eq('temp_order_ref', tempOrderRef)
      .single();

    if (tempOrderError || !tempOrder) {
      console.error('Temporary order not found:', tempOrderRef, tempOrderError);
      // Even if temp order not found, we should return success to avoid webhook retries
      return NextResponse.json({ 
        success: true,
        message: 'Payment failure processed - temp order not found (may have expired)',
        status: 'failed'
      });
    }

    // Simply clean up the temporary order - NO actual order creation
    const { error: deleteError } = await supabase
      .from('temp_orders')
      .delete()
      .eq('id', tempOrder.id);

    if (deleteError) {
      console.error('Failed to delete temporary order:', deleteError);
      // Don't fail the webhook for this
    }

    console.log(`Payment failed for temp order ${tempOrderRef} - Payment ID: ${payment_id}. Temporary order cleaned up.`);

    return NextResponse.json({ 
      success: true,
      message: 'Payment failure processed - no order created',
      temp_order_ref: tempOrderRef,
      status: 'failed',
      reason: reason || 'Payment failed'
    });

  } catch (error) {
    console.error('FAILURE webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
} 