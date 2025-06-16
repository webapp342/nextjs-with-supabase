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
export async function createHesabPayment(data: HesabPaymentRequest): Promise<HesabPaymentResponse> {
  try {
    console.log('Creating Hesab payment session with official API structure');
    console.log('Endpoint:', HESAB_API_ENDPOINT);
    
    // 🔧 IMPORTANT: Include order_id (temp_order_ref) in payload for webhook tracking
    const payloadData: any = {
      items: data.items,
      email: data.email
    };
    
    // Add temp order reference if provided - this is crucial for webhook matching
    if (data.order_id) {
      payloadData.order_id = data.order_id;
      console.log('✅ Including temp order reference for webhook tracking:', data.order_id);
    } else {
      console.warn('⚠️ No order_id provided - webhook may not be able to match this payment');
    }

    console.log('Payment data:', payloadData);

    const headers = {
      'Authorization': `API-KEY ${HESAB_API_KEY}`,
      'accept': 'application/json',
      'Content-Type': 'application/json'
    };

    console.log('Request headers:', {
      'Authorization': `API-KEY ${HESAB_API_KEY?.substring(0, 10)}...`,
      'accept': 'application/json',
      'Content-Type': 'application/json'
    });

    console.log('Request payload:', payloadData);

    const response = await fetch(HESAB_API_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(payloadData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    if (!response.ok) {
      console.error('Hesab API error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      return {
        success: false,
        error: `HTTP ${response.status}: ${responseText}`
      };
    }

    const result = JSON.parse(responseText);
    
    if (result.url) {
      return {
        success: true,
        payment_url: result.url,
        session_id: result.session_id,
        message: 'Payment session created successfully',
        temp_order_id: data.order_id // Return the temp order ID for reference
      };
    } else {
      console.error('Unexpected Hesab API response format:', result);
      return {
        success: false,
        error: 'Invalid response format from payment gateway'
      };
    }

  } catch (error) {
    console.error('Hesab payment creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
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