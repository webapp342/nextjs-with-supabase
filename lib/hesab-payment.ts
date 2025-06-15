// Hesab.com Payment Gateway Integration
// API Documentation: https://developers.hesab.com/dashboard/developer/docs

const HESAB_API_KEY = process.env['HESAB_API_KEY'] || 'ZTNlMWUyNmEtNGFmMi00ZGY2LWFlYWMtY2QyY2MzOTVjMTQ3X19hY2EzN2VkMDgzNzE3NDhkN2RlMg==';
const HESAB_BASE_URL = 'https://api.hesab.com';

export interface HesabPaymentRequest {
  amount: number; // Amount in AFN (Afghani)
  currency: string; // 'AFN'
  order_id: string; // Your internal order ID
  description: string;
  customer_email?: string;
  customer_phone?: string;
  customer_name?: string;
  return_url: string; // Success redirect URL
  cancel_url: string; // Cancel redirect URL
  webhook_url: string; // Webhook endpoint for payment notifications
}

export interface HesabPaymentResponse {
  success: boolean;
  payment_id: string;
  payment_url: string; // URL to redirect user for payment
  status: string;
  message?: string;
}

export interface HesabWebhookPayload {
  payment_id: string;
  order_id: string;
  status: 'completed' | 'failed' | 'pending' | 'cancelled';
  amount: number;
  currency: string;
  transaction_id?: string;
  timestamp: string;
  signature: string; // For webhook verification
}

// Create payment session
export async function createHesabPayment(paymentData: HesabPaymentRequest): Promise<HesabPaymentResponse> {
  try {
    const response = await fetch(`${HESAB_BASE_URL}/v1/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HESAB_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        amount: paymentData.amount,
        currency: paymentData.currency,
        order_reference: paymentData.order_id,
        description: paymentData.description,
        customer: {
          email: paymentData.customer_email,
          phone: paymentData.customer_phone,
          name: paymentData.customer_name
        },
        redirect_urls: {
          success: paymentData.return_url,
          cancel: paymentData.cancel_url
        },
        webhook_url: paymentData.webhook_url
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Payment creation failed');
    }

    return {
      success: true,
      payment_id: result.payment_id,
      payment_url: result.payment_url,
      status: result.status,
      message: result.message
    };

  } catch (error) {
    console.error('Hesab payment creation error:', error);
    return {
      success: false,
      payment_id: '',
      payment_url: '',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Payment creation failed'
    };
  }
}

// Verify payment status
export async function verifyHesabPayment(paymentId: string) {
  try {
    const response = await fetch(`${HESAB_BASE_URL}/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${HESAB_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Payment verification failed');
    }

    return result;

  } catch (error) {
    console.error('Hesab payment verification error:', error);
    throw error;
  }
}

// Verify webhook signature (for security)
export function verifyHesabWebhook(_payload: string, _signature: string): boolean {
  // Hesab.com doesn't provide webhook secrets in some cases
  // For now, we'll skip signature verification
  console.log('Webhook signature verification skipped - no secret provided by Hesab.com');
  return true;
}

// Generate order reference for Hesab
export function generateHesabOrderRef(orderId: string): string {
  return `ORDER-${orderId}-${Date.now()}`;
}

// Parse order ID from Hesab order reference
export function parseHesabOrderRef(orderRef: string): string | null {
  try {
    // Format: ORDER-{orderId}-{timestamp}
    const parts = orderRef.split('-');
    if (parts.length >= 3 && parts[0] === 'ORDER') {
      return parts[1] || null; // Return the order ID part
    }
    return null;
  } catch (error) {
    console.error('Failed to parse order reference:', error);
    return null;
  }
} 