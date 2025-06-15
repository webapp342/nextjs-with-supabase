// Cart and Checkout System Types

export interface Cart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
  // Joined product data
  product?: {
    id: string;
    name: string;
    image_urls: string[];
    price: number;
    compare_price?: number;
    brand?: string;
    category?: string;
  };
}

export interface CartWithItems extends Cart {
  cart_items: CartItem[];
  total_amount: number;
  total_items: number;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state?: string;
  zip_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  shipping_address_id: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  shipping_address?: Address;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
  // Joined product data
  product?: {
    id: string;
    name: string;
    image_urls: string[];
  };
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transaction_id?: string;
  gateway_response?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Form types for checkout process
export interface AddressFormData {
  full_name: string;
  phone_number: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state?: string;
  zip_code: string;
  country: string;
  is_default?: boolean;
}

export interface PaymentFormData {
  card_number: string;
  expiry_date: string;
  cvv: string;
  cardholder_name: string;
}

// API response types
export interface AddToCartRequest {
  product_id: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  cart_item_id: string;
  quantity: number;
}

export interface CreateOrderRequest {
  shipping_address_id: string;
  payment_method: string;
  notes?: string;
}

// Checkout step types
export type CheckoutStep = 'cart' | 'address' | 'payment' | 'confirmation';

export interface CheckoutState {
  step: CheckoutStep;
  cart: CartWithItems | null;
  selectedAddress: Address | null;
  paymentData: PaymentFormData | null;
  order: Order | null;
} 