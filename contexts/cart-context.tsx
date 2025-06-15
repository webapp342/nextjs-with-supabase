'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CartContextType {
  cartItemCount: number;
  refreshCart: () => Promise<void>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItemCount, setCartItemCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const refreshCart = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const response = await fetch('/api/cart');
        if (response.ok) {
          const data = await response.json();
          setCartItemCount(data.cart?.total_items || 0);
        }
      } else {
        setCartItemCount(0);
      }
    } catch (error) {
      console.error('Failed to refresh cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial cart load
    refreshCart();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        refreshCart();
      } else {
        setCartItemCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return (
    <CartContext.Provider value={{ cartItemCount, refreshCart, isLoading }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 