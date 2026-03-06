import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { QRCodeSVG } from "qrcode.react";
import { Lock, CheckCircle, ArrowLeft, Shield, Package, MapPin, CreditCard, AlertCircle, XCircle, Mail } from "lucide-react";
import { CheckoutPoller } from "@/components/ui/CheckoutPoller";
import { CopyAddressButton } from "@/components/ui/CopyAddressButton";
import { CopyAmountButton } from "@/components/ui/CopyAmountButton";
import { CheckoutCountdown } from "@/components/ui/CheckoutCountdown";
import { CheckoutTracker } from "@/components/ui/CheckoutTracker";
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

    // Handle expired or cancelled orders — don't show QR in loop
    if (order.status === 'expired' || order.status === 'cancelled') {
        const isExpired = order.status === 'expired';
        return (
            <main className="min-h-screen bg-brand-void text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <CheckoutTracker referenceId={order.reference_id} crypto={order.crypto_currency} fiatAmount={order.fiat_amount} status={order.status} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="z-10 max-w-md w-full flex flex-col items-center gap-6 text-center">
                    {isExpired
                        ? <AlertCircle className="w-14 h-14 text-yellow-400/80" />
                        : <XCircle className="w-14 h-14 text-red-400/80" />
                    }
                    <div>
                        <h1 className="text-2xl font-light text-white mb-2">
                            {isExpired ? t('checkout_order_expired') : t('checkout_order_cancelled')}
                        </h1>
                        <p className="text-white/50 text-sm leading-relaxed">{t('checkout_order_invalid_desc')}</p>
                    </div>
                    <Link
                        href={`/${params.locale}/order`}
                        className="bg-brand-gold text-brand-void font-semibold px-8 py-3 rounded-xl hover:bg-white transition-colors text-sm"
                    >
                        {t('checkout_create_new_order')}
                    </Link>
                    <Link href={`/${params.locale}`} className="text-white/40 hover:text-white/70 text-xs transition-colors">
                        {t('nav_home')}
                    </Link>
                </div>
            </main>
        );
    }

    // If already paid, show success screen with order summary
    if (order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') {
        const shipping = order.shipping_address || {};
        const items = order.items || [];
        const totalKits = items.reduce((s: number, i: { quantity?: number }) => s + (i.quantity || 1), 0);

        return (
            <main className="min-h-screen bg-brand-void text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <CheckoutTracker referenceId={order.reference_id} crypto={order.crypto_currency} fiatAmount={order.fiat_amount} status={order.status} />
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
        <main className="min-h-screen bg-brand-void text-white font-sans flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden">
            <CheckoutTracker referenceId={order.reference_id} crypto={order.crypto_currency} fiatAmount={order.fiat_amount} status={order.status} />
            <CheckoutPoller referenceId={order.reference_id} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-gold/5 blur-[120px] rounded-full pointer-events-none"></div>

            <Link href={`/${params.locale}`} className="absolute top-6 left-6 flex items-center gap-2 text-white/40 hover:text-brand-gold transition-colors text-sm z-10">
                <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="z-10 max-w-md w-full flex flex-col gap-4 py-16">

                {/* Header */}
                <div className="text-center mb-2">
                    <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center mx-auto mb-3">
                        <Lock className="w-5 h-5 text-brand-gold" />
                    </div>
                    <h1 className="text-2xl font-semibold text-white">{t('checkout_complete_order')}</h1>
                    <p className="text-white/50 text-sm mt-1">{t('checkout_send_exact', { crypto: order.crypto_currency })}</p>
                </div>

                {/* Save Reference — prominent, reassuring */}
                <div className="rounded-2xl border border-brand-gold/30 bg-brand-gold/5 p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs text-white/50 uppercase tracking-widest mb-1">{t('checkout_order_ref_label')}</p>
                            <p className="text-xl font-bold text-brand-gold font-mono tracking-wider">
                                #{order.order_number || order.reference_id.slice(-8).toUpperCase()}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5 text-brand-gold" />
                        </div>
                    </div>
                    <div className="h-px bg-brand-gold/15" />
                    <div className="flex items-start gap-2">
                        <Mail className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-green-300/80">{t('checkout_email_sent_hint')}</p>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">
                        {t('checkout_save_ref_hint')}
                        {' '}
                        <Link href={`/${params.locale}/portal`} className="text-brand-gold underline underline-offset-2 hover:text-brand-gold-light transition-colors">
                            {t('checkout_portal_link')}
                        </Link>
                    </p>
                </div>

                {/* STEP 1 — Amount */}
                <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-3 bg-white/5 border-b border-white/10">
                        <div className="w-7 h-7 rounded-full bg-brand-gold flex items-center justify-center text-brand-void font-bold text-sm shrink-0">1</div>
                        <span className="text-sm font-semibold text-white uppercase tracking-wide">{t('checkout_exact_amount')}</span>
                    </div>
                    <div className="py-8 px-6 text-center flex flex-col items-center gap-3">
                        <CopyAmountButton amount={order.crypto_amount} />
                        <div className="text-lg text-white/60 font-medium">
                            {order.crypto_currency}
                            {order.crypto_currency === 'USDT' && (
                                <span className="ml-2 text-sm text-white/40">(TRC20)</span>
                            )}
                        </div>
                    </div>
                    <div className="mx-4 mb-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-200/80">{t('checkout_amount_warning')}</p>
                    </div>
                </div>

                {/* STEP 2 — Copy Address */}
                <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-3 bg-white/5 border-b border-white/10">
                        <div className="w-7 h-7 rounded-full bg-brand-gold flex items-center justify-center text-brand-void font-bold text-sm shrink-0">2</div>
                        <span className="text-sm font-semibold text-white uppercase tracking-wide">{t('checkout_address_label')}</span>
                    </div>
                    <div className="p-4">
                        <CopyAddressButton
                            address={order.payment_url || ""}
                            labelCopy={t('checkout_copy_address')}
                            labelCopied={t('checkout_copy_address_done')}
                        />
                    </div>
                </div>

                {/* STEP 3 — QR (for wallet users) */}
                <details className="glass-panel rounded-2xl border border-white/10 overflow-hidden group">
                    <summary className="flex items-center gap-3 px-5 py-3 bg-white/5 border-b border-white/10 cursor-pointer list-none">
                        <span className="text-sm font-medium text-white/60 uppercase tracking-wide">{t('checkout_qr_label')}</span>
                    </summary>
                    <div className="flex justify-center p-6">
                        <div className="bg-white p-2 rounded-xl shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                            <QRCodeSVG value={order.payment_url || ""} size={220} level="H" includeMargin={false} />
                        </div>
                    </div>
                </details>

                {/* Status + Countdown */}
                <div className="flex flex-col items-center gap-4 py-3">
                    <CheckoutCountdown
                        createdAt={order.created_at}
                        labelValid={t('checkout_valid_for')}
                        labelExpires={t('checkout_expires_in')}
                        labelExpired={t('checkout_expired_label')}
                        className="text-base px-6 py-3"
                    />
                    <div className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full border-2 border-brand-gold/50 border-t-brand-gold animate-spin shrink-0"></div>
                        <p className="text-sm text-brand-gold/80 font-medium">{t('checkout_waiting')}</p>
                    </div>
                    <div className="text-xs text-white/40 text-center leading-relaxed italic max-w-xs px-2 flex flex-col gap-2">
                        <p>{t('checkout_detection_note', { crypto: order.crypto_currency })}</p>
                        <Link href={`/${params.locale}/portal`} className="not-italic text-brand-gold/60 hover:text-brand-gold underline underline-offset-2 transition-colors">
                            {t('checkout_portal_link')}
                        </Link>
                    </div>
                </div>

                {/* Buyer Protection */}
                <div className="w-full p-4 rounded-xl border border-green-500/20 bg-green-500/5 flex flex-col items-center text-center gap-2">
                    <Shield className="w-6 h-6 text-green-400" />
                    <h4 className="text-sm font-medium text-white">{t('checkout_buyer_protection')}</h4>
                    <p className="text-xs text-white/60 leading-relaxed">{t('checkout_buyer_protection_desc')}</p>
                </div>
            </div>
        </main>
    );
}
