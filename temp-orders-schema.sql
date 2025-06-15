-- Temporary Orders Table (for storing cart data before payment confirmation)
CREATE TABLE IF NOT EXISTS temp_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    temp_order_ref TEXT NOT NULL UNIQUE,
    cart_data JSONB NOT NULL,
    shipping_address JSONB NOT NULL,
    customer_notes TEXT DEFAULT '',
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '2 hours')
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_temp_orders_temp_ref ON temp_orders(temp_order_ref);
CREATE INDEX IF NOT EXISTS idx_temp_orders_user_id ON temp_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_temp_orders_expires_at ON temp_orders(expires_at);

-- RLS Policies
ALTER TABLE temp_orders ENABLE ROW LEVEL SECURITY;

-- Users can only see their own temporary orders
CREATE POLICY "Users can view own temp orders" ON temp_orders
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own temporary orders
CREATE POLICY "Users can create own temp orders" ON temp_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can access all temp orders (for webhook processing)
CREATE POLICY "Service role can access all temp orders" ON temp_orders
    FOR ALL USING (auth.role() = 'service_role');

-- Auto-cleanup function for expired temporary orders
CREATE OR REPLACE FUNCTION cleanup_expired_temp_orders()
RETURNS void AS $$
BEGIN
    DELETE FROM temp_orders WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup every hour (you can set this up as a cron job)
-- This is just the function, you'll need to set up the actual scheduling 