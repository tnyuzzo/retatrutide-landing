-- Cart recovery: track how many recovery emails have been sent per order
-- and when the last one was sent, so the cron can schedule 1h / 12h / 48h emails.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS recovery_emails_sent INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_recovery_email_at TIMESTAMPTZ;

-- Index for cart recovery cron: find pending orders that need a recovery email
CREATE INDEX IF NOT EXISTS idx_orders_recovery
    ON orders (status, recovery_emails_sent, created_at)
    WHERE status = 'pending' AND recovery_emails_sent < 3;
