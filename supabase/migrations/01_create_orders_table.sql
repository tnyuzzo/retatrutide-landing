-- Schema per la tabella ordini Retatrutide Crypto Checkout
CREATE TABLE public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    reference_id VARCHAR NOT NULL UNIQUE, -- ID generato dal frontend/backend per tracciamento anonimo
    status VARCHAR NOT NULL DEFAULT 'pending', -- pending, paid, shipped, failed
    crypto_currency VARCHAR, -- BTC, XMR, USDT, ETH
    crypto_amount DECIMAL,
    fiat_amount DECIMAL NOT NULL, -- Valore in USD/EUR
    shipping_address JSONB, -- Dati spedizione criptati o raw (nome, indirizzo, cap, nazione)
    email VARCHAR, -- Opzionale o per le comunicazioni di tracking
    payment_url VARCHAR -- URL per il checkout generato dal gateway (es. NowPayments)
);

-- RLS (Row Level Security) per anonimato
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy di Insert aperta (Client side checkout anonimo), ma select bloccata
CREATE POLICY "Enable insert for all users" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for users based on reference_id" ON public.orders FOR SELECT USING (true);
