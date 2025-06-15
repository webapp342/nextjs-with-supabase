-- Basitleştirilmiş Sipariş Sistemi Şeması
-- Bu şema daha anlaşılır ve yönetilebilir bir yapı sunar

-- 1. Siparişler tablosu (ana tablo)
CREATE TABLE IF NOT EXISTS simple_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Temel bilgiler
    order_number varchar(50) UNIQUE NOT NULL,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    
    -- Sipariş durumu (basit enum)
    status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    
    -- Fiyat bilgileri
    subtotal decimal(10,2) NOT NULL,
    shipping_cost decimal(10,2) DEFAULT 0,
    tax_amount decimal(10,2) DEFAULT 0,
    total_amount decimal(10,2) NOT NULL,
    
    -- Teslimat bilgileri (JSON olarak saklayarak basitleştiriyoruz)
    shipping_address jsonb NOT NULL,
    
    -- Ödeme bilgileri
    payment_method varchar(50),
    payment_status varchar(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    
    -- Notlar
    customer_notes text,
    admin_notes text,
    
    -- Zaman damgaları
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Sipariş ürünleri tablosu
CREATE TABLE IF NOT EXISTS simple_order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES simple_orders(id) ON DELETE CASCADE,
    
    -- Ürün bilgileri (snapshot olarak saklıyoruz)
    product_id uuid REFERENCES products(id),
    product_name varchar(255) NOT NULL, -- Ürün adı değişirse sipariş etkilenmesin
    product_image_url text,
    
    -- Fiyat ve miktar
    unit_price decimal(10,2) NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    total_price decimal(10,2) NOT NULL,
    
    created_at timestamptz DEFAULT now()
);

-- 3. Sipariş durumu geçmişi (opsiyonel - takip için)
CREATE TABLE IF NOT EXISTS simple_order_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES simple_orders(id) ON DELETE CASCADE,
    
    old_status varchar(20),
    new_status varchar(20) NOT NULL,
    changed_by uuid REFERENCES auth.users(id),
    notes text,
    
    created_at timestamptz DEFAULT now()
);

-- İndeksler (performans için)
CREATE INDEX IF NOT EXISTS idx_simple_orders_user_id ON simple_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_simple_orders_status ON simple_orders(status);
CREATE INDEX IF NOT EXISTS idx_simple_orders_created_at ON simple_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_simple_order_items_order_id ON simple_order_items(order_id);

-- RLS Politikaları
ALTER TABLE simple_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE simple_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE simple_order_status_history ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi siparişlerini görebilir
CREATE POLICY "Users can view own orders" ON simple_orders
    FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar sipariş oluşturabilir
CREATE POLICY "Users can create orders" ON simple_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Adminler tüm siparişleri görebilir ve güncelleyebilir
CREATE POLICY "Admins can view all orders" ON simple_orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Sipariş ürünleri için politikalar
CREATE POLICY "Users can view own order items" ON simple_order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM simple_orders 
            WHERE simple_orders.id = simple_order_items.order_id 
            AND simple_orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create order items" ON simple_order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM simple_orders 
            WHERE simple_orders.id = simple_order_items.order_id 
            AND simple_orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all order items" ON simple_order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Durum geçmişi politikaları
CREATE POLICY "Users can view own order history" ON simple_order_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM simple_orders 
            WHERE simple_orders.id = simple_order_status_history.order_id 
            AND simple_orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage order history" ON simple_order_status_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Trigger: updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_simple_orders_updated_at 
    BEFORE UPDATE ON simple_orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Durum değişikliği geçmişi
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO simple_order_status_history (order_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_simple_order_status_change
    AFTER UPDATE ON simple_orders
    FOR EACH ROW EXECUTE FUNCTION log_order_status_change(); 