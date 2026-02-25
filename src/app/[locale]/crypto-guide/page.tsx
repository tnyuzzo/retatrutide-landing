"use client";

import { useState } from "react";
import { CreditCard, Copy, Shield, Clock, ChevronDown, ChevronUp, ArrowLeft, ExternalLink, AlertTriangle, CheckCircle, Ban, Eye, Zap } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { CryptoGuideStructuredData } from "@/components/seo/CryptoGuideStructuredData";

const CHANGEHERO_URLS: Record<string, string> = {
    en: "https://changehero.io/buy/usdt",
    it: "https://changehero.io/it/buy/usdt",
    de: "https://changehero.io/de/buy/usdt",
    fr: "https://changehero.io/fr/buy/usdt",
    es: "https://changehero.io/es/buy/usdt",
    ru: "https://changehero.io/ru/buy/usdt",
    pl: "https://changehero.io/buy/usdt",
    uk: "https://changehero.io/buy/usdt",
    pt: "https://changehero.io/buy/usdt",
    ar: "https://changehero.io/buy/usdt",
};

export default function CryptoGuidePage() {
    const t = useTranslations("Index");
    const locale = useLocale();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const changeHeroUrl = CHANGEHERO_URLS[locale] || CHANGEHERO_URLS.en;

    const faqs = [
        { q: t("crypto_faq_safe_q"), a: t("crypto_faq_safe_a") },
        { q: t("crypto_faq_time_q"), a: t("crypto_faq_time_a") },
        { q: t("crypto_faq_which_q"), a: t("crypto_faq_which_a") },
    ];

    return (
        <main className="min-h-screen bg-brand-void text-white font-sans flex flex-col items-center p-6 relative overflow-hidden">
            {/* Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-gold/5 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Nav */}
            <div className="w-full max-w-2xl flex justify-between items-center mb-8 z-10">
                <Link href={`/${locale}/order`} className="flex items-center gap-2 text-white/50 hover:text-brand-gold transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" /> {t("nav_home")}
                </Link>
                <LanguageSwitcher />
            </div>

            <div className="z-10 max-w-2xl w-full flex flex-col gap-8">
                {/* Hero */}
                <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-brand-gold/10 flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="w-6 h-6 text-brand-gold" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-light">{t("crypto_title")}</h1>
                    <p className="text-white/50 text-sm mt-2">{t("crypto_subtitle")}</p>
                </div>

                {/* Why Crypto */}
                <div className="glass-panel p-6 md:p-8 rounded-2xl border border-white/10">
                    <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-brand-gold mb-6">
                        <Shield className="w-4 h-4" />
                        {t("crypto_why_title")}
                    </h2>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                            <Ban className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-white/70">{t("crypto_why_1")}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <Eye className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
                            <p className="text-sm text-white/70">{t("crypto_why_2")}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <Zap className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-white/70">{t("crypto_why_3")}</p>
                        </div>
                    </div>
                </div>

                {/* Steps */}
                <div className="glass-panel p-6 md:p-8 rounded-2xl border border-brand-gold/20 flex flex-col gap-8">
                    <h2 className="text-sm font-medium uppercase tracking-widest text-brand-gold">
                        {t("crypto_step_title")}
                    </h2>

                    {/* Step 1 */}
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center text-brand-gold font-semibold text-base">
                                {t("crypto_step1_num")}
                            </div>
                            <h3 className="text-base font-semibold text-white text-center leading-snug">{t("crypto_step1_title")}</h3>
                        </div>
                        <p className="text-sm text-white/55 leading-relaxed">{t("crypto_step1_desc")}</p>
                        <div className="inline-flex items-center gap-2 text-xs text-brand-gold/70 bg-brand-gold/5 border border-brand-gold/15 px-3 py-2 rounded-lg self-start">
                            <Copy className="w-3.5 h-3.5 shrink-0" />
                            <span>USDT (TRC20) recommended</span>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center text-brand-gold font-semibold text-base">
                                {t("crypto_step2_num")}
                            </div>
                            <h3 className="text-base font-semibold text-white text-center leading-snug">{t("crypto_step2_title")}</h3>
                        </div>

                            {/* Sub-steps as numbered list */}
                            <ol className="flex flex-col gap-2">
                                {t("crypto_step2_desc").split("·").map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="w-5 h-5 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                                            {i + 1}
                                        </span>
                                        <span className="text-sm text-white/60 leading-relaxed">{item.trim()}</span>
                                    </li>
                                ))}
                            </ol>

                            {/* Visual callout: where to paste the address */}
                            <div className="bg-blue-500/10 border border-blue-400/25 rounded-xl p-4">
                                <p className="text-xs font-semibold text-blue-300 mb-3">📍 {t("crypto_step2_wallet_hint")}</p>
                                <div className="bg-[#0c1933] border border-blue-400/40 rounded-lg px-4 py-3">
                                    <p className="text-[11px] text-blue-200/50 mb-1.5">{t("crypto_changehero_field_label")}</p>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs text-white/30 font-mono truncate">TUjXYc8uJ85FGJs2QCqv9...</p>
                                        <span className="text-[10px] text-brand-gold/70 whitespace-nowrap shrink-0">← {t("crypto_paste_here")}</span>
                                    </div>
                                </div>
                            </div>

                        <a
                            href={changeHeroUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 bg-brand-gold/15 hover:bg-brand-gold/25 border border-brand-gold/40 text-brand-gold text-sm font-semibold px-5 py-3 rounded-xl transition-all"
                        >
                            {t("crypto_open_changehero")} <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </div>

                {/* Amount Warning */}
                <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-200/80">{t("crypto_amount_warning")}</p>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                        <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-2" />
                        <p className="text-xs text-white/60">{t("crypto_info_nokyc")}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                        <Clock className="w-5 h-5 text-brand-gold mx-auto mb-2" />
                        <p className="text-xs text-white/60">{t("crypto_info_nowallet")}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                        <CreditCard className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                        <p className="text-xs text-white/60">{t("crypto_info_ownwallet")}</p>
                    </div>
                </div>

                {/* FAQ */}
                <div className="glass-panel p-6 md:p-8 rounded-2xl border border-white/10">
                    <h2 className="text-sm font-medium uppercase tracking-widest text-brand-gold mb-6">
                        {t("crypto_faq_title")}
                    </h2>
                    <div className="flex flex-col gap-2">
                        {faqs.map((faq, i) => (
                            <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                                >
                                    <span className="text-sm font-medium text-white/80">{faq.q}</span>
                                    {openFaq === i ? (
                                        <ChevronUp className="w-4 h-4 text-white/40 shrink-0" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />
                                    )}
                                </button>
                                {openFaq === i && (
                                    <div className="px-4 pb-3">
                                        <p className="text-sm text-white/50 leading-relaxed">{faq.a}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Back to Order */}
                <div className="text-center pb-8">
                    <Link
                        href={`/${locale}/order`}
                        className="inline-flex items-center gap-2 bg-brand-gold/10 hover:bg-brand-gold/20 border border-brand-gold/30 text-brand-gold text-sm font-medium px-6 py-3 rounded-xl transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t("nav_home")}
                    </Link>
                </div>
            </div>

            {/* SEO: Structured Data */}
            <CryptoGuideStructuredData />
        </main>
    );
}
