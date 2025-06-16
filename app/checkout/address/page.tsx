import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCartWithItems } from '@/lib/cart';
import { AddressFormClient } from '@/components/checkout/address-form-client';

export default async function CheckoutAddressPage() {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login?redirect=/checkout/address');
  }

  // Check if cart has items
  const cart = await getCartWithItems(user.id);
  if (!cart || cart.cart_items.length === 0) {
    redirect('/cart');
  }

  // Get user's existing addresses
  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <AddressFormClient 
      initialAddresses={addresses || []} 
      cart={cart}
    />
  );
} 