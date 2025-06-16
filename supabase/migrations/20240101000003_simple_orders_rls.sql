-- Enable RLS for simple_orders table
ALTER TABLE public.simple_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own orders
CREATE POLICY "Users can view own orders" ON public.simple_orders
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy: Sellers and Admins can view all orders
CREATE POLICY "Sellers and admins can view all orders" ON public.simple_orders
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type IN ('seller', 'admin')
        )
    );

-- Policy: Users can insert their own orders
CREATE POLICY "Users can insert own orders" ON public.simple_orders
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policy: Sellers and Admins can update any order
CREATE POLICY "Sellers and admins can update orders" ON public.simple_orders
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type IN ('seller', 'admin')
        )
    );

-- Policy: Only admins can delete orders
CREATE POLICY "Admins can delete orders" ON public.simple_orders
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Enable RLS for simple_order_items table
ALTER TABLE public.simple_order_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view items of their own orders
CREATE POLICY "Users can view own order items" ON public.simple_order_items
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.simple_orders 
            WHERE simple_orders.id = simple_order_items.order_id 
            AND simple_orders.user_id = auth.uid()
        )
    );

-- Policy: Sellers and Admins can view all order items
CREATE POLICY "Sellers and admins can view all order items" ON public.simple_order_items
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type IN ('seller', 'admin')
        )
    );

-- Policy: Users can insert items for their own orders
CREATE POLICY "Users can insert own order items" ON public.simple_order_items
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.simple_orders 
            WHERE simple_orders.id = simple_order_items.order_id 
            AND simple_orders.user_id = auth.uid()
        )
    );

-- Policy: Sellers and Admins can insert any order items
CREATE POLICY "Sellers and admins can insert order items" ON public.simple_order_items
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.user_type IN ('seller', 'admin')
        )
    ); 