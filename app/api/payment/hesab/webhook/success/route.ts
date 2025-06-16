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

    const supabase = await createClient();

    // Try to get user from webhook data (if available)
    // For fallback, we'll need to create order from current cart
    let tempOrder = null;
    let useCartFallback = false;

    if (tempOrderRef) {
      // Get the temporary order data
      const { data: tempOrderData, error: tempOrderError } = await supabase
        .from('temp_orders')
        .select('*')
        .eq('temp_order_ref', tempOrderRef)
        .single();

      if (tempOrderData && !tempOrderError) {
        tempOrder = tempOrderData;
      } else {
        console.log('Temporary order not found, will use cart fallback');
        useCartFallback = true;
      }
    } else {
      console.log('No temp order reference, will use cart fallback');
      useCartFallback = true;
    }

    // Fallback: Create order from user's current cart
    if (useCartFallback) {
      // We need to get authenticated user's cart
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found for cart fallback');
        return NextResponse.json(
          { error: 'User authentication required' },
          { status: 401 }
        );
      }

      // Get user's cart
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
        console.error('Cart not found or empty:', cartError);
        return NextResponse.json(
          { error: 'Cart not found or empty' },
          { status: 404 }
        );
      }

      // Get user's default address
      const { data: address, error: addressError } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      if (addressError || !address) {
        console.error('Default address not found:', addressError);
        return NextResponse.json(
          { error: 'Default address not found' },
          { status: 404 }
        );
      }

      // Create temp order structure for processing
      tempOrder = {
        user_id: user.id,
        total_amount: cart.cart_items.reduce((sum: number, item: any) => 
          sum + (item.price * item.quantity), 0
        ),
        cart_data: cart,
        shipping_address: {
          full_name: address.full_name,
          phone_number: address.phone_number,
          address_line_1: address.address_line_1,
          address_line_2: address.address_line_2,
          city: address.city,
          state: address.state,
          zip_code: address.zip_code,
          country: address.country
        },
        customer_notes: ''
      };
    }

    // Extract cart data from temporary order
    const cartData = tempOrder.cart_data;
    const shippingAddress = tempOrder.shipping_address;

    // Prepare order items for simple_order_items
    const orderItems = cartData.cart_items.map((item: any) => ({
      product_id: item.product_id,
      product_name: item.product.name,
      product_image_url: item.product.image_urls?.[0] || '',
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
        subtotal: tempOrder.total_amount,
        shipping_cost: 0,
        tax_amount: 0,
        total_amount: tempOrder.total_amount,
        shipping_address: shippingAddress,
        payment_status: 'paid',
        payment_method: 'hesab_gateway',
        customer_notes: `${tempOrder.customer_notes}\nPayment completed successfully via Hesab.com - Payment ID: ${payment_id}${transaction_id ? ` - Transaction ID: ${transaction_id}` : ''}`
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

    // Clean up temporary order if it exists in database
    if (!useCartFallback && tempOrder.id) {
      await supabase.from('temp_orders').delete().eq('id', tempOrder.id);
    }

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