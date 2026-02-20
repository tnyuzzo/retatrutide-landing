import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, shipping_address, fiat_amount, crypto_currency } = body;

        if (!fiat_amount || fiat_amount <= 0) {
            return NextResponse.json({ error: 'Invalid order amount' }, { status: 400 });
        }

        const referenceId = uuidv4();
        const coin = crypto_currency ? crypto_currency.toLowerCase() : 'btc';

        let cryptapiTicker = coin;
        if (coin === 'usdt') {
            cryptapiTicker = 'trc20/usdt';
        }

        const targetWalletEnvs: Record<string, string | undefined> = {
            'btc': process.env.CRYPTAPI_BTC_WALLET,
            'xmr': process.env.CRYPTAPI_XMR_WALLET,
            'trc20/usdt': process.env.CRYPTAPI_USDT_TRC20_WALLET,
            'erc20/usdt': process.env.CRYPTAPI_USDT_ERC20_WALLET,
        };

        const targetAddress = targetWalletEnvs[cryptapiTicker];
        const finalTargetAddress = targetAddress || 'dummy_address_for_testing_123';

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.get('host')}`;
        const callbackUrl = `${baseUrl}/api/webhooks/cryptapi?order_id=${referenceId}`;

        const cryptapiUrl = `https://api.cryptapi.io/${cryptapiTicker}/create/?address=${finalTargetAddress}&callback=${encodeURIComponent(callbackUrl)}&pending=0`;
        const cryptapiRes = await fetch(cryptapiUrl);
        const cryptapiData = await cryptapiRes.json();

        if (cryptapiData.status !== 'success') {
            console.error("CryptAPI Error:", cryptapiData);
            return NextResponse.json({ error: 'Failed to generate crypto address' }, { status: 500 });
        }

        const paymentAddress = cryptapiData.address_in;
        // Mocking the exchange rate for demo purposes
        const calculatedCryptoAmount = 0.0015;

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
                    payment_url: paymentAddress // Using this field to store the generated Crypto Address
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
            order: orderData
        });

    } catch (error) {
        console.error("Checkout API error:", error);
        return NextResponse.json({ error: 'Server error processing checkout' }, { status: 500 });
    }
}
