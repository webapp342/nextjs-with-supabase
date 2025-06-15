import { createClient } from '@/lib/supabase/server';
import type { CartWithItems, CartItem, AddToCartRequest, UpdateCartItemRequest } from '@/types/cart';

// Server-side cart functions
export async function getOrCreateCart(userId: string) {
  const supabase = await createClient();
  
  // Try to get existing cart
  let { data: cart, error } = await supabase
    .from('carts')
    .select('*')
    .eq('user_id', userId)
    .single();

  // If no cart exists, create one
  if (error && error.code === 'PGRST116') {
    const { data: newCart, error: createError } = await supabase
      .from('carts')
      .insert([{ user_id: userId }])
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create cart: ${createError.message}`);
    }

    cart = newCart;
  } else if (error) {
    throw new Error(`Failed to get cart: ${error.message}`);
  }

  return cart;
}

export async function getCartWithItems(userId: string): Promise<CartWithItems | null> {
  const supabase = await createClient();
  
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

  if (cartError && cartError.code === 'PGRST116') {
    // No cart found
    return null;
  }

  if (cartError) {
    throw new Error(`Failed to get cart: ${cartError.message}`);
  }

  // Calculate totals
  const cartItems = cart.cart_items || [];
  const totalAmount = cartItems.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
  const totalItems = cartItems.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);

  return {
    ...cart,
    cart_items: cartItems,
    total_amount: totalAmount,
    total_items: totalItems,
  };
}

export async function addToCart(userId: string, request: AddToCartRequest) {
  const supabase = await createClient();
  
  // Get or create cart
  const cart = await getOrCreateCart(userId);
  
  // Get product details
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, price')
    .eq('id', request.product_id)
    .single();

  if (productError) {
    throw new Error(`Product not found: ${productError.message}`);
  }

  // Check if item already exists in cart
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cart.id)
    .eq('product_id', request.product_id)
    .single();

  if (existingItem) {
    // Update existing item quantity
    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update({ 
        quantity: existingItem.quantity + request.quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingItem.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update cart item: ${updateError.message}`);
    }

    return updatedItem;
  } else {
    // Add new item to cart
    const { data: newItem, error: insertError } = await supabase
      .from('cart_items')
      .insert([{
        cart_id: cart.id,
        product_id: request.product_id,
        quantity: request.quantity,
        price: product.price
      }])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to add item to cart: ${insertError.message}`);
    }

    return newItem;
  }
}

export async function updateCartItem(userId: string, request: UpdateCartItemRequest) {
  const supabase = await createClient();
  
  // Verify the cart item belongs to the user
  const { error: verifyError } = await supabase
    .from('cart_items')
    .select(`
      *,
      cart:carts!inner(user_id)
    `)
    .eq('id', request.cart_item_id)
    .eq('cart.user_id', userId)
    .single();

  if (verifyError) {
    throw new Error(`Cart item not found or unauthorized: ${verifyError.message}`);
  }

  if (request.quantity <= 0) {
    // Remove item if quantity is 0 or negative
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', request.cart_item_id);

    if (deleteError) {
      throw new Error(`Failed to remove cart item: ${deleteError.message}`);
    }

    return null;
  } else {
    // Update quantity
    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update({ 
        quantity: request.quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', request.cart_item_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update cart item: ${updateError.message}`);
    }

    return updatedItem;
  }
}

export async function removeCartItem(userId: string, cartItemId: string) {
  const supabase = await createClient();
  
  // Verify the cart item belongs to the user
  const { error: verifyError } = await supabase
    .from('cart_items')
    .select(`
      *,
      cart:carts!inner(user_id)
    `)
    .eq('id', cartItemId)
    .eq('cart.user_id', userId)
    .single();

  if (verifyError) {
    throw new Error(`Cart item not found or unauthorized: ${verifyError.message}`);
  }

  const { error: deleteError } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId);

  if (deleteError) {
    throw new Error(`Failed to remove cart item: ${deleteError.message}`);
  }

  return true;
}

export async function clearCart(userId: string) {
  const supabase = await createClient();
  
  // Get user's cart
  const { data: cart, error: cartError } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (cartError) {
    throw new Error(`Cart not found: ${cartError.message}`);
  }

  // Delete all cart items
  const { error: deleteError } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', cart.id);

  if (deleteError) {
    throw new Error(`Failed to clear cart: ${deleteError.message}`);
  }

  return true;
}

 