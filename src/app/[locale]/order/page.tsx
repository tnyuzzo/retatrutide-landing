"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Lock, Shield, CreditCard, ChevronRight } from "lucide-react";
import Image from "next/image";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useTranslations, useLocale } from "next-intl";

const PACKAGES = [
    {
        id: "basic",
        quantity: 1,
        title: "1 Box (10 Vials)",
        pricePerVial: 197,
        total: 1970,
        discountPercentage: 0,
        isPopular: false,
    },
    {
        id: "pro",
        quantity: 5,
        title: "5 Boxes (50 Vials)",
        pricePerVial: 147,
        total: 7350,
        originalTotal: 9850,
        discountPercentage: 25,
        isPopular: true,
    },
    {
        id: "elite",
        quantity: 20,
        title: "20 Boxes (200 Vials)",
        pricePerVial: 97, // Price anchor
        total: 19400,
        originalTotal: 39400,
        discountPercentage: 50,
        isPopular: false,
    }
];

export default function OrderPage() {
    const t = useTranslations('Index');
    const locale = useLocale();
    const [selectedPackage, setSelectedPackage] = useState(PACKAGES[1]); // Default to popular
    const [paymentMethod, setPaymentMethod] = useState<"crypto" | "card">("crypto");
    const [selectedCrypto, setSelectedCrypto] = useState("BTC");
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCheckout = async () => {
        setIsProcessing(true);

        try {
            if (paymentMethod === "crypto") {
                // Direct Native Crypto Checkout (CryptAPI Logic)
                const res = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        quantity: selectedPackage.quantity,
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
                // Fiat-to-Crypto On-Ramp Checkout (Guardarian / ChangeHero Sandbox)
                // Guardarian generates a unique URL where the destination wallet is pre-filled.
                // For now, we mock the Redirect UX.
                const depositWallet = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"; // Example Vault
                const fiatAmount = selectedPackage.total;

                // In real prod, this link comes from CryptAPI or Guardarian API:
                const guardarianUrl = `https://guardarian.com/calculator/v1?default_fiat_amount=${fiatAmount}&default_fiat_currency=EUR&default_crypto_currency=BTC&crypto_address=${depositWallet}`;

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
            {/* MINIMAL HEADER */}
            <header className="w-full py-6 px-6 md:px-12 flex justify-between items-center border-b border-white/5 bg-brand-void/50 backdrop-blur-md sticky top-0 z-50">
                <button onClick={() => window.location.href = `/${locale}`} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Product
                </button>
                <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400 font-medium tracking-wider uppercase">Secure Checkout</span>
                </div>
            </header>

            <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 p-6 md:p-12 relative">
                {/* Background glow */}
                <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-gold/5 blur-[120px] rounded-full pointer-events-none"></div>

                {/* LEFT COLUMN: Package Selection */}
                <div className="lg:col-span-7 flex flex-col gap-8 relative z-10">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-light mb-2">Select your <span className="font-medium text-brand-gold">Supply</span></h1>
                        <p className="text-white/50 text-sm">Choose the best package for your research needs.</p>
                    </div>

                    <div className="flex flex-col gap-4">
                        {PACKAGES.map((pkg) => {
                            const isSelected = selectedPackage.id === pkg.id;

                            return (
                                <div
                                    key={pkg.id}
                                    onClick={() => setSelectedPackage(pkg)}
                                    className={`relative p-6 rounded-2xl border cursor-pointer transition-all duration-300 ${isSelected ? 'glass-panel border-brand-gold gold-glow bg-brand-gold/10 scale-[1.02]' : 'border-white/10 bg-white/5 hover:border-brand-gold/30 hover:bg-white/10'}`}
                                >
                                    {pkg.isPopular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-gold text-black text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                                            Most Popular
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            {/* Custom Radio Button */}
                                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-brand-gold bg-brand-gold/20' : 'border-white/30'}`}>
                                                {isSelected && <div className="w-3 h-3 rounded-full bg-brand-gold" />}
                                            </div>

                                            <div className="flex flex-col">
                                                <span className="text-xl font-medium">{pkg.title}</span>
                                                {pkg.discountPercentage > 0 && (
                                                    <span className="text-green-400 text-xs font-medium mt-1">Save {pkg.discountPercentage}% ({(pkg.originalTotal || 0) - pkg.total}€)</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end">
                                            <div className="flex items-end gap-1">
                                                <span className="text-2xl font-light">{pkg.pricePerVial}€</span>
                                                <span className="text-white/50 text-xs mb-1">/vial</span>
                                            </div>
                                            <span className="text-white/40 text-xs line-through mt-1">
                                                {pkg.originalTotal ? `${(pkg.originalTotal / (pkg.quantity * 10)).toFixed(0)}€/vial` : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 flex items-start gap-4 p-6 glass-panel border-white/10">
                        <Shield className="w-8 h-8 text-brand-gold shrink-0" />
                        <div className="flex flex-col gap-1 text-sm text-white/70">
                            <span className="font-semibold text-white">Guaranteed Purity & Delivery</span>
                            <p>Every batch includes a 3rd party HPLC Janoshik Lab Report. If your package is seized by customs, we will reship it for free.</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Order Summary & Payment */}
                <div className="lg:col-span-5 relative z-10">
                    <div className="glass-panel border-brand-gold/20 p-8 flex flex-col gap-6 sticky top-24">
                        <h2 className="text-xl font-medium border-b border-white/10 pb-4">Order Summary</h2>

                        <div className="flex flex-col gap-3 text-sm">
                            <div className="flex justify-between text-white/70">
                                <span>Product</span>
                                <span>{selectedPackage.title}</span>
                            </div>
                            <div className="flex justify-between text-white/70">
                                <span>Shipping</span>
                                <span className="text-green-400">Free Elite Stealth</span>
                            </div>

                            {selectedPackage.discountPercentage > 0 && (
                                <div className="flex justify-between text-green-400">
                                    <span>Bulk Discount</span>
                                    <span>- {((selectedPackage.originalTotal || 0) - selectedPackage.total).toFixed(0)}€</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-end border-t border-white/10 pt-4">
                            <span className="text-lg">Total</span>
                            <div className="flex flex-col items-end">
                                <span className="text-3xl font-light text-brand-gold">{selectedPackage.total.toFixed(0)}€</span>
                            </div>
                        </div>

                        {/* HYBRID PAYMENT SELECTION */}
                        <div className="flex flex-col gap-4 mt-6">
                            <h3 className="text-sm font-medium text-white/70 uppercase tracking-widest">Payment Method</h3>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setPaymentMethod("crypto")}
                                    className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'crypto' ? 'bg-brand-gold/10 border-brand-gold text-brand-gold' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                                >
                                    <Lock className="w-5 h-5" />
                                    <span className="text-xs font-medium">Crypto Native</span>
                                </button>

                                <button
                                    onClick={() => setPaymentMethod("card")}
                                    className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'card' ? 'bg-brand-gold/10 border-brand-gold text-brand-gold' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
                                >
                                    <CreditCard className="w-5 h-5" />
                                    <span className="text-xs font-medium">Credit Card</span>
                                </button>
                            </div>
                        </div>

                        {/* PAYMENT CONTEXT AREA */}
                        <div className="bg-black/40 rounded-xl p-4 mt-2">
                            {paymentMethod === 'crypto' ? (
                                <div className="flex flex-col gap-3 animate-fade-in">
                                    <p className="text-xs text-white/60">Pay anonymously using your personal wallet.</p>
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
                                    <p>Pay easily with <strong>Visa, Mastercard, or Apple Pay</strong> via our secure partner <span className="text-brand-gold cursor-pointer hover:underline">Guardarian</span>.</p>
                                    <p className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                                        <span>No wallet required. Enter your details, and the fiat will automatically be converted to pay for this exact order.</span>
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
                                {isProcessing ? "Processing Vault..." : "Complete Secure Order"} <ChevronRight className="w-4 h-4" />
                            </span>
                        </PremiumButton>

                        <div className="flex items-center justify-center gap-4 opacity-50 grayscale mt-2">
                            {/* placeholder for crypto logos / visa logos based on selection */}
                            <span className="text-[10px] tracking-widest uppercase">Secured by AES-256</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
