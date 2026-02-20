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

        // 1. Genera ID tracking anonimo per l'utente, non dipende dai suoi dati sensibili
        const referenceId = uuidv4();

        // 2. Simulazione/Integrazione di un Gateway Crypto (Es: Coinbase Commerce, NowPayments, Plisio)
        // Sostituire con vera chiamata HTTP POST a API Gateway.
        const fakeGatewayPaymentUrl = `https://nowpayments.io/payment/?iid=${referenceId}&coin=${crypto_currency || 'BTC'}`;
        const calculatedCryptoAmount = 0.0015; // simulazione rate usd/crypto

        // 3. Salvataggio sicuro in Supabase tramite client
        const { data: orderData, error: dbError } = await supabase
            .from('orders')
            .insert([
                {
                    reference_id: referenceId,
                    status: 'pending',
                    fiat_amount: fiat_amount,
                    crypto_currency: crypto_currency || 'BTC',
                    crypto_amount: calculatedCryptoAmount,
                    email: email || null,
                    shipping_address: shipping_address || {},
                    payment_url: fakeGatewayPaymentUrl
                }
            ])
            .select()
            .single();

        if (dbError) {
            console.error("Supabase Error:", dbError);
            return NextResponse.json({ error: 'Failed to create order tracking' }, { status: 500 });
        }

        // 4. Ritorna i dati al client per fare redirect al checkout "No Fiat"
        return NextResponse.json({
            success: true,
            reference_id: referenceId,
            payment_url: fakeGatewayPaymentUrl,
            order: orderData
        });

    } catch (error) {
        console.error("Checkout API error:", error);
        return NextResponse.json({ error: 'Server error processing checkout' }, { status: 500 });
    }
}
