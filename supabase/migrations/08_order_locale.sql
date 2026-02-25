-- Save the customer's locale when they place an order
-- so we can send emails in their language.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS locale VARCHAR(5) DEFAULT 'en';
