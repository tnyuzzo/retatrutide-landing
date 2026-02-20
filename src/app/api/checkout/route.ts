import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, shipping_address, quantity = 1, crypto_currency } = body;

        const qty = parseInt(quantity.toString(), 10);
        if (isNaN(qty) || qty <= 0 || qty > 10) {
            return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
        }

        const basePrice = 197;
        let discountPercent = 0;
        if (qty > 2) {
            discountPercent = (qty - 2) * 5;
            if (discountPercent > 40) discountPercent = 40; // max 10 items
        }

        const totalBase = basePrice * qty;
        const fiat_amount = totalBase - (totalBase * (discountPercent / 100));

        const items = [{ sku: 'RET-KIT-1', name: 'Retatrutide 10mg', quantity: qty, price: fiat_amount }];

        const referenceId = uuidv4();
        const coin = crypto_currency ? crypto_currency.toLowerCase() : 'btc';

        let cryptapiTicker = coin;
        if (coin === 'usdt') cryptapiTicker = 'trc20/usdt';
        if (coin === 'usdc') cryptapiTicker = 'erc20/usdc';
        if (coin === 'xrp') cryptapiTicker = 'bep20/xrp'; // Using Binance-Peg XRP as native isn't always supported by CryptAPI

        const targetWalletEnvs: Record<string, string | undefined> = {
            'btc': process.env.CRYPTAPI_BTC_WALLET,
            'xmr': process.env.CRYPTAPI_XMR_WALLET,
            'eth': process.env.CRYPTAPI_ETH_WALLET,
            'sol': process.env.CRYPTAPI_SOL_WALLET,
            'bep20/xrp': process.env.CRYPTAPI_XRP_WALLET,
            'trc20/usdt': process.env.CRYPTAPI_USDT_TRC20_WALLET,
            'erc20/usdt': process.env.CRYPTAPI_USDT_ERC20_WALLET,
            'erc20/usdc': process.env.CRYPTAPI_USDC_WALLET,
        };

        const targetAddress = targetWalletEnvs[cryptapiTicker];
        const finalTargetAddress = targetAddress || 'dummy_address_for_testing_123';

        // Build a reliable base URL
        let baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').trim();
        if (!baseUrl) {
            const host = req.headers.get('host') || 'retatrutide-landing.vercel.app';
            const proto = req.headers.get('x-forwarded-proto') || 'https';
            baseUrl = `${proto}://${host}`;
        }
        // Ensure no trailing slash and starts with https://
        baseUrl = baseUrl.replace(/\/+$/, '');
        if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;

        const callbackUrl = `${baseUrl}/api/webhooks/cryptapi?order_id=${referenceId}`;

        // 1. Generate Payment Address
        const cryptapiUrl = `https://api.cryptapi.io/${cryptapiTicker}/create/?address=${finalTargetAddress}&callback=${encodeURIComponent(callbackUrl)}&pending=0`;
        const cryptapiRes = await fetch(cryptapiUrl);
        const cryptapiData = await cryptapiRes.json();

        if (cryptapiData.status !== 'success') {
            console.error("CryptAPI Error:", cryptapiData);
            return NextResponse.json({ error: 'Failed to generate crypto address' }, { status: 500 });
        }

        const paymentAddress = cryptapiData.address_in;

        // 2. Fetch Real Exchange Rate (EUR to Crypto)
        // CryptAPI /info/ endpoint returns the current prices of coins
        let calculatedCryptoAmount = 0;
        try {
            const infoUrl = `https://api.cryptapi.io/${cryptapiTicker}/info/`;
            const infoRes = await fetch(infoUrl);
            const infoData = await infoRes.json();

            if (infoData.status === 'success' && infoData.prices && infoData.prices.EUR) {
                const eurPricePerCoin = parseFloat(infoData.prices.EUR);
                // The amount of crypto needed is total EUR amount divided by the price of 1 coin in EUR
                // We add a tiny buffer (1%) to ensure underpayment doesn't happen due to volatility
                const exactCryptoAmount = fiat_amount / eurPricePerCoin;
                calculatedCryptoAmount = parseFloat((exactCryptoAmount * 1.01).toFixed(6));
            } else {
                throw new Error("Failed to get price info");
            }
        } catch (e) {
            console.error("Exchange rate error, falling back to mock:", e);
            calculatedCryptoAmount = 0.0015; // Fallback in case estimate API fails
        }

        // 3. Insert into Supabase (New Schema)
        const { data: orderData, error: dbError } = await supabase
            .from('orders')
            .insert([
                {
                    reference_id: referenceId,
                    status: 'pending',
                    fiat_amount: fiat_amount,
                    crypto_currency: coin.toUpperCase(),
                    crypto_amount: calculatedCryptoAmount,
                    email: email || null,
                    shipping_address: shipping_address || {},
                    payment_url: paymentAddress,
                    items: items || [{ sku: 'RET-KIT-1', name: 'Retatrutide Research Kit (Singolo)', quantity: 1, unit_price: fiat_amount }] // Default items fallback
                }
            ])
            .select()
            .single();

        if (dbError) {
            console.error("Supabase Error:", dbError);
            return NextResponse.json({ error: 'Failed to create order tracking' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            reference_id: referenceId,
            payment_url: paymentAddress,
            crypto_amount: calculatedCryptoAmount, // Pass back exactly what to show user
            order: orderData
        });

    } catch (error) {
        console.error("Checkout API error:", error);
        return NextResponse.json({ error: 'Server error processing checkout' }, { status: 500 });
    }
}
