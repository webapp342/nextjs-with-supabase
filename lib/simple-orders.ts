import { createClient } from '@/lib/supabase/server';
import { clearCart } from '@/lib/cart';

// Types for simplified orders
export interface SimpleOrder {
  id: string;
  order_number: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  total_amount: number;
  shipping_address: {
    full_name: string;
    phone_number: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state?: string;
    zip_code: string;
    country: string;
  };
  payment_method?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  customer_notes?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SimpleOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image_url?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  created_at: string;
}

export interface CreateSimpleOrderRequest {
  shipping_address_id: string;
  payment_method?: string;
  customer_notes?: string;
}

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
}

// Create order from cart (simplified)
export async function createSimpleOrderFromCart(userId: string, request: CreateSimpleOrderRequest) {
  const supabase = await createClient();
  
  try {
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
      .eq('user_id', userId)
      .single();

    if (cartError || !cart || cart.cart_items.length === 0) {
      throw new Error('Cart is empty or not found');
    }

    // Get shipping address
    const { data: address, error: addressError } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', request.shipping_address_id)
      .eq('user_id', userId)
      .single();

    if (addressError || !address) {
      throw new Error('Shipping address not found');
    }

    // Calculate amounts
    const subtotal = cart.cart_items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    );
    const shippingCost = 0; // Free shipping for now
    const taxAmount = 0; // No tax for now
    const totalAmount = subtotal + shippingCost + taxAmount;

    // Create simplified order
    const orderNumber = generateOrderNumber();
    const { data: order, error: orderError } = await supabase
      .from('simple_orders')
      .insert([{
        order_number: orderNumber,
        user_id: userId,
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
        payment_method: request.payment_method || 'credit_card',
        payment_status: 'paid',
        customer_notes: request.customer_notes
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
      product_name: item.product.name,
      product_image_url: item.product.image_urls?.[0],
      unit_price: item.price,
      quantity: item.quantity,
      total_price: item.price * item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('simple_order_items')
      .insert(orderItems);

    if (itemsError) {
      // Rollback order if items creation fails
      await supabase.from('simple_orders').delete().eq('id', order.id);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    // Clear the cart
    await clearCart(userId);

    return order;
  } catch (error) {
    console.error('Create simple order error:', error);
    throw error;
  }
}

// Get user orders (simplified)
export async function getUserSimpleOrders(userId: string) {
  const supabase = await createClient();
  
  const { data: orders, error } = await supabase
    .from('simple_orders')
    .select(`
      *,
      simple_order_items (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get user orders: ${error.message}`);
  }

  return orders;
}

// Get single order details (simplified)
export async function getSimpleOrderDetails(orderId: string, userId?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from('simple_orders')
    .select(`
      *,
      simple_order_items (*)
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

// Admin functions (simplified)
export async function getAllSimpleOrders(page: number = 1, limit: number = 20) {
  const supabase = await createClient();
  
  const offset = (page - 1) * limit;
  
  const { data: orders, error, count } = await supabase
    .from('simple_orders')
    .select(`
      *,
      simple_order_items (
        quantity,
        product_name
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

// Update order status (simplified)
export async function updateSimpleOrderStatus(orderId: string, status: string, adminNotes?: string) {
  const supabase = await createClient();
  
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (adminNotes) {
    updateData.admin_notes = adminNotes;
  }

  const { data: order, error } = await supabase
    .from('simple_orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update order status: ${error.message}`);
  }

  return order;
}

// Get order status history
export async function getOrderStatusHistory(orderId: string) {
  const supabase = await createClient();
  
  const { data: history, error } = await supabase
    .from('simple_order_status_history')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get order history: ${error.message}`);
  }

  return history;
} 