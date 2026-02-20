import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const order_id = searchParams.get('order_id');
        const pending = searchParams.get('pending');
        const value_forwarded_coin = searchParams.get('value_forwarded_coin');

        // CryptAPI always requires *ok* to acknowledge receipt
        if (!order_id) {
            return new NextResponse('*ok*', { status: 200 });
        }

        if (pending === '0') {
            // Pagamento confermato in rete
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    status: 'paid',
                    crypto_amount: value_forwarded_coin ? parseFloat(value_forwarded_coin) : undefined
                })
                .eq('reference_id', order_id);

            if (updateError) {
                console.error("Webhook Supabase Update Error:", updateError);
            }
        }

        return new NextResponse('*ok*', { status: 200 });

    } catch (error) {
        console.error("CryptAPI Webhook error:", error);
        return new NextResponse('*ok*', { status: 200 });
    }
}
