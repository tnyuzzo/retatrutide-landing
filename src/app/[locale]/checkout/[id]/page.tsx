import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { QRCodeSVG } from "qrcode.react";
import { Lock, CheckCircle, ArrowLeft, Shield, Package, MapPin, CreditCard } from "lucide-react";
import { CheckoutPoller } from "@/components/ui/CheckoutPoller";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const dynamic = 'force-dynamic';

export default async function CheckoutPage(props: {
    params: Promise<{ locale: string; id: string }>;
}) {
    const params = await props.params;
    const t = await getTranslations({ locale: params.locale, namespace: 'Index' });

    const supabase = getSupabaseAdmin();
    const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('reference_id', params.id)
        .single();

    if (!order) {
        return notFound();
    }

    // If already paid, show success screen with order summary
    if (order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') {
        const shipping = order.shipping_address || {};
        const items = order.items || [];
        const totalKits = items.reduce((s: number, i: { quantity?: number }) => s + (i.quantity || 1), 0);

        return (
            <main className="min-h-screen bg-brand-void text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-gold/5 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="z-10 max-w-md w-full flex flex-col items-center gap-6">
                    <CheckCircle className="w-16 h-16 text-brand-gold" />
                    <h1 className="text-3xl font-light text-brand-gold">{t('checkout_payment_received')}</h1>
                    <p className="text-white/60 text-sm text-center max-w-sm">{t('checkout_payment_received_desc')}</p>

                    {/* Order Summary Card */}
                    <div className="w-full glass-panel rounded-2xl border border-white/10 overflow-hidden">
                        {/* Order Number */}
                        <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                            <span className="text-xs text-white/50 uppercase tracking-widest">{t('checkout_order_number')}</span>
                            <span className="text-brand-gold font-mono font-medium text-lg">#{order.order_number || order.reference_id.slice(-8).toUpperCase()}</span>
                        </div>

                        <div className="p-6 flex flex-col gap-4">
                            {/* Product */}
                            <div className="flex items-start gap-3">
                                <Package className="w-4 h-4 text-white/40 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm text-white">Retatrutide 10mg × {totalKits}</p>
                                </div>
                            </div>

                            {/* Amount Paid */}
                            <div className="flex items-start gap-3">
                                <CreditCard className="w-4 h-4 text-white/40 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-xs text-white/50 mb-0.5">{t('checkout_amount_paid')}</p>
                                    <p className="text-sm text-white">{order.fiat_amount}€ <span className="text-white/40">({order.crypto_amount} {order.crypto_currency})</span></p>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-white/40 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-xs text-white/50 mb-0.5">{t('checkout_shipping_to')}</p>
                                    <p className="text-sm text-white">{shipping.full_name}</p>
                                    <p className="text-xs text-white/50">{shipping.address_line_1}{shipping.address_line_2 ? `, ${shipping.address_line_2}` : ''}</p>
                                    <p className="text-xs text-white/50">{shipping.postal_code} {shipping.city}, {shipping.country}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Guarantee */}
                    <div className="w-full p-4 rounded-xl border border-green-500/20 bg-green-500/5 flex flex-col items-center text-center gap-2">
                        <Shield className="w-6 h-6 text-green-400" />
                        <h4 className="text-sm font-medium text-white">{t('checkout_buyer_protection')}</h4>
                        <p className="text-xs text-white/60 leading-relaxed">{t('checkout_buyer_protection_desc')}</p>
                    </div>

                    <div className="flex gap-3">
                        <Link href={`/${params.locale}`} className="text-white/50 hover:text-white transition-colors border border-white/20 px-6 py-2 rounded-full text-sm">
                            {t('nav_home')}
                        </Link>
                        <Link href={`/${params.locale}/portal`} className="text-brand-gold hover:text-white transition-colors border border-brand-gold px-6 py-2 rounded-full text-sm">
                            {t('checkout_track_order')}
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-brand-void text-white font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Silent Client-Side Polling */}
            <CheckoutPoller referenceId={order.reference_id} />

            {/* Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-gold/5 blur-[120px] rounded-full pointer-events-none"></div>

            <Link href={`/${params.locale}`} className="absolute top-8 left-8 flex items-center gap-2 text-white/50 hover:text-brand-gold transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" /> {t('checkout_back')}
            </Link>

            <div className="z-10 max-w-md w-full glass-panel p-8 md:p-10 flex flex-col items-center text-center gap-6 rounded-3xl border border-white/10 relative overflow-hidden">

                <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center mb-2">
                    <Lock className="w-5 h-5 text-brand-gold" />
                </div>

                <div className="w-full">
                    <h1 className="text-2xl md:text-3xl font-light text-white mb-2">{t('checkout_complete_order')}</h1>
                    <p className="text-white/60 text-sm leading-relaxed">
                        {t('checkout_send_exact', { crypto: order.crypto_currency })}
                    </p>
                </div>

                <div className="w-full py-6 border-y border-white/10 flex flex-col gap-2">
                    <span className="text-xs text-brand-gold/60 uppercase tracking-widest">{t('checkout_exact_amount')}</span>
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

                <div className="flex items-center gap-3 mt-4 mb-6">
                    <div className="w-4 h-4 rounded-full border-2 border-brand-gold/50 border-t-brand-gold animate-spin"></div>
                    <p className="text-xs text-brand-gold/80">{t('checkout_waiting')}</p>
                </div>

                {/* Buyer Protection Box */}
                <div className="w-full mt-2 p-4 rounded-xl border border-green-500/20 bg-green-500/5 flex flex-col items-center text-center gap-2">
                    <Shield className="w-6 h-6 text-green-400" />
                    <h4 className="text-sm font-medium text-white">{t('checkout_buyer_protection')}</h4>
                    <p className="text-xs text-white/60 leading-relaxed">
                        {t('checkout_buyer_protection_desc')}
                    </p>
                </div>
            </div>
        </main>
    );
}
