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
    
    const tempOrderRecord = {
      temp_order_ref: tempOrderRef,
      items: orderData.items,
      shipping_info: orderData.shipping_info,
      customer_email: orderData.customer_email,
      total_amount: orderData.total_amount,
      created_at: new Date().toISOString(),
      status: 'pending'
    };

    console.log('Creating temp order:', tempOrderRecord);

    const { data, error } = await supabase
      .from('temp_orders')
      .insert([tempOrderRecord])
      .select()
      .single();

    if (error) {
      console.error('Temp order creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('Temp order created successfully:', data);

    return {
      success: true,
      temp_order_id: tempOrderRef
    };

  } catch (error) {
    console.error('Temp order creation exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
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