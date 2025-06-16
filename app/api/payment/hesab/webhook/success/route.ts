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

    console.log('Temporary order found:', {
      id: tempOrder.id,
      user_id: tempOrder.user_id ? `${tempOrder.user_id.substring(0, 8)}...` : 'null (guest)',
      has_cart_data: !!tempOrder.cart_data,
      has_shipping_address: !!tempOrder.shipping_address,
      has_legacy_items: !!tempOrder.items,
      has_legacy_shipping: !!tempOrder.shipping_info
    });

    // Determine which data format to use (prefer new format)
    let cartData: any = null;
    let shippingAddress: any = null;
    let orderItems: any[] = [];

    if (tempOrder.cart_data && tempOrder.shipping_address) {
      // NEW FORMAT: Use cart_data and shipping_address
      console.log('Using NEW format: cart_data + shipping_address');
      cartData = tempOrder.cart_data;
      shippingAddress = tempOrder.shipping_address;
      
      // Validate cart_data structure
      if (!cartData.cart_items || !Array.isArray(cartData.cart_items)) {
        console.error('Invalid cart_data structure: missing or invalid cart_items');
        throw new Error('Invalid cart data structure');
      }

      // Prepare order items from cart_data
      orderItems = cartData.cart_items.map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product?.name || 'Unknown Product',
        product_image_url: item.product?.image_urls?.[0] || '',
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      console.log('Order items prepared from cart_data:', {
        items_count: orderItems.length,
        total_amount: orderItems.reduce((sum, item) => sum + item.total_price, 0)
      });

    } else if (tempOrder.items && tempOrder.shipping_info) {
      // LEGACY FORMAT: Use items and shipping_info (fallback)
      console.log('Using LEGACY format: items + shipping_info (fallback)');
      
      // Convert legacy shipping_info to shipping_address format
      shippingAddress = {
        full_name: tempOrder.shipping_info.full_name,
        phone_number: tempOrder.shipping_info.phone_number,
        address_line_1: tempOrder.shipping_info.address || '',
        address_line_2: null,
        city: tempOrder.shipping_info.city,
        state: tempOrder.shipping_info.state,
        zip_code: tempOrder.shipping_info.zip_code,
        country: 'Afghanistan'
      };

      // Prepare order items from legacy items
      orderItems = tempOrder.items.map((item: any) => ({
        product_id: item.product_id,
        product_name: item.name || 'Unknown Product',
        product_image_url: '',
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      console.log('Order items prepared from legacy items:', {
        items_count: orderItems.length,
        total_amount: orderItems.reduce((sum, item) => sum + item.total_price, 0)
      });

    } else {
      console.error('No valid data format found in temp order:', {
        has_cart_data: !!tempOrder.cart_data,
        has_shipping_address: !!tempOrder.shipping_address,
        has_items: !!tempOrder.items,
        has_shipping_info: !!tempOrder.shipping_info
      });
      return NextResponse.json(
        { error: 'Invalid temporary order data format' },
        { status: 400 }
      );
    }

    // Validate required data
    if (!shippingAddress || !orderItems.length) {
      console.error('Missing required data after processing:', {
        has_shipping_address: !!shippingAddress,
        items_count: orderItems.length
      });
      return NextResponse.json(
        { error: 'Missing required order data' },
        { status: 400 }
      );
    }

    // Create the actual order
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Prepare order data - handle missing fields gracefully
    const orderData = {
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
      customer_notes: tempOrder.customer_notes || '',
      admin_notes: `Payment completed successfully via Hesab.com - Payment ID: ${payment_id}${transaction_id ? ` - Transaction ID: ${transaction_id}` : ''}`
    };

    console.log('Creating order with data:', {
      order_number: orderNumber,
      user_id: tempOrder.user_id ? `${tempOrder.user_id.substring(0, 8)}...` : 'null (guest)',
      total_amount: tempOrder.total_amount,
      items_count: orderItems.length,
      payment_id: payment_id,
      transaction_id: transaction_id
    });

    const { data: order, error: orderError } = await supabase
      .from('simple_orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      console.error('Failed to create actual order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    console.log('Order created successfully:', {
      order_id: order.id,
      order_number: order.order_number
    });

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

    console.log('Order items created successfully:', {
      items_count: orderItemsWithOrderId.length
    });

    // Clear the user's cart (only if we have cart data with cart ID)
    if (cartData && cartData.id) {
      console.log('Clearing cart with ID:', cartData.id);
      const { error: clearCartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartData.id);

      if (clearCartError) {
        console.error('Failed to clear cart:', clearCartError);
        // Don't fail the entire process for cart clearing issues
      } else {
        console.log('Cart cleared successfully');
      }
    } else if (tempOrder.user_id) {
      // Fallback: Clear cart by user_id if we don't have cart ID
      console.log('Fallback: Clearing cart by user_id');
      const { data: userCart, error: cartFindError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', tempOrder.user_id)
        .single();

      if (!cartFindError && userCart) {
        const { error: clearCartError } = await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', userCart.id);

        if (clearCartError) {
          console.error('Failed to clear cart (fallback):', clearCartError);
        } else {
          console.log('Cart cleared successfully (fallback)');
        }
      } else {
        console.warn('Could not find user cart for clearing:', cartFindError?.message);
      }
    } else {
      console.log('No cart clearing needed (guest checkout or no cart data)');
    }

    // Clean up temporary order
    const { error: deleteError } = await supabase
      .from('temp_orders')
      .delete()
      .eq('id', tempOrder.id);

    if (deleteError) {
      console.error('Failed to delete temporary order:', deleteError);
      // Don't fail the process for cleanup issues
    } else {
      console.log('Temporary order cleaned up successfully');
    }

    console.log(`SUCCESS: Order ${order.id} (${order.order_number}) created successfully from temp order ${tempOrderRef} - Payment ID: ${payment_id}`);

    return NextResponse.json({ 
      success: true,
      message: 'Payment success - Order created',
      order_id: order.id,
      order_number: order.order_number,
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