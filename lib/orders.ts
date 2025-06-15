import { createClient } from '@/lib/supabase/server';
import { clearCart } from '@/lib/cart';
import type { CreateOrderRequest } from '@/types/cart';

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
}

// Create order from cart
export async function createOrderFromCart(userId: string, request: CreateOrderRequest) {
  const supabase = await createClient();
  
  try {
    // Start transaction by getting cart with items
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
      .eq('user_id', userId)
      .single();

    if (cartError || !cart || cart.cart_items.length === 0) {
      throw new Error('Cart is empty or not found');
    }

    // Calculate total amount
    const totalAmount = cart.cart_items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    );

    // Create order
    const orderNumber = generateOrderNumber();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: userId,
        order_number: orderNumber,
        status: 'confirmed',
        total_amount: totalAmount,
        shipping_address_id: request.shipping_address_id,
        payment_status: 'paid',
        payment_method: request.payment_method || 'credit_card',
        notes: request.notes
      }])
      .select()
      .single();

    if (orderError) {
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    // Create order items
    const orderItems = cart.cart_items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Rollback order if items creation fails
      await supabase.from('orders').delete().eq('id', order.id);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    // Clear the cart
    await clearCart(userId);

    return order;
  } catch (error) {
    console.error('Create order error:', error);
    throw error;
  }
}

// Get user orders
export async function getUserOrders(userId: string) {
  const supabase = await createClient();
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      shipping_address:addresses!shipping_address_id (
        full_name,
        phone_number,
        address_line_1,
        address_line_2,
        city,
        state,
        zip_code,
        country
      ),
      order_items (
        *,
        product:products (
          id,
          name,
          image_urls
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get user orders: ${error.message}`);
  }

  return orders;
}

// Get single order details
export async function getOrderDetails(orderId: string, userId?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from('orders')
    .select(`
      *,
      shipping_address:addresses!shipping_address_id (
        full_name,
        phone_number,
        address_line_1,
        address_line_2,
        city,
        state,
        zip_code,
        country
      ),
      order_items (
        *,
        product:products (
          id,
          name,
          image_urls,
          price
        )
      )
    `)
    .eq('id', orderId);

  // If userId is provided, filter by user (for user access)
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data: order, error } = await query.single();

  if (error) {
    throw new Error(`Failed to get order details: ${error.message}`);
  }

  return order;
}

// Admin functions
export async function getAllOrders(page: number = 1, limit: number = 20) {
  const supabase = await createClient();
  
  const offset = (page - 1) * limit;
  
  const { data: orders, error, count } = await supabase
    .from('orders')
    .select(`
      *,
      shipping_address:addresses!shipping_address_id (
        full_name,
        phone_number,
        city
      ),
      order_items (
        quantity,
        product:products (
          name
        )
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to get orders: ${error.message}`);
  }

  return {
    orders,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

// Update order status (admin only)
export async function updateOrderStatus(orderId: string, status: string, notes?: string) {
  const supabase = await createClient();
  
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (notes) {
    updateData.notes = notes;
  }

  const { data: order, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update order status: ${error.message}`);
  }

  return order;
}

 