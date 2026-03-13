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
            <main className="min-h-screen bg-t-bg text-t-text flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <CheckoutTracker referenceId={order.reference_id} crypto={order.crypto_currency} fiatAmount={order.fiat_amount} status={order.status} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="z-10 max-w-md w-full flex flex-col items-center gap-6 text-center">
                    {isExpired
                        ? <AlertCircle className="w-14 h-14 text-yellow-400/80" />
                        : <XCircle className="w-14 h-14 text-red-400/80" />
                    }
                    <div>
                        <h1 className="text-2xl font-light text-t-text mb-2">
                            {isExpired ? t('checkout_order_expired') : t('checkout_order_cancelled')}
                        </h1>
                        <p className="text-t-text-3 text-sm leading-relaxed">{t('checkout_order_invalid_desc')}</p>
                    </div>
                    <Link
                        href={`/${params.locale}/order`}
                        className="bg-t-btn text-t-btn-text font-semibold px-8 py-3 rounded-xl hover:bg-white transition-colors text-sm"
                    >
                        {t('checkout_create_new_order')}
                    </Link>
                    <Link href={`/${params.locale}`} className="text-t-text-4 hover:text-t-text-2 text-xs transition-colors">
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
            <main className="min-h-screen bg-t-bg text-t-text flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <CheckoutTracker referenceId={order.reference_id} crypto={order.crypto_currency} fiatAmount={order.fiat_amount} status={order.status} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-t-accent/5 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="z-10 max-w-md w-full flex flex-col items-center gap-6">
                    <CheckCircle className="w-16 h-16 text-t-accent" />
                    <h1 className="text-3xl font-light text-t-accent">{t('checkout_payment_received')}</h1>
                    <p className="text-t-text-2 text-sm text-center max-w-sm">{t('checkout_payment_received_desc')}</p>

                    {/* Order Summary Card */}
                    <div className="w-full glass-panel rounded-2xl border border-t-border overflow-hidden">
                        {/* Order Number */}
                        <div className="px-6 py-4 border-b border-t-border bg-t-bg-subtle flex justify-between items-center">
                            <span className="text-xs text-t-text-3 uppercase tracking-widest">{t('checkout_order_number')}</span>
                            <span className="text-t-accent font-mono font-medium text-lg">#{order.order_number || order.reference_id.slice(-8).toUpperCase()}</span>
                        </div>

                        <div className="p-6 flex flex-col gap-4">
                            {/* Product */}
                            <div className="flex items-start gap-3">
                                <Package className="w-4 h-4 text-t-text-4 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm text-t-text">Retatrutide 10mg × {totalKits}</p>
                                </div>
                            </div>

                            {/* Amount Paid */}
                            <div className="flex items-start gap-3">
                                <CreditCard className="w-4 h-4 text-t-text-4 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-xs text-t-text-3 mb-0.5">{t('checkout_amount_paid')}</p>
                                    <p className="text-sm text-t-text">{order.fiat_amount}€ <span className="text-t-text-4">({order.crypto_amount} {order.crypto_currency})</span></p>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-t-text-4 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-xs text-t-text-3 mb-0.5">{t('checkout_shipping_to')}</p>
                                    <p className="text-sm text-t-text">{shipping.full_name}</p>
                                    <p className="text-xs text-t-text-3">{shipping.address_line_1}{shipping.address_line_2 ? `, ${shipping.address_line_2}` : ''}</p>
                                    <p className="text-xs text-t-text-3">{shipping.postal_code} {shipping.city}, {shipping.country}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Guarantee */}
                    <div className="w-full p-4 rounded-xl border border-t-success/20 bg-t-success-dim flex flex-col items-center text-center gap-2">
                        <Shield className="w-6 h-6 text-t-success" />
                        <h4 className="text-sm font-medium text-t-text">{t('checkout_buyer_protection')}</h4>
                        <p className="text-xs text-t-text-2 leading-relaxed">{t('checkout_buyer_protection_desc')}</p>
                    </div>

                    <div className="flex gap-3">
                        <Link href={`/${params.locale}`} className="text-t-text-3 hover:text-t-text transition-colors border border-t-border px-6 py-2 rounded-full text-sm">
                            {t('nav_home')}
                        </Link>
                        <Link href={`/${params.locale}/portal`} className="text-t-accent hover:text-t-text transition-colors border border-t-accent px-6 py-2 rounded-full text-sm">
                            {t('checkout_track_order')}
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-t-bg text-t-text font-sans flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden">
            <CheckoutTracker referenceId={order.reference_id} crypto={order.crypto_currency} fiatAmount={order.fiat_amount} status={order.status} />
            <CheckoutPoller referenceId={order.reference_id} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-t-accent/5 blur-[120px] rounded-full pointer-events-none"></div>

            <Link href={`/${params.locale}`} className="absolute top-6 left-6 flex items-center gap-2 text-t-text-4 hover:text-t-accent transition-colors text-sm z-10">
                <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="z-10 max-w-md w-full flex flex-col gap-4 py-16">

                {/* Header */}
                <div className="text-center mb-2">
                    <div className="w-12 h-12 rounded-full bg-t-accent/10 flex items-center justify-center mx-auto mb-3">
                        <Lock className="w-5 h-5 text-t-accent" />
                    </div>
                    <h1 className="text-2xl font-semibold text-t-text">{t('checkout_complete_order')}</h1>
                    <p className="text-t-text-3 text-sm mt-1">{t('checkout_send_exact', { crypto: order.crypto_currency })}</p>
                </div>

                {/* Save Reference — prominent, reassuring */}
                <div className="rounded-2xl border border-t-accent/30 bg-t-accent/5 p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs text-t-text-3 uppercase tracking-widest mb-1">{t('checkout_order_ref_label')}</p>
                            <p className="text-xl font-bold text-t-accent font-mono tracking-wider">
                                #{order.order_number || order.reference_id.slice(-8).toUpperCase()}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-t-accent/10 flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5 text-t-accent" />
                        </div>
                    </div>
                    <div className="h-px bg-t-accent/15" />
                    <div className="flex items-start gap-2">
                        <Mail className="w-3.5 h-3.5 text-t-success shrink-0 mt-0.5" />
                        <p className="text-xs text-t-success">{t('checkout_email_sent_hint')}</p>
                    </div>
                    <p className="text-xs text-t-text-3 leading-relaxed">
                        {t('checkout_save_ref_hint')}
                        {' '}
                        <Link href={`/${params.locale}/portal`} className="text-t-accent underline underline-offset-2 hover:text-t-accent-hover transition-colors">
                            {t('checkout_portal_link')}
                        </Link>
                    </p>
                </div>

                {/* STEP 1 — Amount */}
                <div className="glass-panel rounded-2xl border border-t-border overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-3 bg-t-bg-subtle border-b border-t-border">
                        <div className="w-7 h-7 rounded-full bg-t-btn flex items-center justify-center text-t-btn-text font-bold text-sm shrink-0">1</div>
                        <span className="text-sm font-semibold text-t-text uppercase tracking-wide">{t('checkout_exact_amount')}</span>
                    </div>
                    <div className="py-8 px-6 text-center flex flex-col items-center gap-3">
                        <CopyAmountButton amount={order.crypto_amount} />
                        <div className="text-lg text-t-text-2 font-medium">
                            {order.crypto_currency}
                            {order.crypto_currency === 'USDT' && (
                                <span className="ml-2 text-sm text-t-text-4">(TRC20)</span>
                            )}
                        </div>
                    </div>
                    <div className="mx-4 mb-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-200/80">{t('checkout_amount_warning')}</p>
                    </div>
                </div>

                {/* STEP 2 — Copy Address */}
                <div className="glass-panel rounded-2xl border border-t-border overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-3 bg-t-bg-subtle border-b border-t-border">
                        <div className="w-7 h-7 rounded-full bg-t-btn flex items-center justify-center text-t-btn-text font-bold text-sm shrink-0">2</div>
                        <span className="text-sm font-semibold text-t-text uppercase tracking-wide">{t('checkout_address_label')}</span>
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
                <details className="glass-panel rounded-2xl border border-t-border overflow-hidden group">
                    <summary className="flex items-center gap-3 px-5 py-3 bg-t-bg-subtle border-b border-t-border cursor-pointer list-none">
                        <span className="text-sm font-medium text-t-text-2 uppercase tracking-wide">{t('checkout_qr_label')}</span>
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
                        <div className="w-5 h-5 rounded-full border-2 border-t-accent/50 border-t-t-accent animate-spin shrink-0"></div>
                        <p className="text-sm text-t-accent/80 font-medium">{t('checkout_waiting')}</p>
                    </div>
                    <div className="text-xs text-t-text-4 text-center leading-relaxed italic max-w-xs px-2 flex flex-col gap-2">
                        <p>{t('checkout_detection_note', { crypto: order.crypto_currency })}</p>
                        <Link href={`/${params.locale}/portal`} className="not-italic text-t-accent/60 hover:text-t-accent underline underline-offset-2 transition-colors">
                            {t('checkout_portal_link')}
                        </Link>
                    </div>
                </div>

                {/* Buyer Protection */}
                <div className="w-full p-4 rounded-xl border border-t-success/20 bg-t-success-dim flex flex-col items-center text-center gap-2">
                    <Shield className="w-6 h-6 text-t-success" />
                    <h4 className="text-sm font-medium text-t-text">{t('checkout_buyer_protection')}</h4>
                    <p className="text-xs text-t-text-2 leading-relaxed">{t('checkout_buyer_protection_desc')}</p>
                </div>
            </div>
        </main>
    );
}
