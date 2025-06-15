import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addToCart } from '@/lib/cart';
import type { AddToCartRequest } from '@/types/cart';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: AddToCartRequest = await request.json();
    
    // Validate request
    if (!body.product_id || !body.quantity || body.quantity <= 0) {
      return NextResponse.json(
        { error: 'Invalid product_id or quantity' },
        { status: 400 }
      );
    }

    // Add item to cart
    const cartItem = await addToCart(user.id, body);
    
    return NextResponse.json({ 
      message: 'Item added to cart successfully',
      cart_item: cartItem 
    });

  } catch (error) {
    console.error('Add to cart API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add item to cart' },
      { status: 500 }
    );
  }
} 