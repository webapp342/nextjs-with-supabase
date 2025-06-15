import { createClient } from '@/lib/supabase/client';

// Client-side cart functions
export const cartClientActions = {
  async addToCart(productId: string, quantity: number = 1) {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product_id: productId, quantity }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add item to cart');
    }

    return response.json();
  },

  async updateCartItem(cartItemId: string, quantity: number) {
    const response = await fetch('/api/cart/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cart_item_id: cartItemId, quantity }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update cart item');
    }

    return response.json();
  },

  async removeCartItem(cartItemId: string) {
    const response = await fetch('/api/cart/remove', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cart_item_id: cartItemId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove cart item');
    }

    return response.json();
  },

  async getCart() {
    const response = await fetch('/api/cart');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get cart');
    }

    return response.json();
  }
}; 