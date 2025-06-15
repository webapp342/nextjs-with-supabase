import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateOrderStatus, getOrderDetails } from '@/lib/orders';

// Simple auth check
async function checkAuth() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Authentication required', status: 401 };
  }

  return { user };
}

// Get single order details (admin)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await checkAuth();
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { id } = await params;
    const order = await getOrderDetails(id);

    return NextResponse.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get order details error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get order details' },
      { status: 500 }
    );
  }
}

// Update order status (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await checkAuth();
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const body = await request.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const order = await updateOrderStatus(id, status, notes);

    return NextResponse.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update order status' },
      { status: 500 }
    );
  }
} 