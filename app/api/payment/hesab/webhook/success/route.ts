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

    // 🔧 FIXED: Extract data from HesabPay's actual payload format
    const { 
      status_code, 
      success, 
      message,
      transaction_id, 
      amount, 
      email, 
      items: webhookItems,
      timestamp,
      signature 
    } = webhookData;

    console.log('🎯 HesabPay webhook data extracted:', {
      status_code,
      success,
      transaction_id,
      amount,
      email,
      items_count: webhookItems?.length || 0,
      timestamp
    });

    // Validate required fields from HesabPay
    if (!transaction_id || !email || amount === undefined) {
      console.error('❌ Missing required fields in HesabPay webhook:', {
        has_transaction_id: !!transaction_id,
        has_email: !!email,
        has_amount: amount !== undefined
      });
      return NextResponse.json(
        { error: 'Missing required webhook data' },
        { status: 400 }
      );
    }

    // Check success status
    if (status_code !== 10 || !success) {
      console.error('❌ Payment not successful according to HesabPay:', {
        status_code,
        success,
        message
      });
      return NextResponse.json(
        { error: 'Payment not successful' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    console.log('🔍 Searching for temp order with criteria:', {
      email,
      amount,
      webhook_items_count: webhookItems?.length || 0
    });

    // 🔧 FIXED: Find temp order by email, amount, and recent timestamp
    // Since HesabPay doesn't send back order_id, we need to match by other criteria
    const timeThreshold = new Date();
    timeThreshold.setHours(timeThreshold.getHours() - 1); // Look for orders from last hour

    const { data: tempOrders, error: tempOrderError } = await supabase
      .from('temp_orders')
      .select('*')
      .eq('customer_email', email)
      .eq('total_amount', amount)
      .gte('created_at', timeThreshold.toISOString())
      .order('created_at', { ascending: false });

    if (tempOrderError) {
      console.error('❌ Error searching for temp orders:', tempOrderError);
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      );
    }

    if (!tempOrders || tempOrders.length === 0) {
      console.error('❌ No matching temp orders found:', {
        email,
        amount,
        search_timeframe: 'last 1 hour',
        webhook_transaction_id: transaction_id
      });
      return NextResponse.json(
        { error: 'Matching temporary order not found' },
        { status: 404 }
      );
    }

    // If multiple temp orders found, try to find the best match
    let tempOrder = tempOrders[0]; // Default to most recent
    
    if (tempOrders.length > 1) {
      console.log(`⚠️ Multiple temp orders found (${tempOrders.length}), selecting most recent one`);
      // In the future, we could add more sophisticated matching logic here
      // For now, we take the most recent one
    }

    console.log('✅ Temporary order found:', {
      id: tempOrder.id,
      temp_order_ref: tempOrder.temp_order_ref,
      user_id: tempOrder.user_id ? `${tempOrder.user_id.substring(0, 8)}...` : 'null (guest)',
      has_cart_data: !!tempOrder.cart_data,
      has_shipping_address: !!tempOrder.shipping_address,
      has_legacy_items: !!tempOrder.items,
      has_legacy_shipping: !!tempOrder.shipping_info,
      created_at: tempOrder.created_at,
      matched_criteria: { email, amount }
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
      admin_notes: `Payment completed successfully via Hesab.com - Payment ID: ${transaction_id}`
    };

    console.log('Creating order with data:', {
      order_number: orderNumber,
      user_id: tempOrder.user_id ? `${tempOrder.user_id.substring(0, 8)}...` : 'null (guest)',
      total_amount: tempOrder.total_amount,
      items_count: orderItems.length,
      payment_id: transaction_id
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

    console.log(`SUCCESS: Order ${order.id} (${order.order_number}) created successfully from temp order ${tempOrder.temp_order_ref} - Payment ID: ${transaction_id}`);

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