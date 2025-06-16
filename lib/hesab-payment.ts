// Hesab.com Payment Gateway Integration
// API Documentation: https://developers.hesab.com/dashboard/developer/docs

const HESAB_API_KEY = process.env['HESAB_API_KEY'] || 'ZTNlMWUyNmEtNGFmMi00ZGY2LWFlYWMtY2QyY2MzOTVjMTQ3X19hY2EzN2VkMDgzNzE3NDhkN2RlMg==';

// Correct API endpoint from documentation
const HESAB_API_ENDPOINT = 'https://api.hesab.com/api/v1/payment/create-session';

export interface HesabPaymentItem {
  id: string; // Required by Hesab API
  name: string;
  price: number;
  quantity: number;
}

export interface HesabPaymentRequest {
  items: HesabPaymentItem[];
  email: string;
  order_id?: string; // ADD: Order reference for webhook tracking
}

export interface HesabPaymentResponse {
  success: boolean;
  payment_url?: string;
  session_id?: string;
  message?: string;
  error?: string;
  temp_order_id?: string; // ADD: To pass temp order reference back
}

export interface HesabWebhookPayload {
  type: 'paymentSuccess';
  data: {
    success: boolean;
    message: string;
    transaction_id: string;
    [key: string]: any;
  };
}

// Create payment session using official API structure
export async function createHesabPayment(paymentData: HesabPaymentRequest): Promise<HesabPaymentResponse> {
  try {
    console.log('Creating Hesab payment session with official API structure');
    console.log('Endpoint:', HESAB_API_ENDPOINT);
    console.log('Payment data:', {
      ...paymentData,
      order_id: paymentData.order_id ? `${paymentData.order_id.substring(0, 10)}...` : 'not provided'
    });

    const headers = {
      'Authorization': `API-KEY ${HESAB_API_KEY}`,
      'accept': 'application/json',
      'Content-Type': 'application/json'
    };

    const payload = {
      items: paymentData.items,
      email: paymentData.email,
      // ADD: Include order_id if provided (this is the temp order reference)
      ...(paymentData.order_id && { order_id: paymentData.order_id })
    };

    console.log('Request headers:', {
      'Authorization': `API-KEY ${HESAB_API_KEY.substring(0, 10)}...`,
      'accept': 'application/json',
      'Content-Type': 'application/json'
    });
    console.log('Request payload:', {
      ...payload,
      order_id: payload.order_id ? `${payload.order_id.substring(0, 10)}...` : 'not included'
    });

    const response = await fetch(HESAB_API_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
        return {
          success: false,
          error: 'API returned HTML instead of JSON - likely authentication or endpoint error',
          message: responseText.substring(0, 200)
        };
      }
      
      return {
        success: false,
        error: 'Invalid JSON response',
        message: responseText.substring(0, 200)
      };
    }

    if (response.status === 200) {
      console.log('Payment session created successfully:', result);
      return {
        success: true,
        payment_url: result.payment_url || result.checkout_url || result.url,
        session_id: result.session_id || result.id,
        message: result.message || 'Payment session created successfully',
        temp_order_id: result.temp_order_id || result.id
      };
    } else {
      console.error('API Error Response:', result);
      return {
        success: false,
        error: result.error || `HTTP Error: ${response.status}`,
        message: result.message || response.statusText
      };
    }

  } catch (error) {
    console.error('Hesab payment creation error:', error);
    return {
      success: false,
      error: 'Request Exception',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Handle paymentSuccess event from frontend
export function handlePaymentSuccessEvent(eventData: any) {
  console.log('Payment success event received:', eventData);
  
  if (eventData.type === 'paymentSuccess' && eventData.data) {
    return {
      success: eventData.data.success,
      transaction_id: eventData.data.transaction_id,
      message: eventData.data.message
    };
  }
  
  return null;
}

// Test API connectivity with correct endpoint
export async function testHesabConnection(): Promise<{ success: boolean; message: string; endpoint?: string }> {
  try {
    console.log(`Testing Hesab API endpoint: ${HESAB_API_ENDPOINT}`);
    
    // Test with minimal payload to check connectivity
    const testPayload = {
      items: [{ name: 'Test Item', price: 100, quantity: 1 }],
      email: 'test@example.com'
    };

    const response = await fetch(HESAB_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `API-KEY ${HESAB_API_KEY}`,
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`API responded with status: ${response.status}`);
    
    const responseText = await response.text();
    console.log(`API response preview:`, responseText.substring(0, 200));

    if (response.status === 200) {
      return {
        success: true,
        message: `Successfully connected to Hesab API`,
        endpoint: HESAB_API_ENDPOINT
      };
    } else if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        message: `Authentication failed - please check your API key`,
        endpoint: HESAB_API_ENDPOINT
      };
    } else {
      return {
        success: false,
        message: `API returned status ${response.status}: ${responseText.substring(0, 100)}`,
        endpoint: HESAB_API_ENDPOINT
      };
    }

  } catch (error) {
    console.error('Connection test failed:', error);
    return {
      success: false,
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Convert our order data to Hesab items format
export function convertOrderToHesabItems(orderItems: any[]): HesabPaymentItem[] {
  return orderItems.map((item, index) => ({
    id: item.product_id || item.id || `item-${index + 1}`, // Use product ID or generate one
    name: item.name || item.title || 'Product',
    price: Math.round(item.price * (item.quantity || 1)), // Total price for this item
    quantity: 1 // Hesab expects quantity 1 with total price
  }));
}

// Generate order reference for tracking
export function generateHesabOrderRef(orderId: string): string {
  return `ORDER-${orderId}-${Date.now()}`;
}

// Parse order ID from Hesab order reference
export function parseHesabOrderRef(orderRef: string): string | null {
  try {
    // Format: ORDER-{orderId}-{timestamp} or TEMP-{timestamp}-{random}
    const parts = orderRef.split('-');
    if (parts.length >= 3) {
      if (parts[0] === 'ORDER') {
        return parts[1] || null; // Return the order ID part
      } else if (parts[0] === 'TEMP') {
        return orderRef; // Return the full temp order reference
      }
    }
    return orderRef; // Return as-is if format is unknown
  } catch (error) {
    console.error('Failed to parse order reference:', error);
    return null;
  }
}

// Alternative endpoints (keeping for fallback, but main one should work)
export const HESAB_ALTERNATIVE_ENDPOINTS = [
  'https://api.hesab.com/api/v1/payment/create-session'
]; 