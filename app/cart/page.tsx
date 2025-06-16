import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCartWithItems } from '@/lib/cart';
import { CartPageClient } from '@/components/cart/cart-page-client';

export default async function CartPage() {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login?redirect=/cart');
  }

  // Get cart with items
  const cart = await getCartWithItems(user.id);

  return <CartPageClient initialCart={cart} />;
} 