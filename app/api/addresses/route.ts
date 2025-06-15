import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { AddressFormData } from '@/types/cart';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's addresses
    const { data: addresses, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch addresses: ${error.message}`);
    }

    return NextResponse.json({ addresses });

  } catch (error) {
    console.error('Addresses API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: AddressFormData = await request.json();
    
    // Validate required fields
    if (!body.full_name || !body.phone_number || !body.address_line_1 || !body.city || !body.zip_code) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If this is set as default, unset other default addresses
    if (body.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    // Create new address
    const { data: address, error } = await supabase
      .from('addresses')
      .insert([{
        user_id: user.id,
        full_name: body.full_name,
        phone_number: body.phone_number,
        address_line_1: body.address_line_1,
        address_line_2: body.address_line_2 || null,
        city: body.city,
        state: body.state || null,
        zip_code: body.zip_code,
        country: body.country || 'Afghanistan',
        is_default: body.is_default || false,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create address: ${error.message}`);
    }

    return NextResponse.json({ 
      message: 'Address created successfully',
      address 
    });

  } catch (error) {
    console.error('Create address API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create address' },
      { status: 500 }
    );
  }
} 