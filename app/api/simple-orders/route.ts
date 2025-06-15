import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSimpleOrderFromCart } from '@/lib/simple-orders';

// Create simple order from cart
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { shipping_address_id, payment_method, customer_notes } = body;

    if (!shipping_address_id) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    const order = await createSimpleOrderFromCart(user.id, {
      shipping_address_id,
      payment_method,
      customer_notes
    });

    return NextResponse.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Create simple order error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
} 