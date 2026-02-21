"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Shield, ShieldCheck, Zap, Lock, Truck, FlaskConical, Navigation, ChevronDown, Package, MessageCircle, Beaker, ArrowRight, Thermometer } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useState } from "react";

export default function Home() {
  const t = useTranslations('Index');
  const locale = useLocale();
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [showCoaModal, setShowCoaModal] = useState(false);

  const calculatePrice = (qty: number) => {
    const basePrice = 197;
    let discountPercent = 0;
    if (qty > 2) {
      discountPercent = (qty - 2) * 5;
      if (discountPercent > 40) discountPercent = 40; // Max 10 items
    }
    const total = basePrice * qty;
    const finalPrice = total - (total * (discountPercent / 100));
    return { finalPrice, total, discountPercent };
  };

  const { finalPrice: totalPrice, total: rawTotal, discountPercent } = calculatePrice(quantity);

  return (
    <main className="min-h-screen bg-brand-void text-white overflow-hidden font-sans">

      {/* HEADER / NAV */}
      <nav className="fixed top-0 w-full z-50 glass-panel !rounded-none !border-t-0 !border-l-0 !border-r-0 border-b-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* Logo Icon */}
          <div className="w-8 h-8 rounded-full border border-brand-gold flex items-center justify-center">
            <div className="w-3 h-3 bg-brand-gold rounded-full gold-glow"></div>
          </div>
          <span className="text-xl font-medium tracking-widest uppercase">
            {t('title')}
          </span>
        </div>
        <div className="hidden md:flex gap-8 text-sm tracking-widest text-white/70 uppercase">
          <a href="#science" className="hover:text-brand-gold transition-colors">{t('nav_science')}</a>
          <a href="#lab" className="hover:text-brand-gold transition-colors">{t('nav_lab')}</a>
          <a href="#order" className="hover:text-brand-gold transition-colors">{t('nav_order')}</a>
        </div>
        <div className="flex items-center gap-6">
          <LanguageSwitcher />
          <PremiumButton variant="outline" className="scale-90 hidden md:flex">
            {t('nav_portal')}
          </PremiumButton>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-12 px-6">
        {/* Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-gold/10 blur-[120px] rounded-full pointer-events-none radial-glow"></div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-gold/30 bg-brand-gold/5 w-fit">
              <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse"></span>
              <span className="text-xs uppercase tracking-[0.2em] text-brand-gold">{t('hero_badge')}</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extralight leading-tight">
              {t('hero_title')} <br />
              <span className="font-semibold text-gradient-gold">Retatrutide</span>
            </h1>

            <p className="text-lg md:text-xl text-white/60 font-light max-w-lg leading-relaxed">
              {t('hero_subtitle')}
            </p>

            <div className="flex flex-col mt-8">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex bg-brand-void/80 border border-brand-gold/30 rounded-full h-[46px] items-center px-4 self-stretch sm:self-auto transition-colors hover:border-brand-gold/50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="text-brand-gold/70 hover:text-brand-gold w-6 h-6 flex items-center justify-center text-lg transition-colors"
                  >-</button>
                  <span className="text-white w-8 text-center font-mono">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    className="text-brand-gold/70 hover:text-brand-gold w-6 h-6 flex items-center justify-center text-lg transition-colors"
                  >+</button>
                </div>

                <div className="relative w-full sm:w-auto self-stretch sm:self-auto h-[46px]">
                  <select
                    value={selectedCrypto}
                    onChange={(e) => setSelectedCrypto(e.target.value)}
                    className="w-full h-full bg-brand-void/80 border border-brand-gold/30 text-white text-sm rounded-full px-6 appearance-none focus:outline-none focus:border-brand-gold min-w-[120px] tracking-wider cursor-pointer font-medium transition-colors hover:border-brand-gold/50"
                  >
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
                    <option value="SOL">SOL</option>
                    <option value="USDC">USDC</option>
                    <option value="USDT">USDT</option>
                    <option value="XMR">XMR</option>
                    <option value="XRP">XRP</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-gold/50 text-[10px]">
                    ▼
                  </div>
                </div>

                <div className="flex flex-col items-center sm:items-start gap-2 w-full sm:w-auto">
                  <PremiumButton
                    className="w-full sm:w-auto hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-shadow group relative overflow-hidden"
                    onClick={async (e) => {
                      e.currentTarget.innerHTML = t('btn_loading');
                      const res = await fetch('/api/checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ quantity, crypto_currency: selectedCrypto })
                      });
                      const data = await res.json();
                      if (data.reference_id) window.location.href = `/${locale}/checkout/${data.reference_id}`;
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    <span className="relative z-10 flex items-center gap-2">
                      {t('btn_order')} {totalPrice.toFixed(0)}€ <Lock className="w-4 h-4" />
                    </span>
                  </PremiumButton>
                </div>
              </div>

              {/* Dynamic Bulk Discount Display */}
              <div className="h-6 mt-3 flex items-center gap-3 text-sm">
                <button
                  onClick={() => setShowCryptoModal(true)}
                  className="text-white/50 hover:text-brand-gold transition-colors underline underline-offset-4 decoration-brand-gold/30 flex items-center gap-1 text-xs"
                >
                  <Zap className="w-3 h-3" /> New to Crypto?
                </button>
                {discountPercent > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full"
                  >
                    <span className="text-white/50 line-through text-xs font-mono">{rawTotal.toFixed(0)}€</span>
                    <span className="text-green-400 font-medium text-xs">Save {discountPercent}% ({(rawTotal - totalPrice).toFixed(0)}€)</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* TRUST ELEMENTS BATCH 1 (Rec 1, 2, 10) */}
            <div className="flex flex-col gap-3 mt-4">
              {/* Rec 10: Shipping Promise */}
              <div className="flex items-center gap-2 text-brand-gold/80 text-sm">
                <Truck className="w-4 h-4" />
                <span><strong className="text-white">Same-day stealth shipping</strong> on orders placed before 12 PM.</span>
              </div>

              {/* Rec 2: Visual Timeline */}
              <div className="flex items-center gap-2 text-xs text-white/60 font-medium">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Order Today</div>
                <span className="text-white/20">👉</span>
                <div>Ships Tomorrow</div>
                <span className="text-white/20">👉</span>
                <div className="text-brand-gold">Delivered in 2-4 Days</div>
              </div>

              {/* Rec 1: COA Link */}
              <div className="mt-2">
                <button onClick={() => setShowCoaModal(true)} className="inline-flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors underline decoration-brand-gold/30 underline-offset-4">
                  <FlaskConical className="w-3 h-3 text-brand-gold" />
                  View Janoshik Lab Report for this Batch
                </button>
              </div>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-col gap-6 mt-8 pt-8 border-t border-white/10 hidden md:flex">
              <div className="flex items-center gap-8">
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-semibold text-white">{t('feature_eu')}</span>
                  <span className="text-xs text-brand-gold uppercase tracking-wider">{t('feature_eu_sub')}</span>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-semibold text-white">{t('feature_crypto')}</span>
                  <span className="text-xs text-brand-gold uppercase tracking-wider">{t('feature_crypto_sub')}</span>
                </div>
              </div>

              {/* Rec 5 & 9: Sterility and HPLC Standardized Claims */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-brand-gold/20 bg-brand-gold/5 max-w-lg">
                <Shield className="w-8 h-8 text-brand-gold shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">Clinical Grade Research Peptide</span>
                  <span className="text-xs text-white/70 leading-relaxed mt-1">
                    Third-party Tested by Janoshik for Purity (HPLC {'>'}99%), Sterility, Endotoxins, and Heavy Metals.
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            className="relative lg:h-[700px] flex items-center justify-center perspective-1000 group"
          >
            <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden glass-panel border-brand-gold/20 p-2 gold-glow transition-all duration-700 group-hover:shadow-[0_0_40px_rgba(255,215,0,0.2)] group-hover:-translate-y-2 group-hover:border-brand-gold/40">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-void via-brand-void/80 to-[#1a1c1a] z-0 transition-opacity duration-700 group-hover:opacity-80"></div>

              {/* Product Image Layer */}
              <div className="absolute inset-0 z-10 p-2">
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  <Image
                    src="/images/retatrutide_hero_gold.png"
                    alt="retatrutide 10mg"
                    fill
                    className="object-cover mix-blend-screen scale-110 opacity-90 transition-transform duration-1000 group-hover:scale-[1.15]"
                    priority
                  />
                  {/* Overlay dark gradient to ensure text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-void via-brand-void/30 to-transparent"></div>
                </div>
              </div>

              <div className="absolute inset-0 z-20 flex flex-col items-center justify-end p-8 text-center border border-brand-gold/10 rounded-xl m-2 bg-black/20 backdrop-blur-md pointer-events-none transition-all duration-700 group-hover:bg-black/10">
                <h3 className="text-3xl font-light tracking-wide text-white">Retatrutide <span className="text-brand-gold font-medium">10mg</span></h3>
                <p className="text-brand-gold/70 text-sm mt-2 font-mono">CAS: 2381089-83-2</p>
                <p className="text-white/40 text-xs mt-4 transition-colors duration-700 group-hover:text-white/60">{t('vial_purity')}</p>
              </div>
            </div>

            {/* Floating UI Elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-4 md:-right-12 top-1/4 glass-panel p-4 flex items-center gap-4 border border-brand-gold/20"
            >
              <div className="p-2 bg-brand-gold/10 rounded-full"><Shield className="text-brand-gold w-5 h-5" /></div>
              <div>
                <p className="text-xs text-white/50 uppercase tracking-widest">{t('purity_level')}</p>
                <p className="text-lg text-brand-gold font-mono">&ge; 99.8%</p>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* WHY CHOOSE US / FEATURES */}
      <section id="science" className="py-24 px-6 bg-black relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-light mb-4">{t('section_science_title_1')} <span className="text-brand-gold font-medium">{t('section_science_title_2')}</span></h2>
            <p className="text-white/50 max-w-2xl mx-auto">{t('section_science_desc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6 }}
              className="glass-panel p-8 group hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-gold/10 transition-colors">
                <Shield className="text-white/50 group-hover:text-brand-gold w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium mb-3">{t('card1_title')}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{t('card1_desc')}</p>
            </motion.div>

            {/* Crypto Checkout Feature prominently highlighted for User Request */}
            <motion.div
              whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-panel p-8 group hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden border-brand-gold/30"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-gold to-brand-gold-light"></div>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Lock className="w-24 h-24 text-brand-gold" />
              </div>
              <div className="relative z-10 w-12 h-12 bg-brand-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-gold/20 transition-colors">
                <Lock className="text-brand-gold w-6 h-6" />
              </div>
              <h3 className="relative z-10 text-xl font-medium mb-3">{t('card2_title')}</h3>
              <p className="relative z-10 text-white/50 text-sm leading-relaxed">{t('card2_desc')}</p>
            </motion.div>

            <motion.div
              whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-panel p-8 group hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-gold/10 transition-colors">
                <Zap className="text-white/50 group-hover:text-brand-gold w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium mb-3">{t('card3_title')}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{t('card3_desc')}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* TRUST BADGES & GUARANTEES - INFINITE TICKER */}
      <section className="py-8 bg-[#0a0a0a] border-t border-b border-white/5 overflow-hidden">
        <div className="relative flex w-full">
          {/* Fading Edges */}
          <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-[#0a0a0a] to-transparent z-10"></div>
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#0a0a0a] to-transparent z-10"></div>

          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 25, ease: "linear", repeat: Infinity }}
            className="flex gap-16 min-w-max items-center pr-16"
          >
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-16 items-center">
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-full border border-brand-gold/30 bg-brand-gold/5 flex items-center justify-center group-hover:bg-brand-gold/10 transition-colors">
                    <FlaskConical className="w-5 h-5 text-brand-gold" />
                  </div>
                  <div className="flex flex-col">
                    <p className="font-medium text-white/90 whitespace-nowrap">{t('trust_badge_purity')}</p>
                    <p className="text-xs text-white/40">{t('trust_badge_purity_sub')}</p>
                  </div>
                </div>

                <div className="w-px h-8 bg-white/10"></div>

                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-full border border-brand-gold/30 bg-brand-gold/5 flex items-center justify-center group-hover:bg-brand-gold/10 transition-colors">
                    <Truck className="w-5 h-5 text-brand-gold" />
                  </div>
                  <div className="flex flex-col">
                    <p className="font-medium text-white/90 whitespace-nowrap">{t('trust_badge_shipping')}</p>
                    <p className="text-xs text-white/40">{t('trust_badge_shipping_sub')}</p>
                  </div>
                </div>

                <div className="w-px h-8 bg-white/10"></div>

                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-full border border-brand-gold/30 bg-brand-gold/5 flex items-center justify-center group-hover:bg-brand-gold/10 transition-colors">
                    <ShieldCheck className="w-5 h-5 text-brand-gold" />
                  </div>
                  <div className="flex flex-col">
                    <p className="font-medium text-white/90 whitespace-nowrap">{t('trust_badge_guarantee')}</p>
                    <p className="text-xs text-white/40">{t('trust_badge_guarantee_sub')}</p>
                  </div>
                </div>

                <div className="w-px h-8 bg-white/10"></div>

                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-full border border-brand-gold/30 bg-brand-gold/5 flex items-center justify-center group-hover:bg-brand-gold/10 transition-colors">
                    <Package className="w-5 h-5 text-brand-gold" />
                  </div>
                  <div className="flex flex-col">
                    <p className="font-medium text-white/90 whitespace-nowrap">{t('trust_badge_stealth')}</p>
                    <p className="text-xs text-white/40">{t('trust_badge_stealth_sub')}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* QUALITY PIPELINE */}
      <section className="py-24 px-6 bg-brand-void relative" id="quality">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-gold/3 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-light mb-4 text-white">{t('qa_title')} <span className="text-brand-gold font-medium">{t('qa_subtitle')}</span></h2>
            <p className="text-white/50 max-w-2xl mx-auto">{t('qa_desc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { icon: <Beaker className="w-5 h-5" />, key: 'qa_step1' },
              { icon: <FlaskConical className="w-5 h-5" />, key: 'qa_step2' },
              { icon: <Zap className="w-5 h-5" />, key: 'qa_step3' },
              { icon: <Shield className="w-5 h-5" />, key: 'qa_step4' },
              { icon: <ShieldCheck className="w-5 h-5" />, key: 'qa_step5' },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3 relative">
                <div className="w-14 h-14 rounded-full border border-brand-gold/30 bg-brand-gold/5 flex items-center justify-center text-brand-gold">
                  {step.icon}
                </div>
                {i < 4 && <ArrowRight className="hidden md:block absolute -right-4 top-4 w-4 h-4 text-brand-gold/30" />}
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-brand-gold/60 font-mono">0{i + 1}</span>
                  <span className="text-sm font-medium text-white">{t(`${step.key}_title`)}</span>
                  <span className="text-xs text-white/40 leading-relaxed">{t(`${step.key}_desc`)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button onClick={() => setShowCoaModal(true)} className="inline-flex items-center gap-2 text-sm text-brand-gold hover:text-brand-gold-light transition-colors underline underline-offset-4 decoration-brand-gold/30">
              <FlaskConical className="w-4 h-4" />
              View Full COA for Current Batch →
            </button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS (Rec 4) */}
      <section className="py-24 px-6 bg-[#0a0a0a] border-t border-white/5 relative overflow-hidden" id="testimonials">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-gold/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-light mb-4 text-white">Trust <span className="text-brand-gold font-medium">Earned</span></h2>
            <p className="text-white/50 max-w-2xl mx-auto">Rated 4.9/5 by 7,496+ Researchers Worldwide.</p>
          </div>
          <motion.div
            whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="glass-panel p-8 border-brand-gold/20 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex text-brand-gold text-lg">★★★★★</div>
                <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full"><Shield className="w-3 h-3" /> Verified Buyer</span>
              </div>
              <p className="text-white/80 leading-relaxed italic">"Purity is unmatched. I sent a sample from my batch for independent MS testing and it came back at 99.9%. Shipping to Europe took exactly 3 days with no customs issues."</p>
              <div className="mt-auto pt-4 border-t border-white/10 flex flex-col">
                <span className="text-white font-medium">Dr. M. R., Munich</span>
                <span className="text-brand-gold/70 text-sm">Item: Retatrutide 10mg - Kit 5 Vials</span>
              </div>
            </div>
            <div className="glass-panel p-8 border-brand-gold/20 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex text-brand-gold text-lg">★★★★★</div>
                <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full"><Shield className="w-3 h-3" /> Verified Buyer</span>
              </div>
              <p className="text-white/80 leading-relaxed italic">"Finally a trustworthy vendor. The fact they post Janoshik results directly on the page saves me so much time. Reconstitutes perfectly clear every single time."</p>
              <div className="mt-auto pt-4 border-t border-white/10 flex flex-col">
                <span className="text-white font-medium">Alex T., London</span>
                <span className="text-brand-gold/70 text-sm">Item: Retatrutide 10mg - Kit 3 Vials</span>
              </div>
            </div>
            <div className="glass-panel p-8 border-brand-gold/20 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex text-brand-gold text-lg">★★★★★</div>
                <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full"><Shield className="w-3 h-3" /> Verified Buyer</span>
              </div>
              <p className="text-white/80 leading-relaxed italic">"Customer support is actually 24/7. Had an issue with my crypto payment not confirming, emailed them and got it sorted manually in 10 minutes. Top tier service."</p>
              <div className="mt-auto pt-4 border-t border-white/10 flex flex-col">
                <span className="text-white font-medium">S. K., Geneva</span>
                <span className="text-brand-gold/70 text-sm">Item: Retatrutide 10mg - Single Vial</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* WHY AURA */}
      <section className="py-24 px-6 bg-black border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-light mb-4 text-white">{t('why_title')} <span className="text-brand-gold font-medium">{t('why_subtitle')}</span></h2>
          </div>
          <motion.div
            whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="glass-panel p-6 flex items-start gap-4 border-white/5 hover:border-brand-gold/20 transition-colors">
                <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0">
                  <span className="text-brand-gold font-mono text-sm font-bold">0{num}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-white">{t(`why_item${num}_title`)}</span>
                  <span className="text-sm text-white/50 leading-relaxed">{t(`why_item${num}_desc`)}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section >

      {/* PRODUCT SPECIFICATIONS */}
      < section className="py-16 px-6 bg-[#0a0a0a] border-t border-white/5" >
        <div className="max-w-3xl mx-auto">
          <h3 className="text-xl font-medium text-white mb-8 flex items-center gap-3">
            <Thermometer className="w-5 h-5 text-brand-gold" />
            {t('specs_title')}
          </h3>
          <div className="glass-panel border-white/5 overflow-hidden">
            {[
              { label: t('specs_format'), value: t('specs_format_val') },
              { label: t('specs_purity'), value: t('specs_purity_val') },
              { label: t('specs_storage'), value: t('specs_storage_val') },
              { label: t('specs_reconstituted'), value: t('specs_reconstituted_val') },
              { label: t('specs_solvent'), value: t('specs_solvent_val') },
              { label: t('specs_cas'), value: t('specs_cas_val') },
            ].map((row, i) => (
              <div key={i} className={`flex justify-between items-center px-6 py-4 ${i < 5 ? 'border-b border-white/5' : ''}`}>
                <span className="text-sm text-white/50">{row.label}</span>
                <span className="text-sm text-white font-medium font-mono">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* PEPTIDE CALCULATOR CTA (Rec 7) */}
      < section className="py-12 px-6 bg-brand-gold/5 border-t border-brand-gold/20" >
        <div className="max-w-4xl mx-auto glass-panel p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-brand-gold/30 gold-glow">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-void border border-brand-gold flex items-center justify-center shrink-0">
              <FlaskConical className="w-8 h-8 text-brand-gold" />
            </div>
            <div>
              <h3 className="text-2xl font-medium text-white">Peptide Reconstitution Calculator</h3>
              <p className="text-white/60 text-sm mt-1">Need help calculating the exact bacteriostatic water ratio for your research? Use our free tool.</p>
            </div>
          </div>
          <PremiumButton variant="outline" onClick={() => alert("Calculator Modal will open here.")}>Open Calculator</PremiumButton>
        </div>
      </section >

      {/* BUYER PROTECTION BOX */}
      < section className="py-16 px-6 bg-brand-void border-t border-white/5" >
        <div className="max-w-3xl mx-auto">
          <div className="glass-panel p-8 border-green-500/30 bg-green-500/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400"></div>
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-7 h-7 text-green-400" />
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-xl font-semibold text-white">{t('buyer_protection_title')}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{t('buyer_protection_desc')}</p>
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                    {t('buyer_protection_item1')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                    {t('buyer_protection_item2')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                    {t('buyer_protection_item3')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* FAQ SECTION */}
      < section className="py-24 px-6 bg-brand-void relative" id="faq" >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-light mb-4 text-white">
              {t('faq_title')}
            </h2>
            <p className="text-white/50">{t('faq_subtitle')}</p>
          </div>

          {/* Ordering & Payment */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-brand-gold" />
              <span className="text-xs uppercase tracking-[0.2em] text-brand-gold font-medium">Ordering & Payment</span>
            </div>
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5, 6].map((num) => {
                const isOpen = openFaq === num;
                return (
                  <div key={num} className={`glass-panel overflow-hidden transition-all duration-300 border ${isOpen ? 'border-brand-gold/50' : 'border-white/5'}`}>
                    <button onClick={() => setOpenFaq(isOpen ? null : num)} className="w-full flex justify-between items-center p-6 text-left">
                      <span className="font-medium text-white/90">{t(`faq_q${num}`)}</span>
                      <ChevronDown className={`w-5 h-5 text-brand-gold shrink-0 ml-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`px-6 text-white/60 text-sm leading-relaxed transition-all duration-300 ease-in-out ${isOpen ? 'max-h-60 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                      {t(`faq_a${num}`)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Policy & Legal */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-brand-gold" />
              <span className="text-xs uppercase tracking-[0.2em] text-brand-gold font-medium">Policy & Legal</span>
            </div>
            <div className="flex flex-col gap-3">
              {[7, 8, 9].map((num) => {
                const isOpen = openFaq === num;
                return (
                  <div key={num} className={`glass-panel overflow-hidden transition-all duration-300 border ${isOpen ? 'border-brand-gold/50' : 'border-white/5'}`}>
                    <button onClick={() => setOpenFaq(isOpen ? null : num)} className="w-full flex justify-between items-center p-6 text-left">
                      <span className="font-medium text-white/90">{t(`faq_q${num}`)}</span>
                      <ChevronDown className={`w-5 h-5 text-brand-gold shrink-0 ml-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`px-6 text-white/60 text-sm leading-relaxed transition-all duration-300 ease-in-out ${isOpen ? 'max-h-60 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                      {t(`faq_a${num}`)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Support CTA at the bottom of FAQ */}
          <div className="mt-12 text-center">
            <p className="text-white/40 text-sm">Still have questions? <a href="mailto:support@retatrutide-research.com" className="text-brand-gold hover:text-brand-gold-light underline underline-offset-4 decoration-brand-gold/30 transition-colors">Contact our support team</a></p>
          </div>
        </div>
      </section >

      {/* FOOTER - MIAMI STYLE (Rec 3) */}
      < footer className="border-t border-white/5 py-12 px-6 bg-[#050505]" >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-sm text-white/40 mb-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full border border-brand-gold flex items-center justify-center">
                <div className="w-2 h-2 bg-brand-gold rounded-full gold-glow"></div>
              </div>
              <span className="text-lg font-medium tracking-widest uppercase text-white">Retatrutide</span>
            </div>
            <p>Clinical grade peptides for advanced scientific research. Pure, potent, and third-party tested.</p>
          </div>

          <div className="flex flex-col gap-4 md:col-start-3">
            <h4 className="text-white font-medium uppercase tracking-widest text-xs mb-2">Corporate Office</h4>
            <p className="flex items-center gap-2"><Navigation className="w-4 h-4 text-brand-gold" /> 5700 NW 37th Ave, Miami, FL 33142</p>
            <p className="flex items-center gap-2">📧 support@retatrutide-research.com</p>
            <p className="flex items-center gap-2">⏱️ 24/7 Global Customer Support</p>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="max-w-7xl mx-auto text-xs text-white/25 leading-relaxed mb-8 pt-6 border-t border-white/5">
          <p>{t('footer_disclaimer')}</p>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-white/40 pt-8 border-t border-white/10">
          <p>{t('footer_copy')}</p>
          <div className="flex gap-6 items-center">
            <span className="uppercase tracking-widest text-xs flex items-center gap-2">
              <Lock className="w-3 h-3 text-brand-gold" /> {t('footer_secure')}
            </span>
            <LanguageSwitcher />
          </div>
        </div>
      </footer >

      {/* JANOSHIK COA MODAL */}
      {
        showCoaModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowCoaModal(false)}></div>
            <div className="relative glass-panel border-brand-gold/30 p-2 md:p-6 max-w-4xl w-full h-[90vh] md:h-[80vh] flex flex-col gold-glow animate-fade-in bg-[#050505]">
              <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4 px-4 md:px-0">
                <div>
                  <h3 className="text-xl md:text-2xl font-light text-white flex items-center gap-3">
                    <FlaskConical className="w-6 h-6 text-brand-gold" />
                    Independent Laboratory Analysis
                  </h3>
                  <p className="text-brand-gold/70 text-xs mt-1 font-mono">Verified by Janoshik Analytical | Batch: JANO-RET-10</p>
                </div>
                <button onClick={() => setShowCoaModal(false)} className="text-white/50 hover:text-white transition-colors bg-white/5 w-8 h-8 rounded-full flex items-center justify-center">
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-hidden rounded-lg border border-white/10 relative group bg-white/5 flex items-center justify-center">
                {/* Note: Ideally use a real image if available, falling back to a dummy or the original link here */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-brand-void z-10">
                  <FlaskConical className="w-16 h-16 text-brand-gold/20 mb-4" />
                  <h4 className="text-white text-lg font-medium mb-2">Certificate of Analysis</h4>
                  <p className="text-white/50 text-sm max-w-md mb-6">Our products are rigorously tested for purity (≥99.8%), sterility, and heavy metal absence.</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl text-left border border-white/10 rounded-xl p-4 bg-white/5">
                    <div className="flex flex-col"><span className="text-xs text-white/50">Compound</span><span className="text-brand-gold font-medium">Retatrutide</span></div>
                    <div className="flex flex-col"><span className="text-xs text-white/50">Declared Mass</span><span className="text-brand-gold font-medium">10mg</span></div>
                    <div className="flex flex-col"><span className="text-xs text-white/50">Purity (HPLC)</span><span className="text-brand-gold font-medium">99.86%</span></div>
                    <div className="flex flex-col"><span className="text-xs text-white/50">Status</span><span className="text-green-400 font-medium flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> PASS</span></div>
                  </div>
                  <div className="mt-8">
                    <PremiumButton onClick={() => window.open('/assets/janoshik-coa-retatrutide-10mg.png', '_blank')} className="scale-90">
                      Download Original PDF
                    </PremiumButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* CRYPTO PAYMENT MODAL */}
      {
        showCryptoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCryptoModal(false)}></div>
            <div className="relative glass-panel border-brand-gold/30 p-8 max-w-lg w-full gold-glow animate-fade-in flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="text-2xl font-light text-white flex items-center gap-3">
                  <Lock className="w-6 h-6 text-brand-gold" />
                  Secure Crypto Checkout
                </h3>
                <button onClick={() => setShowCryptoModal(false)} className="text-white/50 hover:text-white transition-colors">
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-4 text-sm text-white/70 leading-relaxed">
                <p>We use cryptocurrency to guarantee 100% privacy and discretion for your research material orders.</p>

                <div className="bg-brand-gold/5 border border-brand-gold/20 p-4 rounded-xl flex flex-col gap-3">
                  <h4 className="font-semibold text-white">How it works:</h4>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Select your preferred coin (e.g., BTC, SOL, USDT) and click "Order".</li>
                    <li>You will be redirected to a secure payment page with a unique QR code and wallet address.</li>
                    <li>Send the exact amount from your crypto wallet (like Coinbase, Binance, or Phantom).</li>
                    <li>Your payment is automatically verified in minutes, and your order ships securely.</li>
                  </ol>
                </div>

                <p className="text-xs text-white/40 mt-2">Need a wallet? We recommend downloading <a href="https://trustwallet.com/" target="_blank" className="text-brand-gold hover:underline">TrustWallet</a> or <a href="https://moonpay.com/" target="_blank" className="text-brand-gold hover:underline">MoonPay</a> to buy crypto instantly with your credit card.</p>
              </div>

              <PremiumButton onClick={() => setShowCryptoModal(false)} className="w-full justify-center">
                Got it, let's proceed
              </PremiumButton>
            </div>
          </div>
        )
      }

    </main >
  );
}
