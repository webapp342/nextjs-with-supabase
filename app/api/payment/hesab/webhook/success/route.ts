import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // Log the webhook for debugging
    console.log('Hesab SUCCESS webhook received:', body);
    console.log('Headers:', Object.fromEntries(request.headers.entries()));

    const webhookData = JSON.parse(body);
    console.log('Parsed SUCCESS webhook data:', webhookData);

    const { payment_id, order_id: tempOrderRef, transaction_id } = webhookData;

    if (!tempOrderRef) {
      console.error('Missing temp order reference in SUCCESS webhook');
      return NextResponse.json(
        { error: 'Missing order reference' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the temporary order data
    const { data: tempOrder, error: tempOrderError } = await supabase
      .from('temp_orders')
      .select('*')
      .eq('temp_order_ref', tempOrderRef)
      .single();

    if (tempOrderError || !tempOrder) {
      console.error('Temporary order not found:', tempOrderRef, tempOrderError);
      return NextResponse.json(
        { error: 'Temporary order not found' },
        { status: 404 }
      );
    }

    // Extract cart data from temporary order
    const cartData = tempOrder.cart_data;
    const shippingAddress = tempOrder.shipping_address;

    // Prepare order items for simple_order_items
    const orderItems = cartData.cart_items.map((item: any) => ({
      product_id: item.product_id,
      product_name: item.product.name,
      product_image: item.product.image_urls?.[0] || '',
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity
    }));

    // Create the actual order
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const { data: order, error: orderError } = await supabase
      .from('simple_orders')
      .insert([{
        user_id: tempOrder.user_id,
        order_number: orderNumber,
        status: 'confirmed',
        total_amount: tempOrder.total_amount,
        customer_name: shippingAddress.full_name,
        customer_email: cartData.user_email || '',
        customer_phone: shippingAddress.phone_number,
        shipping_address: shippingAddress,
        payment_status: 'completed',
        payment_method: 'hesab_gateway',
        notes: `${tempOrder.customer_notes}\nPayment completed successfully via Hesab.com - Payment ID: ${payment_id}${transaction_id ? ` - Transaction ID: ${transaction_id}` : ''}`
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Failed to create actual order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Create order items
    const orderItemsWithOrderId = orderItems.map((item: any) => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await supabase
      .from('simple_order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) {
      console.error('Failed to create order items:', itemsError);
      // Rollback order if items creation fails
      await supabase.from('simple_orders').delete().eq('id', order.id);
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      );
    }

    // Clear the user's cart
    await supabase.from('cart_items').delete().eq('cart_id', cartData.id);

    // Clean up temporary order
    await supabase.from('temp_orders').delete().eq('id', tempOrder.id);

    console.log(`Order ${order.id} created successfully from temp order ${tempOrderRef} - Payment ID: ${payment_id}`);

    return NextResponse.json({ 
      success: true,
      message: 'Payment success - Order created',
      order_id: order.id,
      order_number: orderNumber,
      status: 'confirmed'
    });

  } catch (error) {
    console.error('SUCCESS webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
} 