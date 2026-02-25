-- Track actual crypto received from CryptAPI (after their 1% service fee + blockchain forwarding fee)
-- and the calculated fee in EUR for dashboard revenue reporting.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS crypto_amount_received DECIMAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gateway_fee_eur DECIMAL DEFAULT 0;

-- For existing paid orders where crypto_amount was already overwritten with received value,
-- we can't recover the original amount. gateway_fee_eur stays 0 for those.
COMMENT ON COLUMN orders.crypto_amount_received IS 'CryptAPI value_forwarded_coin — actual crypto that arrived in our wallet';
COMMENT ON COLUMN orders.gateway_fee_eur IS 'Estimated fee in EUR: CryptAPI 1% + blockchain forwarding fee';
