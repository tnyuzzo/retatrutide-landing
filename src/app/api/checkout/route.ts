import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// ── Rate Limiting (in-memory, per IP, 5 req/min) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }

    entry.count++;
    return entry.count > RATE_LIMIT_MAX;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
        if (now > entry.resetAt) rateLimitMap.delete(ip);
    }
}, 5 * 60_000);

// ── Validation Schema ──
const ALLOWED_CRYPTOS = ['btc', 'eth', 'xmr', 'sol', 'usdt', 'usdc', 'xrp'] as const;

const checkoutSchema = z.object({
    email: z.string().email('Invalid email address').max(255).transform(v => v.toLowerCase().trim()),
    shipping_address: z.object({
        full_name: z.string().min(2).max(200),
        address_line_1: z.string().min(3).max(500),
        address_line_2: z.string().max(500).optional().default(''),
        city: z.string().min(1).max(200),
        postal_code: z.string().min(2).max(20),
        country: z.string().min(2).max(100),
        phone: z.string().max(30).optional().default(''),
    }).optional().default({}),
    quantity: z.coerce.number().int().min(1).max(10).default(1),
    crypto_currency: z.enum(ALLOWED_CRYPTOS).default('btc'),
});

// ── Crypto Ticker Mapping ──
const CRYPTO_TICKERS: Record<string, string> = {
    btc: 'btc',
    eth: 'eth',
    xmr: 'xmr',
    sol: 'sol',
    usdt: 'trc20/usdt',
    usdc: 'erc20/usdc',
    xrp: 'bep20/xrp',
};

const WALLET_ENV_KEYS: Record<string, string> = {
    btc: 'CRYPTAPI_BTC_WALLET',
    eth: 'CRYPTAPI_ETH_WALLET',
    xmr: 'CRYPTAPI_XMR_WALLET',
    sol: 'CRYPTAPI_SOL_WALLET',
    'trc20/usdt': 'CRYPTAPI_USDT_TRC20_WALLET',
    'erc20/usdc': 'CRYPTAPI_USDC_WALLET',
    'bep20/xrp': 'CRYPTAPI_XRP_WALLET',
};

export async function POST(req: Request) {
    try {
        // Rate limiting
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || req.headers.get('x-real-ip')
            || 'unknown';

        if (isRateLimited(ip)) {
            return NextResponse.json(
                { error: 'Too many requests. Please wait a minute.' },
                { status: 429 }
            );
        }

        // Validate input
        const body = await req.json().catch(() => ({}));
        const parsed = checkoutSchema.safeParse(body);

        if (!parsed.success) {
            const errors = parsed.error.flatten().fieldErrors;
            return NextResponse.json(
                { error: 'Validation failed', details: errors },
                { status: 400 }
            );
        }

        const { email, shipping_address, quantity, crypto_currency } = parsed.data;

        // ── Price Calculation ──
        const basePrice = 197;
        let discountPercent = 0;
        if (quantity > 2) {
            discountPercent = Math.min((quantity - 2) * 5, 40);
        }
        const totalBase = basePrice * quantity;
        const fiat_amount = totalBase - (totalBase * (discountPercent / 100));

        const items = [{ sku: 'RET-KIT-1', name: 'Retatrutide 10mg', quantity, price: fiat_amount }];

        // ── CryptAPI Integration ──
        const referenceId = uuidv4();
        const cryptapiTicker = CRYPTO_TICKERS[crypto_currency] || 'btc';
        const walletEnvKey = WALLET_ENV_KEYS[cryptapiTicker];
        const targetAddress = walletEnvKey ? process.env[walletEnvKey] : undefined;

        if (!targetAddress) {
            console.error(`Missing wallet for ${cryptapiTicker} (env: ${walletEnvKey})`);
            return NextResponse.json({ error: 'Payment method temporarily unavailable' }, { status: 503 });
        }

        // Build callback URL with webhook secret
        let baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').trim();
        if (!baseUrl) {
            const host = req.headers.get('host') || 'localhost:3000';
            const proto = req.headers.get('x-forwarded-proto') || 'https';
            baseUrl = `${proto}://${host}`;
        }
        baseUrl = baseUrl.replace(/\/+$/, '');
        if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;

        const webhookSecret = process.env.WEBHOOK_SECRET || '';
        const callbackUrl = `${baseUrl}/api/webhooks/cryptapi?order_id=${referenceId}&secret=${webhookSecret}`;

        // 1. Generate Payment Address via CryptAPI
        const cryptapiUrl = `https://api.cryptapi.io/${cryptapiTicker}/create/?address=${targetAddress}&callback=${encodeURIComponent(callbackUrl)}&pending=0`;
        const cryptapiRes = await fetch(cryptapiUrl);
        const cryptapiData = await cryptapiRes.json();

        if (cryptapiData.status !== 'success') {
            console.error("CryptAPI Error:", cryptapiData);
            return NextResponse.json({ error: 'Failed to generate crypto address' }, { status: 500 });
        }

        const paymentAddress = cryptapiData.address_in;

        // 2. Fetch Real Exchange Rate
        let calculatedCryptoAmount = 0;
        try {
            const infoUrl = `https://api.cryptapi.io/${cryptapiTicker}/info/`;
            const infoRes = await fetch(infoUrl);
            const infoData = await infoRes.json();

            if (infoData.status === 'success' && infoData.prices?.EUR) {
                const eurPricePerCoin = parseFloat(infoData.prices.EUR);
                const exactCryptoAmount = fiat_amount / eurPricePerCoin;
                // 1% buffer to account for volatility
                calculatedCryptoAmount = parseFloat((exactCryptoAmount * 1.01).toFixed(8));
            } else {
                throw new Error("Failed to get price info");
            }
        } catch (e) {
            console.error("Exchange rate error:", e);
            return NextResponse.json({ error: 'Unable to calculate exchange rate. Please try again.' }, { status: 503 });
        }

        // 3. Insert Order into Supabase (using service role — bypasses RLS)
        const { data: orderData, error: dbError } = await supabaseAdmin
            .from('orders')
            .insert([
                {
                    reference_id: referenceId,
                    status: 'pending',
                    fiat_amount,
                    crypto_currency: crypto_currency.toUpperCase(),
                    crypto_amount: calculatedCryptoAmount,
                    email,
                    shipping_address,
                    payment_url: paymentAddress,
                    items,
                }
            ])
            .select()
            .single();

        if (dbError) {
            console.error("Supabase Insert Error:", dbError);
            return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            reference_id: referenceId,
            payment_url: paymentAddress,
            crypto_amount: calculatedCryptoAmount,
            order: orderData,
        });

    } catch (error) {
        console.error("Checkout API error:", error);
        return NextResponse.json({ error: 'Server error processing checkout' }, { status: 500 });
    }
}
