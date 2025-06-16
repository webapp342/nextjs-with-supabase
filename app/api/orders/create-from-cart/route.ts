import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { transaction_id, payment_method = 'hesab_gateway' } = body;

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
      return NextResponse.json(
        { error: 'Default address not found' },
        { status: 404 }
      );
    }

    // Calculate totals
    const subtotal = cart.cart_items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    );
    const shippingCost = 0;
    const taxAmount = 0;
    const totalAmount = subtotal + shippingCost + taxAmount;

    // Create order
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const { data: order, error: orderError } = await supabase
      .from('simple_orders')
      .insert([{
        user_id: user.id,
        order_number: orderNumber,
        status: 'confirmed',
        subtotal,
        shipping_cost: shippingCost,
        tax_amount: taxAmount,
        total_amount: totalAmount,
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
        payment_status: 'paid',
        payment_method,
        customer_notes: transaction_id ? `Payment completed - Transaction ID: ${transaction_id}` : 'Payment completed'
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Failed to create order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = cart.cart_items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product.name,
      product_image_url: item.product.image_urls?.[0] || '',
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('simple_order_items')
      .insert(orderItems);

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
    await supabase.from('cart_items').delete().eq('cart_id', cart.id);

    console.log(`Order ${order.id} created successfully from cart - Transaction ID: ${transaction_id}`);

    return NextResponse.json({ 
      success: true,
      message: 'Order created successfully',
      order_id: order.id,
      order_number: orderNumber,
      status: 'confirmed'
    });

  } catch (error) {
    console.error('Create order from cart error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
} 