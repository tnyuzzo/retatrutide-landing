-- Leads table: progressive capture of visitor data from order form
-- Used for marketing to visitors who don't complete checkout
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    country TEXT,
    city TEXT,
    locale TEXT,              -- browsing language (en, it, fr, etc.)
    converted BOOLEAN DEFAULT false,  -- true when order is placed
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for marketing queries
CREATE INDEX IF NOT EXISTS idx_leads_converted ON leads (converted) WHERE converted = false;
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at);

-- RLS: only service_role can read/write (API route uses supabaseAdmin)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Staff can view leads
CREATE POLICY "Staff can view leads"
    ON leads FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('super_admin', 'manager', 'seller')
            AND profiles.is_active = true
        )
    );

-- Service role has full access (for API upsert)
CREATE POLICY "Service role full access on leads"
    ON leads FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
