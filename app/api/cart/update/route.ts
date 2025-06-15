import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateCartItem } from '@/lib/cart';
import type { UpdateCartItemRequest } from '@/types/cart';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: UpdateCartItemRequest = await request.json();
    
    // Validate request
    if (!body.cart_item_id || body.quantity < 0) {
      return NextResponse.json(
        { error: 'Invalid cart_item_id or quantity' },
        { status: 400 }
      );
    }

    // Update cart item
    const cartItem = await updateCartItem(user.id, body);
    
    if (cartItem === null) {
      return NextResponse.json({ 
        message: 'Cart item removed successfully' 
      });
    }
    
    return NextResponse.json({ 
      message: 'Cart item updated successfully',
      cart_item: cartItem 
    });

  } catch (error) {
    console.error('Update cart item API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update cart item' },
      { status: 500 }
    );
  }
} 