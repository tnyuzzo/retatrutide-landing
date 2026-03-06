-- Website visitors table for Facebook CAPI server-side attribution
-- Persists UTM params, fbclid, _fbc server-side to survive adblockers/ITP/cookie deletion
-- Auto-cleanup via cron after 30 days

CREATE TABLE IF NOT EXISTS website_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT UNIQUE NOT NULL,
  -- Attribution (from UTM params + Facebook click)
  fbc TEXT,
  fbclid TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  campaign_id TEXT,
  adset_id TEXT,
  ad_id TEXT,
  placement TEXT,
  site_source_name TEXT,
  funnel TEXT,
  -- Client info (captured server-side)
  ip TEXT,
  user_agent TEXT,
  -- Progressive user data (updated as user fills forms)
  email TEXT,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  -- Event tracking for deduplication
  events_sent TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitors_visitor_id ON website_visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitors_created_at ON website_visitors(created_at);

-- Add visitor_id column to orders for linking visitor ↔ order
ALTER TABLE orders ADD COLUMN IF NOT EXISTS visitor_id TEXT;
