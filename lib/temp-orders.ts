import { createClient } from '@/lib/supabase/server';

export interface TempOrderData {
  items: any[];
  shipping_info: any;
  customer_email: string;
  total_amount: number;
}

export interface TempOrderResult {
  success: boolean;
  temp_order_id?: string;
  error?: string;
}

export async function createTempOrder(orderData: TempOrderData): Promise<TempOrderResult> {
  try {
    const supabase = await createClient();
    
    // Create temporary order reference with better uniqueness
    const tempOrderRef = `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 🔧 FUTURE: Could add session_id for better webhook matching
    const sessionId = `${Date.now()}-${orderData.user_id || 'guest'}-${Math.random().toString(36).substr(2, 5)}`;
    
    // Try to get authenticated user, but don't fail if not available
    let userId: string | null = null;
    let cartData: any = null;
    let shippingAddress: any = null;
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        userId = user.id;
        console.log('Authenticated user found:', user.id.substring(0, 8) + '...');
        
        // Fetch the full cart data with items and products
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
                price,
                compare_price,
                brand,
                category
              )
            )
          `)
          .eq('user_id', userId)
          .single();

        if (!cartError && cart) {
          cartData = cart;
          console.log('Cart data fetched successfully:', {
            cart_id: cart.id,
            items_count: cart.cart_items?.length || 0,
            user_id: cart.user_id.substring(0, 8) + '...'
          });
        } else {
          console.warn('Could not fetch cart data for user:', cartError?.message);
        }
        
        // Convert shipping_info to shipping_address format to match what webhook expects
        if (orderData.shipping_info) {
          shippingAddress = {
            full_name: orderData.shipping_info.full_name,
            phone_number: orderData.shipping_info.phone_number,
            address_line_1: orderData.shipping_info.address || '',
            address_line_2: null,
            city: orderData.shipping_info.city,
            state: orderData.shipping_info.state,
            zip_code: orderData.shipping_info.zip_code,
            country: 'Afghanistan' // Default country
          };
          console.log('Shipping address prepared:', {
            full_name: shippingAddress.full_name,
            city: shippingAddress.city
          });
        }
      } else {
        console.log('No authenticated user, proceeding with guest checkout');
      }
    } catch (authError) {
      console.log('Auth check failed, proceeding with guest checkout:', authError);
    }
    
    const tempOrderRecord = {
      temp_order_ref: tempOrderRef,
      user_id: userId, // Will be null for guest checkout
      
      // NEW FORMAT: Store full cart data and structured shipping address (what webhook expects)
      cart_data: cartData, // Full cart structure with cart_items and products
      shipping_address: shippingAddress, // Structured address object
      
      // LEGACY FORMAT: Keep for backward compatibility
      items: orderData.items, // Simplified items array
      shipping_info: orderData.shipping_info, // Original shipping info
      
      // Common fields
      customer_email: orderData.customer_email,
      total_amount: orderData.total_amount,
      customer_notes: '', // Default empty notes
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating temp order with improved tracking:', {
      temp_order_ref: tempOrderRef,
      session_hint: sessionId, // Could be used for future matching improvements
      user_id: userId ? `${userId.substring(0, 8)}...` : 'guest'
    });

    const { data, error } = await supabase
      .from('temp_orders')
      .insert([tempOrderRecord])
      .select()
      .single();

    if (error) {
      console.error('Temp order creation error:', error);
      return {
        success: false,
        error: `Database error: ${error.message}`
      };
    }

    console.log('Temp order created successfully:', {
      id: data.id,
      temp_order_ref: data.temp_order_ref,
      customer_email: data.customer_email,
      user_id: data.user_id ? `${data.user_id.substring(0, 8)}...` : 'null (guest)',
      has_cart_data: !!data.cart_data,
      has_shipping_address: !!data.shipping_address
    });

    return {
      success: true,
      temp_order_id: tempOrderRef
    };

  } catch (error) {
    console.error('Temp order creation exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function getTempOrder(tempOrderRef: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('temp_orders')
      .select('*')
      .eq('temp_order_ref', tempOrderRef)
      .single();

    if (error) {
      console.error('Get temp order error:', error);
      return null;
    }

    return data;

  } catch (error) {
    console.error('Get temp order exception:', error);
    return null;
  }
}

export async function deleteTempOrder(tempOrderRef: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('temp_orders')
      .delete()
      .eq('temp_order_ref', tempOrderRef);

    if (error) {
      console.error('Delete temp order error:', error);
      return false;
    }

    console.log('Temp order deleted:', tempOrderRef);
    return true;

  } catch (error) {
    console.error('Delete temp order exception:', error);
    return false;
  }
}

// Helper function to clean up expired temp orders
export async function cleanupExpiredTempOrders() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('temp_orders')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('temp_order_ref');

    if (error) {
      console.error('Cleanup expired temp orders error:', error);
      return false;
    }

    if (data && data.length > 0) {
      console.log(`Cleaned up ${data.length} expired temp orders`);
    }

    return true;

  } catch (error) {
    console.error('Cleanup expired temp orders exception:', error);
    return false;
  }
} 