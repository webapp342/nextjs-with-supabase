import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAllSimpleOrders } from '@/lib/simple-orders';

// Simple auth check - you can add admin role check later
async function checkAuth() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Authentication required', status: 401 };
  }

  return { user };
}

// Get all simple orders (admin only)
export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkAuth();
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await getAllSimpleOrders(page, limit);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Get admin simple orders error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get orders' },
      { status: 500 }
    );
  }
} 