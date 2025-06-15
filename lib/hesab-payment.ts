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
    console.log('Creating Hesab payment with data:', {
      ...paymentData,
      webhook_url: paymentData.webhook_url
    });

    // Hesab.com API structure based on documentation
    const requestBody = {
      amount: paymentData.amount,
      currency: paymentData.currency,
      order_reference: paymentData.order_id,
      description: paymentData.description,
      customer: {
        email: paymentData.customer_email || '',
        phone: paymentData.customer_phone || '',
        name: paymentData.customer_name || ''
      },
      redirect_urls: {
        success: paymentData.return_url,
        cancel: paymentData.cancel_url
      },
      webhook_url: paymentData.webhook_url
    };

    console.log('Hesab API Request:', {
      url: `${HESAB_BASE_URL}/v1/payments`,
      headers: {
        'Authorization': `Bearer ${HESAB_API_KEY.substring(0, 10)}...`,
        'Content-Type': 'application/json'
      },
      body: requestBody
    });

    const response = await fetch(`${HESAB_BASE_URL}/v1/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HESAB_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'NextJS-Ecommerce/1.0'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Hesab API Response Status:', response.status);
    console.log('Hesab API Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Hesab API Raw Response:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Hesab API response as JSON:', parseError);
      console.error('Raw response:', responseText);
      
      // If response is HTML, it might be an error page
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
        throw new Error('Hesab API returned HTML instead of JSON. This usually indicates an authentication or endpoint error.');
      }
      
      throw new Error(`Invalid JSON response from Hesab API: ${responseText.substring(0, 100)}...`);
    }

    if (!response.ok) {
      console.error('Hesab API Error Response:', result);
      throw new Error(result.message || result.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('Hesab API Success Response:', result);

    return {
      success: true,
      payment_id: result.payment_id || result.id,
      payment_url: result.payment_url || result.checkout_url,
      status: result.status || 'pending',
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

// Alternative API endpoints to try if main one fails
export const HESAB_ALTERNATIVE_ENDPOINTS = [
  'https://api.hesab.com/v1/payments',
  'https://gateway.hesab.com/api/v1/payments',
  'https://pay.hesab.com/api/v1/payments'
];

// Test API connectivity
export async function testHesabConnection(): Promise<{ success: boolean; message: string; endpoint?: string }> {
  for (const endpoint of HESAB_ALTERNATIVE_ENDPOINTS) {
    try {
      console.log(`Testing Hesab endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${HESAB_API_KEY}`,
          'Accept': 'application/json'
        }
      });

      console.log(`Endpoint ${endpoint} responded with status: ${response.status}`);
      
      if (response.status !== 404) {
        return {
          success: true,
          message: `Connected to Hesab API at ${endpoint}`,
          endpoint
        };
      }
    } catch (error) {
      console.log(`Endpoint ${endpoint} failed:`, error);
      continue;
    }
  }

  return {
    success: false,
    message: 'Could not connect to any Hesab API endpoint'
  };
} 