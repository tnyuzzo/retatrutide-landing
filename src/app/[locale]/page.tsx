"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Shield, Zap, Lock, Truck, FlaskConical, Navigation, ChevronDown } from "lucide-react";
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

  const calculatePrice = (qty: number) => {
    const basePrice = 197;
    let discountPercent = 0;
    if (qty > 2) {
      discountPercent = (qty - 2) * 5;
      if (discountPercent > 40) discountPercent = 40; // Max 10 items
    }
    const total = basePrice * qty;
    return total - (total * (discountPercent / 100));
  };

  const totalPrice = calculatePrice(quantity);

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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-gold/5 blur-[150px] rounded-full pointer-events-none"></div>

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

            <div className="flex flex-col sm:flex-row gap-4 mt-8 items-center">
              <div className="flex bg-brand-void/80 border border-brand-gold/30 rounded-full h-[46px] items-center px-4 self-stretch sm:self-auto">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-brand-gold/70 hover:text-brand-gold w-6 h-6 flex items-center justify-center text-lg"
                >-</button>
                <span className="text-white w-8 text-center font-mono">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="text-brand-gold/70 hover:text-brand-gold w-6 h-6 flex items-center justify-center text-lg"
                >+</button>
              </div>

              <div className="relative w-full sm:w-auto self-stretch sm:self-auto h-[46px]">
                <select
                  value={selectedCrypto}
                  onChange={(e) => setSelectedCrypto(e.target.value)}
                  className="w-full h-full bg-brand-void/80 border border-brand-gold/30 text-white text-sm rounded-full px-6 appearance-none focus:outline-none focus:border-brand-gold min-w-[120px] tracking-wider cursor-pointer font-medium"
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

              <PremiumButton
                onClick={async (e) => {
                  e.currentTarget.innerHTML = 'Caricamento...';
                  const res = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quantity, crypto_currency: selectedCrypto })
                  });
                  const data = await res.json();
                  if (data.reference_id) window.location.href = `/${locale}/checkout/${data.reference_id}`;
                }}
              >
                Ordina {totalPrice.toFixed(0)}€ <Lock className="w-4 h-4 ml-2" />
              </PremiumButton>
            </div>

            {/* Trust Signals */}
            <div className="flex items-center gap-8 mt-12 pt-8 border-t border-white/10 hidden md:flex">
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-semibold text-white">{t('feature_eu')}</span>
                <span className="text-xs text-brand-gold uppercase tracking-wider">{t('feature_eu_sub')}</span>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-semibold text-white">{t('feature_crypto')}</span>
                <span className="text-xs text-brand-gold uppercase tracking-wider">{t('feature_crypto_sub')}</span>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-semibold text-white">{t('feature_hplc')}</span>
                <span className="text-xs text-brand-gold uppercase tracking-wider">{t('feature_hplc_sub')}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            className="relative lg:h-[700px] flex items-center justify-center perspective-1000"
          >
            <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden glass-panel border-brand-gold/20 p-2 gold-glow">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-void via-brand-void/80 to-[#1a1c1a] z-0"></div>

              {/* Product Image Layer */}
              <div className="absolute inset-0 z-10 p-2">
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  <Image
                    src="/images/retatrutide_hero_gold.png"
                    alt="retatrutide 10mg"
                    fill
                    className="object-cover mix-blend-screen scale-110 opacity-90"
                    priority
                  />
                  {/* Overlay dark gradient to ensure text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-void via-brand-void/30 to-transparent"></div>
                </div>
              </div>

              <div className="absolute inset-0 z-20 flex flex-col items-center justify-end p-8 text-center border border-brand-gold/10 rounded-xl m-2 bg-black/20 backdrop-blur-sm pointer-events-none">
                <h3 className="text-3xl font-light tracking-wide text-white">Retatrutide <span className="text-brand-gold font-medium">10mg</span></h3>
                <p className="text-brand-gold/70 text-sm mt-2 font-mono">CAS: 2381089-83-2</p>
                <p className="text-white/40 text-xs mt-4">{t('vial_purity')}</p>
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
            <div className="glass-panel p-8 group hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-gold/10 transition-colors">
                <Shield className="text-white/50 group-hover:text-brand-gold w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium mb-3">{t('card1_title')}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{t('card1_desc')}</p>
            </div>

            {/* Crypto Checkout Feature prominently highlighted for User Request */}
            <div className="glass-panel p-8 group hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden border-brand-gold/30">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-gold to-brand-gold-light"></div>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Lock className="w-24 h-24 text-brand-gold" />
              </div>
              <div className="relative z-10 w-12 h-12 bg-brand-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-gold/20 transition-colors">
                <Lock className="text-brand-gold w-6 h-6" />
              </div>
              <h3 className="relative z-10 text-xl font-medium mb-3">{t('card2_title')}</h3>
              <p className="relative z-10 text-white/50 text-sm leading-relaxed">{t('card2_desc')}</p>
            </div>

            <div className="glass-panel p-8 group hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-gold/10 transition-colors">
                <Zap className="text-white/50 group-hover:text-brand-gold w-6 h-6" />
              </div>
              <h3 className="text-xl font-medium mb-3">{t('card3_title')}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{t('card3_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BADGES & GUARANTEES */}
      <section className="py-16 px-6 bg-[#0a0a0a] border-t border-b border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full border border-brand-gold/30 bg-brand-gold/5 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-brand-gold" />
            </div>
            <p className="font-medium text-white/90">{t('feature_hplc_sub') || '3rd Party Tested'}</p>
            <p className="text-xs text-white/40">HPLC & MS Verified</p>
          </div>
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full border border-brand-gold/30 bg-brand-gold/5 flex items-center justify-center">
              <Truck className="w-5 h-5 text-brand-gold" />
            </div>
            <p className="font-medium text-white/90">No Customs Risk</p>
            <p className="text-xs text-white/40">Domestic EU Shipping</p>
          </div>
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full border border-brand-gold/30 bg-brand-gold/5 flex items-center justify-center">
              <Lock className="w-5 h-5 text-brand-gold" />
            </div>
            <p className="font-medium text-white/90">100% Private</p>
            <p className="text-xs text-white/40">Crypto Native Orders</p>
          </div>
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full border border-brand-gold/30 bg-brand-gold/5 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-brand-gold" />
            </div>
            <p className="font-medium text-white/90">{t('trust_made_in') || 'Made in USA'}</p>
            <p className="text-xs text-white/40">Synthesized Excellence</p>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-24 px-6 bg-brand-void relative" id="faq">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-light mb-4 text-white">
              {t('faq_title') || 'Frequently Asked Questions'}
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map((num) => {
              const isOpen = openFaq === num;
              return (
                <div
                  key={num}
                  className={`glass-panel overflow-hidden transition-all duration-300 border ${isOpen ? 'border-brand-gold/50' : 'border-white/5'}`}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : num)}
                    className="w-full flex justify-between items-center p-6 text-left"
                  >
                    <span className="font-medium text-lg text-white/90">{t(`faq_q${num}`)}</span>
                    <ChevronDown className={`w-5 h-5 text-brand-gold transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div
                    className={`px-6 text-white/60 leading-relaxed transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    {t(`faq_a${num}`)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-white/40">
          <p>{t('footer_copy')}</p>
          <div className="flex gap-6 items-center">
            <span className="uppercase tracking-widest text-xs flex items-center gap-2">
              <Lock className="w-3 h-3 text-brand-gold" /> {t('footer_secure')}
            </span>
            <LanguageSwitcher />
          </div>
        </div>
      </footer>

    </main>
  );
}
