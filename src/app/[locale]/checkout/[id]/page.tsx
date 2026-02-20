import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";
import { Lock, CheckCircle, ArrowLeft } from "lucide-react";
import { CheckoutPoller } from "@/components/ui/CheckoutPoller";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const dynamic = 'force-dynamic';

export default async function CheckoutPage(props: {
    params: Promise<{ locale: string; id: string }>;
}) {
    const params = await props.params;
    const t = await getTranslations({ locale: params.locale, namespace: 'Index' });

    const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('reference_id', params.id)
        .single();

    if (!order) {
        return notFound();
    }

    // Se l'ordine è già pagato, mostra una schermata di successo
    if (order.status === 'paid' || order.status === 'shipped') {
        return (
            <main className="min-h-screen bg-brand-void text-white flex flex-col items-center justify-center p-6 text-center">
                <CheckCircle className="w-16 h-16 text-brand-gold mb-6" />
                <h1 className="text-3xl font-light text-brand-gold mb-2">Pagamento Ricevuto</h1>
                <p className="text-white/60 mb-8 max-w-sm">
                    Il tuo ordine {order.reference_id.split('-')[0].toUpperCase()} è stato confermato ed è in lavorazione. Riceverai presto aggiornamenti.
                </p>
                <Link href={`/${params.locale}`} className="text-brand-gold hover:text-white transition-colors border border-brand-gold px-6 py-2 rounded-full text-sm">
                    Torna alla Home
                </Link>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-brand-void text-white font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Polling Silenzioso in Client-Side */}
            <CheckoutPoller referenceId={order.reference_id} />

            {/* Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-gold/5 blur-[120px] rounded-full pointer-events-none"></div>

            <Link href={`/${params.locale}`} className="absolute top-8 left-8 flex items-center gap-2 text-white/50 hover:text-brand-gold transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" /> {t('nav_home') || 'Indietro'}
            </Link>

            <div className="z-10 max-w-md w-full glass-panel p-8 md:p-10 flex flex-col items-center text-center gap-6 rounded-3xl border border-white/10 relative overflow-hidden">

                <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center mb-2">
                    <Lock className="w-5 h-5 text-brand-gold" />
                </div>

                <div className="w-full">
                    <h1 className="text-2xl md:text-3xl font-light text-white mb-2">Completa l'Ordine</h1>
                    <p className="text-white/60 text-sm leading-relaxed">
                        Invia esattamente l'importo indicato all'indirizzo {order.crypto_currency} qui sotto. Non ricaricare la pagina.
                    </p>
                </div>

                <div className="w-full py-6 border-y border-white/10 flex flex-col gap-2">
                    <span className="text-xs text-brand-gold/60 uppercase tracking-widest">Importo Esatto Da Inviare</span>
                    <div className="text-4xl font-light text-brand-gold flex items-center justify-center gap-2">
                        <span>{order.crypto_amount}</span>
                        <span className="text-xl text-white/50">{order.crypto_currency}</span>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                    <QRCodeSVG value={order.payment_url || ""} size={200} level="H" includeMargin={true} />
                </div>

                <div className="w-full flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5 hover:border-brand-gold/30 transition-colors">
                    <span className="font-mono text-xs md:text-sm truncate text-white/70 tracking-tight select-all">
                        {order.payment_url}
                    </span>
                </div>

                <div className="flex items-center gap-3 mt-4">
                    <div className="w-4 h-4 rounded-full border-2 border-brand-gold/50 border-t-brand-gold animate-spin"></div>
                    <p className="text-xs text-brand-gold/80">In attesa di transazione sulla rete...</p>
                </div>
            </div>
        </main>
    );
}
