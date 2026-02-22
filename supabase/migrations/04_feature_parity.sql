-- Migration 04: Feature Parity with Forever Slim
-- Adds: customers, short_links, store_settings tables
-- Extends: orders, profiles, inventory_movements
-- Creates: RPCs for customer LTV

-- ============================================================
-- 1. NEW TABLES
-- ============================================================

-- Dedicated customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- Short links with click tracking
CREATE TABLE IF NOT EXISTS public.short_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    target_url TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_short_links_code ON public.short_links(code);

-- Key-value store settings
CREATE TABLE IF NOT EXISTS public.store_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- ============================================================
-- 2. EXTEND EXISTING TABLES
-- ============================================================

-- Orders: human-readable number, shipping cost, notes, seller ref, tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cost INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sent_by UUID REFERENCES auth.users(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_status TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_events JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number
    ON public.orders(order_number) WHERE order_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_sent_by
    ON public.orders(sent_by) WHERE sent_by IS NOT NULL;

-- Profiles: phone, pending removal workflow, invited_by, seller+manager roles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pending_removal BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS removal_requested_by UUID REFERENCES auth.users(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS removal_requested_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);

-- Update role constraint to include manager and seller
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('customer', 'super_admin', 'manager', 'seller', 'warehouse'));

-- Inventory movements: link to order, support refund type
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS order_id UUID;
ALTER TABLE public.inventory_movements DROP CONSTRAINT IF EXISTS inventory_movements_type_check;
ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_type_check
    CHECK (type IN ('add', 'remove', 'edit', 'sale', 'refund'));

-- ============================================================
-- 3. RLS POLICIES FOR NEW TABLES
-- ============================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Customers: service_role full access, staff can read
CREATE POLICY "Service role full access on customers"
    ON public.customers FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Staff can read customers"
    ON public.customers FOR SELECT
    USING (
        coalesce(
            current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role',
            'customer'
        ) IN ('super_admin', 'manager', 'warehouse', 'seller')
    );

-- Short links: anyone can read (for redirect), staff can insert, anyone can update clicks
CREATE POLICY "Anyone can read short links"
    ON public.short_links FOR SELECT
    USING (true);

CREATE POLICY "Staff can create short links"
    ON public.short_links FOR INSERT
    WITH CHECK (
        coalesce(
            current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role',
            'customer'
        ) IN ('super_admin', 'manager', 'seller')
    );

CREATE POLICY "Anyone can update short link clicks"
    ON public.short_links FOR UPDATE
    USING (true);

CREATE POLICY "Service role full access on short links"
    ON public.short_links FOR ALL
    USING (auth.role() = 'service_role');

-- Store settings: staff can read, super_admin can write
CREATE POLICY "Staff can read store settings"
    ON public.store_settings FOR SELECT
    USING (
        coalesce(
            current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role',
            'customer'
        ) IN ('super_admin', 'manager', 'warehouse', 'seller')
    );

CREATE POLICY "Super admin can manage store settings"
    ON public.store_settings FOR ALL
    USING (
        coalesce(
            current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role',
            'customer'
        ) = 'super_admin'
    );

CREATE POLICY "Service role full access on store settings"
    ON public.store_settings FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================
-- 4. RPC FUNCTIONS
-- ============================================================

-- Customer LTV with pagination and sorting
CREATE OR REPLACE FUNCTION public.get_customer_ltv(
    p_search TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_sort TEXT DEFAULT 'total_spent_desc'
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    total_spent NUMERIC,
    order_count BIGINT,
    first_purchase TIMESTAMPTZ,
    last_purchase TIMESTAMPTZ,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH customer_stats AS (
        SELECT
            c.id,
            c.email,
            c.full_name,
            c.phone,
            COALESCE(SUM(o.fiat_amount) FILTER (
                WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered')
            ), 0)::NUMERIC AS total_spent,
            COUNT(o.id) FILTER (
                WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered')
            )::BIGINT AS order_count,
            MIN(o.created_at) FILTER (
                WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered')
            ) AS first_purchase,
            MAX(o.created_at) FILTER (
                WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered')
            ) AS last_purchase,
            COUNT(*) OVER()::BIGINT AS total_count
        FROM public.customers c
        LEFT JOIN public.orders o ON LOWER(o.email) = LOWER(c.email)
        WHERE (
            p_search IS NULL
            OR c.email ILIKE '%' || p_search || '%'
            OR c.full_name ILIKE '%' || p_search || '%'
        )
        GROUP BY c.id, c.email, c.full_name, c.phone
    )
    SELECT * FROM customer_stats cs
    ORDER BY
        CASE WHEN p_sort = 'total_spent_desc' THEN cs.total_spent END DESC NULLS LAST,
        CASE WHEN p_sort = 'total_spent_asc' THEN cs.total_spent END ASC NULLS LAST,
        CASE WHEN p_sort = 'order_count_desc' THEN cs.order_count END DESC NULLS LAST,
        CASE WHEN p_sort = 'last_purchase_desc' THEN cs.last_purchase END DESC NULLS LAST
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- LTV aggregate metrics for dashboard
CREATE OR REPLACE FUNCTION public.get_ltv_aggregates()
RETURNS TABLE (
    total_customers BIGINT,
    avg_ltv NUMERIC,
    repeat_purchase_rate NUMERIC,
    avg_orders_per_customer NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT
            c.id AS customer_id,
            COALESCE(SUM(o.fiat_amount) FILTER (
                WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered')
            ), 0) AS customer_ltv,
            COUNT(o.id) FILTER (
                WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered')
            ) AS customer_orders
        FROM public.customers c
        LEFT JOIN public.orders o ON LOWER(o.email) = LOWER(c.email)
        GROUP BY c.id
    )
    SELECT
        COUNT(*)::BIGINT AS total_customers,
        ROUND(AVG(customer_ltv), 2)::NUMERIC AS avg_ltv,
        ROUND(
            COUNT(*) FILTER (WHERE customer_orders > 1)::NUMERIC /
            NULLIF(COUNT(*) FILTER (WHERE customer_orders > 0), 0)::NUMERIC * 100,
            1
        )::NUMERIC AS repeat_purchase_rate,
        ROUND(AVG(customer_orders) FILTER (WHERE customer_orders > 0), 1)::NUMERIC AS avg_orders_per_customer
    FROM stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update helper functions to include new roles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN coalesce(
        current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role',
        'customer'
    ) IN ('super_admin', 'manager', 'warehouse');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
BEGIN
    RETURN coalesce(
        current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role',
        'customer'
    ) IN ('super_admin', 'manager', 'seller', 'warehouse');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- 5. SEED DATA
-- ============================================================

INSERT INTO public.store_settings (key, value) VALUES
    ('store_name', '"Aura Peptides"'),
    ('store_email', '"admin@aurapeptides.eu"'),
    ('low_stock_threshold', '20'),
    ('available_carriers', '["BRT","GLS","SDA","DHL","UPS","POSTE","FEDEX"]')
ON CONFLICT (key) DO NOTHING;
