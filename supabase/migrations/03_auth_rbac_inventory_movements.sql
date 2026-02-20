-- Migration 03: Auth RBAC + Inventory Movements + Customers support
-- Run this in Supabase SQL Editor

-- =============================================
-- 1. Profiles table for RBAC
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'customer' CHECK (role IN ('super_admin', 'manager', 'warehouse', 'customer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function for RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('super_admin', 'manager', 'warehouse')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (is_admin());

CREATE POLICY "Super admins can update profiles"
    ON profiles FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- =============================================
-- 2. Inventory Movements table
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT NOT NULL DEFAULT 'RET-KIT-1',
    type TEXT NOT NULL CHECK (type IN ('add', 'remove', 'edit', 'sale')),
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reason TEXT,
    performed_by UUID REFERENCES auth.users(id),
    performed_by_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for inventory_movements
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view inventory movements"
    ON inventory_movements FOR SELECT
    USING (is_admin());

CREATE POLICY "Admins can insert inventory movements"
    ON inventory_movements FOR INSERT
    WITH CHECK (is_admin());

-- Service role can always insert (for webhook)
CREATE POLICY "Service role full access to inventory_movements"
    ON inventory_movements FOR ALL
    USING (auth.role() = 'service_role');

-- =============================================
-- 3. Ensure inventory record exists
-- =============================================
INSERT INTO inventory (sku, quantity)
VALUES ('RET-KIT-1', 100)
ON CONFLICT (sku) DO NOTHING;

-- =============================================
-- 4. Update orders RLS for admin access
-- =============================================
CREATE POLICY "Admins can view all orders"
    ON orders FOR SELECT
    USING (is_admin());

CREATE POLICY "Admins can update orders"
    ON orders FOR UPDATE
    USING (is_admin());
