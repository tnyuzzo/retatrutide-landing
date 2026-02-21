"use client";

import { useState } from "react";
import { ArrowLeft, Check, Lock, Shield, CreditCard, ChevronRight, Minus, Plus } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

const BASE_PRICE = 197;

const DISCOUNT_TIERS = [
    { min: 1, discount: 0 },
    { min: 3, discount: 10 },
    { min: 5, discount: 15 },
    { min: 10, discount: 25 },
    { min: 20, discount: 35 },
    { min: 30, discount: 50 },
];

function getDiscount(qty: number): number {
    let discount = 0;
    for (const tier of DISCOUNT_TIERS) {
        if (qty >= tier.min) discount = tier.discount;
    }
    return discount;
}

export default function OrderPage() {
    const t = useTranslations('Index');
    const locale = useLocale();
    const [quantity, setQuantity] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState<"crypto" | "card">("crypto");
    const [selectedCrypto, setSelectedCrypto] = useState("BTC");
    const [isProcessing, setIsProcessing] = useState(false);

    const discount = getDiscount(quantity);
    const unitPrice = Math.round(BASE_PRICE * (1 - discount / 100));
    const totalPrice = unitPrice * quantity;
    const savedAmount = (BASE_PRICE * quantity) - totalPrice;

    const handleCheckout = async () => {
        setIsProcessing(true);

        try {
            if (paymentMethod === "crypto") {
                const res = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        quantity,
                        crypto_currency: selectedCrypto
                    })
                });
                const data = await res.json();

                if (data.reference_id) {
                    window.location.href = `/${locale}/checkout/${data.reference_id}`;
                } else {
                    console.error("Failed to initialize checkout", data);
                    setIsProcessing(false);
                }
            } else {
                const depositWallet = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
                const guardarianUrl = `https://guardarian.com/calculator/v1?default_fiat_amount=${totalPrice}&default_fiat_currency=EUR&default_crypto_currency=BTC&crypto_address=${depositWallet}`;
                window.open(guardarianUrl, '_blank');
                setIsProcessing(false);
            }
        } catch (err) {
            console.error("Checkout Error:", err);
            setIsProcessing(false);
        }
    };

    return (
        <main className="min-h-screen bg-brand-void text-white font-sans flex flex-col">
            {/* HEADER */}
            <header className="w-full py-6 px-6 md:px-12 flex justify-between items-center border-b border-white/5 bg-brand-void/50 backdrop-blur-md sticky top-0 z-50">
                <button onClick={() => window.location.href = `/${locale}`} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" /> {t('order_back')}
                </button>
                <div className="flex items-center gap-4">
                    <LanguageSwitcher />
                    <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-400 font-medium tracking-wider uppercase">{t('order_secure')}</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 p-6 md:p-12 relative">
                <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-gold/5 blur-[120px] rounded-full pointer-events-none"></div>

                {/* LEFT COLUMN */}
                <div className="lg:col-span-7 flex flex-col gap-8 relative z-10">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-light mb-2">{t('order_select_title')} <span className="font-medium text-brand-gold">{t('order_select_highlight')}</span></h1>
                        <p className="text-white/50 text-sm">{t('order_select_desc')}</p>
                    </div>

                    {/* QUANTITY SELECTOR */}
                    <div className="glass-panel p-8 border-brand-gold/20">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm text-white/50 uppercase tracking-widest">{t('order_quantity')}</span>
                                <span className="text-white/40 text-xs">Retatrutide 10mg</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-12 h-12 rounded-xl border border-white/20 flex items-center justify-center hover:border-brand-gold hover:bg-brand-gold/10 transition-all active:scale-95"
                                >
                                    <Minus className="w-5 h-5" />
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={quantity}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value) || 1;
                                        setQuantity(Math.max(1, Math.min(100, val)));
                                    }}
                                    className="w-20 h-12 text-center text-2xl font-light bg-transparent border border-white/20 rounded-xl focus:border-brand-gold focus:outline-none text-white"
                                />
                                <button
                                    onClick={() => setQuantity(Math.min(100, quantity + 1))}
                                    className="w-12 h-12 rounded-xl border border-white/20 flex items-center justify-center hover:border-brand-gold hover:bg-brand-gold/10 transition-all active:scale-95"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* LIVE PRICING BREAKDOWN */}
                        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
                            <div className="flex flex-col">
                                <span className="text-xs text-white/40 uppercase tracking-wider">{t('order_unit_price')}</span>
                                <span className="text-2xl font-light text-white mt-1">{unitPrice}€</span>
                                {discount > 0 && (
                                    <span className="text-xs text-white/30 line-through">{BASE_PRICE}€</span>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-white/40 uppercase tracking-wider">{t('order_discount_label')}</span>
                                <span className={`text-2xl font-light mt-1 ${discount > 0 ? 'text-green-400' : 'text-white/30'}`}>
                                    {discount > 0 ? `-${discount}%` : '—'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-white/40 uppercase tracking-wider">{t('order_total')}</span>
                                <span className="text-2xl font-light text-brand-gold mt-1">{totalPrice}€</span>
                                {savedAmount > 0 && (
                                    <span className="text-xs text-green-400">{t('order_save')} {savedAmount}€</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* DISCOUNT TIERS TABLE */}
                    <div className="glass-panel border-white/10 overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
                            <h3 className="text-sm font-medium uppercase tracking-widest text-brand-gold">{t('order_volume_discounts')}</h3>
                        </div>
                        <div className="divide-y divide-white/5">
                            {DISCOUNT_TIERS.map((tier, i) => {
                                const nextTier = DISCOUNT_TIERS[i + 1];
                                const isActive = discount === tier.discount;
                                const isNextTarget = nextTier && quantity < nextTier.min && quantity >= tier.min;
                                const tierPrice = Math.round(BASE_PRICE * (1 - tier.discount / 100));

                                return (
                                    <div
                                        key={tier.min}
                                        onClick={() => setQuantity(tier.min)}
                                        className={`flex items-center justify-between px-6 py-3.5 cursor-pointer transition-all ${isActive
                                                ? 'bg-brand-gold/10 border-l-2 border-brand-gold'
                                                : 'hover:bg-white/5 border-l-2 border-transparent'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/60'}`}>
                                                {tier.min === 1 ? `1–2 ${t('order_pieces')}` :
                                                    nextTier ? `${tier.min}–${nextTier.min - 1} ${t('order_pieces')}` :
                                                        `${tier.min}+ ${t('order_pieces')}`}
                                            </span>
                                            {isNextTarget && nextTier && (
                                                <span className="text-[10px] text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full">
                                                    +{nextTier.min - quantity} → -{nextTier.discount}%
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {tier.discount > 0 ? (
                                                <span className={`text-sm font-medium ${isActive ? 'text-green-400' : 'text-green-400/60'}`}>-{tier.discount}%</span>
                                            ) : (
                                                <span className="text-sm text-white/30">—</span>
                                            )}
                                            <span className={`text-sm font-mono ${isActive ? 'text-white' : 'text-white/50'}`}>{tierPrice}€/{t('order_piece_short')}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* GUARANTEE */}
                    <div className="flex items-start gap-4 p-6 glass-panel border-white/10">
                        <Shield className="w-8 h-8 text-brand-gold shrink-0" />
                        <div className="flex flex-col gap-1 text-sm text-white/70">
                            <span className="font-semibold text-white">{t('order_guarantee_title')}</span>
                            <p>{t('order_guarantee_desc')}</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Order Summary & Payment */}
                <div className="lg:col-span-5 relative z-10">
                    <div className="glass-panel border-brand-gold/20 p-8 flex flex-col gap-6 sticky top-24">
                        <h2 className="text-xl font-medium border-b border-white/10 pb-4">{t('order_summary')}</h2>

                        <div className="flex flex-col gap-3 text-sm">
                            <div className="flex justify-between text-white/70">
                                <span>{t('order_product')}</span>
                                <span>Retatrutide 10mg × {quantity}</span>
                            </div>
                            <div className="flex justify-between text-white/70">
                                <span>{t('order_unit_price')}</span>
                                <span>{unitPrice}€ {discount > 0 && <span className="text-white/30 line-through ml-1">{BASE_PRICE}€</span>}</span>
                            </div>
                            <div className="flex justify-between text-white/70">
                                <span>{t('order_shipping')}</span>
                                <span className="text-green-400">{t('order_free_stealth')}</span>
                            </div>

                            {discount > 0 && (
                                <div className="flex justify-between text-green-400">
                                    <span>{t('order_bulk_discount')} ({discount}%)</span>
                                    <span>- {savedAmount}€</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-end border-t border-white/10 pt-4">
                            <span className="text-lg">{t('order_total')}</span>
                            <div className="flex flex-col items-end">
                                <span className="text-3xl font-light text-brand-gold">{totalPrice}€</span>
                            </div>
                        </div>

                        {/* PAYMENT SELECTION */}
                        <div className="flex flex-col gap-4 mt-6">
                            <h3 className="text-sm font-medium text-white/70 uppercase tracking-widest">{t('order_payment_method')}</h3>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setPaymentMethod("crypto")}
                                    className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'crypto' ? 'bg-brand-gold/10 border-brand-gold text-brand-gold' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                                >
                                    <Lock className="w-5 h-5" />
                                    <span className="text-xs font-medium">{t('order_crypto_native')}</span>
                                </button>

                                <button
                                    onClick={() => setPaymentMethod("card")}
                                    className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'card' ? 'bg-brand-gold/10 border-brand-gold text-brand-gold' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                                >
                                    <CreditCard className="w-5 h-5" />
                                    <span className="text-xs font-medium">{t('order_credit_card')}</span>
                                </button>
                            </div>
                        </div>

                        {/* PAYMENT CONTEXT */}
                        <div className="bg-black/40 rounded-xl p-4 mt-2">
                            {paymentMethod === 'crypto' ? (
                                <div className="flex flex-col gap-3 animate-fade-in">
                                    <p className="text-xs text-white/60">{t('order_crypto_desc')}</p>
                                    <div className="relative h-10">
                                        <select
                                            value={selectedCrypto}
                                            onChange={(e) => setSelectedCrypto(e.target.value)}
                                            className="w-full h-full bg-brand-void/80 border border-brand-gold/30 text-white text-sm rounded-lg px-4 appearance-none focus:outline-none focus:border-brand-gold tracking-wider cursor-pointer font-medium"
                                        >
                                            <option value="BTC">Bitcoin (BTC)</option>
                                            <option value="ETH">Ethereum (ETH)</option>
                                            <option value="SOL">Solana (SOL)</option>
                                            <option value="USDT">Tether (USDT)</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-gold/50 text-xs">▼</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3 animate-fade-in text-xs text-white/60">
                                    <p>{t('order_card_desc')}</p>
                                    <p className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                                        <span>{t('order_card_no_wallet')}</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        <PremiumButton
                            className="w-full justify-center group py-4 mt-4"
                            onClick={handleCheckout}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                            <span className="relative z-10 flex items-center gap-2">
                                {isProcessing ? t('order_processing') : t('order_cta')} <ChevronRight className="w-4 h-4" />
                            </span>
                        </PremiumButton>

                        <div className="flex items-center justify-center gap-4 opacity-50 grayscale mt-2">
                            <span className="text-[10px] tracking-widest uppercase">{t('order_secured_by')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
