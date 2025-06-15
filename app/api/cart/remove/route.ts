import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { removeCartItem } from '@/lib/cart';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    
    // Validate request
    if (!body.cart_item_id) {
      return NextResponse.json(
        { error: 'Invalid cart_item_id' },
        { status: 400 }
      );
    }

    // Remove cart item
    await removeCartItem(user.id, body.cart_item_id);
    
    return NextResponse.json({ 
      message: 'Cart item removed successfully' 
    });

  } catch (error) {
    console.error('Remove cart item API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove cart item' },
      { status: 500 }
    );
  }
} 