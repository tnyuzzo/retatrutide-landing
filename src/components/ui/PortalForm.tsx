"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Package, CheckCircle2, Truck, Box, AlertCircle, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

interface OrderData {
    reference_id: string;
    status: string;
    created_at: string;
    fiat_amount: number;
    crypto_currency: string;
    crypto_amount: number | null;
    tracking_number: string | null;
    carrier: string | null;
    shipped_at: string | null;
    items: any[];
}

export function PortalForm() {
    const t = useTranslations('Index');
    const [email, setEmail] = useState("");
    const [reference, setReference] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [orderData, setOrderData] = useState<OrderData | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setOrderData(null);

        if (!email.trim() || !reference.trim()) {
            setError(t('portal_error_fill'));
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`/api/portal?email=${encodeURIComponent(email)}&reference=${encodeURIComponent(reference)}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || t('portal_error_not_found'));
            }

            setOrderData(data.order);
        } catch (err: any) {
            setError(err.message || t('portal_error_not_found'));
        } finally {
            setLoading(false);
        }
    };

    const statusMap = [
        { key: "pending", icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />, label: t('portal_status_pending') },
        { key: "paid", icon: <CheckCircle2 className="w-5 h-5 text-brand-gold" />, label: t('portal_status_paid') },
        { key: "processing", icon: <Box className="w-5 h-5 text-blue-400" />, label: t('portal_status_processing') },
        { key: "shipped", icon: <Truck className="w-5 h-5 text-green-400" />, label: t('portal_status_shipped') },
        { key: "delivered", icon: <Package className="w-5 h-5 text-emerald-500" />, label: t('portal_status_delivered') },
    ];

    const getStatusIndex = (status: string) => {
        return statusMap.findIndex(s => s.key === status);
    };

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
            {/* Search Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6 md:p-8 flex flex-col gap-6"
            >
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-white/70">{t('portal_email_label')}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('portal_email_placeholder')}
                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-gold/50 transition-colors"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-white/70">{t('portal_ref_label')}</label>
                            <input
                                type="text"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                placeholder={t('portal_ref_placeholder')}
                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-gold/50 transition-colors font-mono"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg text-sm border border-red-400/20">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-gold text-brand-void font-bold py-3 rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        {loading ? t('portal_btn_tracking') : t('portal_btn_track')}
                    </button>
                </form>
            </motion.div>

            {/* Results Display */}
            <AnimatePresence mode="wait">
                {orderData && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-6 overflow-hidden"
                    >
                        {/* Status Tracking Bar */}
                        <div className="glass-panel p-6 md:p-8">
                            <h3 className="text-lg font-medium text-white mb-8 text-center">{t('portal_status_title') || 'Order Status'}</h3>

                            <div className="relative flex justify-between">
                                {/* Progress Line */}
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2 rounded-full z-0"></div>

                                {/* Active Progress Line */}
                                <div
                                    className="absolute top-1/2 left-0 h-1 bg-brand-gold -translate-y-1/2 rounded-full z-0 transition-all duration-1000 ease-out"
                                    style={{ width: `${Math.max(0, (getStatusIndex(orderData.status) / (statusMap.length - 1)) * 100)}%` }}
                                ></div>

                                {statusMap.map((step, index) => {
                                    const isCompleted = getStatusIndex(orderData.status) >= index;
                                    const isActive = getStatusIndex(orderData.status) === index;

                                    return (
                                        <div key={step.key} className="relative z-10 flex flex-col items-center gap-2 w-16">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2
                          ${isActive ? 'bg-brand-void border-brand-gold shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-110' : ''}
                          ${isCompleted && !isActive ? 'bg-brand-gold border-brand-gold text-brand-void' : ''}
                          ${!isCompleted ? 'bg-brand-void border-white/10 text-white/30' : ''}
                        `}>
                                                {isCompleted && !isActive ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
                                            </div>
                                            <span className={`text-[10px] md:text-xs text-center font-medium transition-colors duration-300
                          ${isActive ? 'text-brand-gold' : ''}
                          ${isCompleted && !isActive ? 'text-white/80' : ''}
                          ${!isCompleted ? 'text-white/30' : ''}
                        `}>
                                                {step.label}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Order Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div className="glass-panel p-6 flex flex-col gap-4">
                                <h4 className="text-brand-gold text-xs tracking-widest uppercase font-medium border-b border-white/10 pb-2">{t('portal_details_title')}</h4>

                                <div className="flex justify-between items-center">
                                    <span className="text-white/50 text-sm">{t('portal_date')}</span>
                                    <span className="text-white text-sm font-mono">{new Date(orderData.created_at).toLocaleDateString()}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-white/50 text-sm">{t('portal_detail_fiat')}</span>
                                    <span className="text-white text-sm font-medium">€{orderData.fiat_amount.toFixed(2)}</span>
                                </div>

                                {(orderData.crypto_currency && orderData.crypto_amount) && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/50 text-sm">{t('portal_detail_crypto')}</span>
                                        <span className="text-white text-sm font-medium">{orderData.crypto_amount} {orderData.crypto_currency}</span>
                                    </div>
                                )}
                            </div>

                            <div className="glass-panel p-6 flex flex-col gap-4">
                                <h4 className="text-brand-gold text-xs tracking-widest uppercase font-medium border-b border-white/10 pb-2">{t('portal_detail_items')}</h4>
                                <div className="flex flex-col gap-3 max-h-32 overflow-y-auto pr-2">
                                    {orderData.items?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-start text-sm">
                                            <span className="text-white/80">{item.name} <span className="text-white/40">x{item.quantity}</span></span>
                                            <span className="text-white font-mono shrink-0 ml-4">€{item.price ? item.price.toFixed(2) : (item.unit_price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    {(!orderData.items || orderData.items.length === 0) && (
                                        <span className="text-white/40 text-sm italic">Kit Retatrutide</span>
                                    )}
                                </div>
                            </div>

                            {/* Shipping Info - Visible only if shipped/delivered */}
                            {(orderData.status === 'shipped' || orderData.status === 'delivered') && orderData.tracking_number && (
                                <div className="glass-panel p-6 flex flex-col gap-4 md:col-span-2 border-green-500/20 bg-green-500/5">
                                    <h4 className="text-green-400 text-xs tracking-widest uppercase font-medium border-b border-green-500/20 pb-2 flex items-center gap-2">
                                        <Truck className="w-4 h-4" /> {t('portal_shipping_title')}
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-white/50 text-sm">{t('portal_detail_carrier')}</span>
                                            <span className="text-white font-medium text-lg">{orderData.carrier || 'Express Courier'}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-white/50 text-sm">{t('portal_detail_tracking')}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-mono bg-black/40 px-3 py-1 rounded-md border border-white/10 select-all">{orderData.tracking_number}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
