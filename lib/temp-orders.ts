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
    
    // Create temporary order reference
    const tempOrderRef = `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Try to get authenticated user, but don't fail if not available
    let userId: string | null = null;
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        userId = user.id;
        console.log('Authenticated user found:', user.id.substring(0, 8) + '...');
      } else {
        console.log('No authenticated user, proceeding with guest checkout');
      }
    } catch (authError) {
      console.log('Auth check failed, proceeding with guest checkout:', authError);
    }
    
    const tempOrderRecord = {
      temp_order_ref: tempOrderRef,
      user_id: userId, // Will be null for guest checkout
      items: orderData.items,
      shipping_info: orderData.shipping_info,
      customer_email: orderData.customer_email,
      total_amount: orderData.total_amount,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating temp order:', {
      temp_order_ref: tempOrderRef,
      customer_email: orderData.customer_email,
      user_id: userId ? `${userId.substring(0, 8)}...` : 'null (guest)',
      total_amount: orderData.total_amount,
      items_count: orderData.items.length
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
      user_id: data.user_id ? `${data.user_id.substring(0, 8)}...` : 'null (guest)'
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