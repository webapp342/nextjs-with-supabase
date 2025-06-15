import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createHesabPayment } from '@/lib/hesab-payment';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { shipping_address, customer_notes } = body;

    if (!shipping_address || !shipping_address.full_name || !shipping_address.phone_number || !shipping_address.address) {
      return NextResponse.json(
        { error: 'Complete shipping address is required' },
        { status: 400 }
      );
    }

    // Get cart with items
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select(`
        *,
        cart_items (
          *,
          product:products (
            id,
            name,
            image_urls,
            price
          )
        )
      `)
      .eq('user_id', user.id)
      .single();

    if (cartError || !cart || cart.cart_items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty or not found' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = cart.cart_items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    );

    // Create temporary order reference (not in database yet)
    const tempOrderRef = `TEMP-${user.id}-${Date.now()}`;
    
    // Store cart data temporarily in a session table or use the order reference
    // We'll create the actual order only when payment succeeds
    const orderData = {
      user_id: user.id,
      cart_data: cart,
      shipping_address: shipping_address,
      customer_notes: customer_notes || '',
      total_amount: totalAmount,
      temp_order_ref: tempOrderRef
    };

    // Store temporary order data
    const { data: tempOrder, error: tempOrderError } = await supabase
      .from('temp_orders')
      .insert([orderData])
      .select()
      .single();

    if (tempOrderError) {
      console.error('Temporary order creation error:', tempOrderError);
      return NextResponse.json(
        { error: `Failed to create temporary order: ${tempOrderError.message}` },
        { status: 500 }
      );
    }

    // Create Hesab payment with temporary reference
    const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] || 'https://nextjs-with-supabase-liart-mu.vercel.app';
    
    const paymentResult = await createHesabPayment({
      amount: totalAmount,
      currency: 'AFN',
      order_id: tempOrderRef,
      description: `سفارش موقت - ${cart.cart_items.length} کالا`,
      customer_email: user.email || '',
      customer_phone: shipping_address.phone_number,
      customer_name: shipping_address.full_name,
      return_url: `${baseUrl}/payment/success?temp_ref=${tempOrderRef}`,
      cancel_url: `${baseUrl}/payment/cancel?temp_ref=${tempOrderRef}`,
      webhook_url: `${baseUrl}/api/payment/hesab/webhook/success`
    });

    if (!paymentResult.success) {
      console.error('Hesab payment creation failed:', paymentResult);
      // Clean up temporary order
      await supabase.from('temp_orders').delete().eq('id', tempOrder.id);
      
      return NextResponse.json(
        { error: paymentResult.message || 'Payment creation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      temp_order_ref: tempOrderRef,
      payment_url: paymentResult.payment_url,
      payment_id: paymentResult.payment_id
    });

  } catch (error) {
    console.error('Hesab payment creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment creation failed' },
      { status: 500 }
    );
  }
} 