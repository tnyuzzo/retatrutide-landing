"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldCheck, Zap, Lock, Truck, FlaskConical, Navigation, ChevronDown, Package, MessageCircle, Beaker, ArrowRight, Thermometer, CheckCircle2, User, Gift } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useState, useEffect } from "react";
import { LiveInventoryBadge } from "@/components/ui/LiveInventoryBadge";
import { RecentSalesPopup } from "@/components/ui/RecentSalesPopup";
import { HomeStructuredData } from "@/components/seo/HomeStructuredData";

export default function Home() {
  const t = useTranslations('Index');
  const locale = useLocale();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showCoaModal, setShowCoaModal] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => setShowStickyBar(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTickerIndex(prev => (prev + 1) % 4), 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-brand-void text-white overflow-hidden font-sans">

      {/* HEADER / NAV */}
      <nav className="fixed top-0 w-full z-50 glass-panel !rounded-none !border-t-0 !border-l-0 !border-r-0 border-b-white/5 py-2 md:py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* Logo Icon */}
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-brand-gold flex items-center justify-center shrink-0">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-brand-gold rounded-full gold-glow"></div>
          </div>
          <span className="text-base md:text-xl font-medium tracking-widest uppercase whitespace-nowrap">
            {t('title')}
          </span>
        </div>
        <div className="hidden md:flex gap-8 text-sm tracking-widest text-white/70 uppercase">
          <a href="#science" className="hover:text-brand-gold transition-colors">{t('nav_science')}</a>
          <a href="#lab" className="hover:text-brand-gold transition-colors">{t('nav_lab')}</a>
          <a href={`/${locale}/order`} className="hover:text-brand-gold transition-colors">{t('nav_order')}</a>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <LanguageSwitcher />
          <a
            href={`/${locale}/portal`}
            className="hidden md:flex items-center justify-center w-9 h-9 rounded-full border border-white/20 hover:border-brand-gold/50 text-white/50 hover:text-brand-gold transition-colors"
            aria-label={t('nav_portal')}
          >
            <User className="w-4 h-4" />
          </a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 md:pt-24 pb-12 px-6">
        {/* Background Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-gold/10 blur-[120px] rounded-full pointer-events-none radial-glow"></div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col gap-2 lg:gap-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-gold/30 bg-brand-gold/5 w-fit whitespace-nowrap self-center">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse shrink-0"></span>
              <span className="text-xs uppercase tracking-[0.2em] text-brand-gold">{t('hero_badge')}</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extralight leading-tight">
              {t('hero_title')} <br />
              <span className="font-semibold text-gradient-gold">Retatrutide</span>
            </h1>

            <p className="text-xs md:text-lg lg:text-xl text-white/60 font-light max-w-lg leading-relaxed line-clamp-3 lg:line-clamp-none">
              {t('hero_subtitle')}
            </p>

            {/* Mobile-only product image — above the fold before CTA */}
            <div className="lg:hidden relative h-36 w-full rounded-2xl overflow-hidden border border-brand-gold/20 bg-brand-void gold-glow">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-void via-brand-void/80 to-[#1a1c1a]" />
              <div className="absolute inset-0">
                <Image
                  src="/images/retatrutide_hero_gold.png"
                  alt="Retatrutide 10mg"
                  fill
                  className="object-cover mix-blend-screen scale-110 opacity-90"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-void via-brand-void/20 to-transparent" />
              </div>
              <div className="absolute bottom-3 inset-x-0 text-center z-10">
                <p className="text-white text-sm font-light">Retatrutide <span className="text-brand-gold font-medium">10mg</span></p>
                <p className="text-brand-gold/70 text-xs font-mono mt-0.5">≥ 99.8% HPLC</p>
              </div>
            </div>

            {/* Mobile: info strip sopra il CTA */}
            <div className="lg:hidden flex flex-col gap-1 px-1">
              <div className="flex items-center gap-1.5">
                <span className="text-brand-gold font-semibold text-sm">97€</span>
                <span className="text-white/40 text-xs">/fiala</span>
                <span className="text-white/20 text-xs">·</span>
                <span className="text-white/50 text-xs">min. 3 box</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Gift className="w-3 h-3 text-brand-gold shrink-0" />
                <span>Acqua batteriostatica 3ml omaggio</span>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 lg:gap-4 lg:mt-8 w-full">
              {/* Desktop: alert sopra il CTA */}
              <div className="hidden lg:block w-full">
                <LiveInventoryBadge />
              </div>

              <PremiumButton
                className="hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] transition-shadow group relative overflow-hidden px-12 py-4 text-lg w-full sm:w-auto"
                onClick={() => window.location.href = `/${locale}/order`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <span className="relative z-10 flex items-center justify-center gap-2 w-full">
                  {t('hero_cta_hook')} <ArrowRight className="w-5 h-5 ml-1" />
                </span>
              </PremiumButton>

              {/* Mobile: alert sotto il CTA */}
              <div className="lg:hidden w-full">
                <LiveInventoryBadge />
              </div>

              <div className="hidden lg:flex items-center gap-2 text-white/50 text-sm pl-2">
                <Lock className="w-3 h-3 text-brand-gold" />
                <span>{t('hero_cta_starting')} <strong className="text-white">97€</strong> {t('hero_cta_per_vial')}</span>
              </div>
            </div>

            {/* TRUST ELEMENTS BATCH 1 (Rec 1, 2, 10) */}
            <div className="flex flex-col gap-4 mt-6 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm max-w-xl">
              {/* Rec 10: Shipping Promise */}
              <div className="flex items-start gap-3 text-brand-gold/90 text-sm">
                <Truck className="w-5 h-5 mt-0.5 shrink-0" />
                <div className="flex flex-col gap-1">
                  <span><strong className="text-white">{t('shipping_promise')}</strong> {t('shipping_condition')}</span>
                  {/* Rec 2: Visual Timeline */}
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-white/60 font-medium mt-1">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> {t('timeline_today')}</div>
                    <span className="text-white/20">👉</span>
                    <div>{t('timeline_tomorrow')}</div>
                    <span className="text-white/20">👉</span>
                    <div className="text-brand-gold">{t('timeline_delivered')}</div>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-white/10 my-1"></div>

              {/* Rec 1: COA Link */}
              <div>
                <button onClick={() => setShowCoaModal(true)} className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors group min-h-[44px] py-2">
                  <FlaskConical className="w-4 h-4 text-brand-gold group-hover:scale-110 transition-transform" />
                  <span className="underline decoration-brand-gold/30 underline-offset-4 group-hover:decoration-brand-gold transition-colors">{t('btn_lab_report')}</span>
                </button>
              </div>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-col gap-6 mt-8 pt-8 border-t border-white/10 hidden md:flex" >
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
                <div className="w-px h-10 bg-white/10"></div>
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-semibold text-white">{t('feature_guarantee')}</span>
                  <span className="text-xs text-brand-gold uppercase tracking-wider">{t('feature_guarantee_sub')}</span>
                </div>
              </div>

              {/* Rec 5 & 9: Sterility and HPLC Standardized Claims */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-brand-gold/20 bg-brand-gold/5 max-w-lg">
                <Shield className="w-8 h-8 text-brand-gold shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">{t('clinical_grade')}</span>
                  <span className="text-xs text-white/70 leading-relaxed mt-1">
                    {t('clinical_desc')}
                  </span>
                </div>
              </div>
            </div>
          </motion.div >

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            className="hidden lg:flex lg:h-[700px] relative items-center justify-center perspective-1000 group"
          >
            <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden glass-panel border-brand-gold/20 p-2 gold-glow transition-all duration-700 group-hover:shadow-[0_0_40px_rgba(255,215,0,0.2)] group-hover:-translate-y-2 group-hover:border-brand-gold/40">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-void via-brand-void/80 to-[#1a1c1a] z-0 transition-opacity duration-700 group-hover:opacity-80"></div>

              {/* Product Image Layer */}
              <div className="absolute inset-0 z-10 p-2">
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  <Image
                    src="/images/retatrutide_hero_gold.png"
                    alt="Retatrutide 10mg premium research peptide vial - 99.8% HPLC verified purity - Aura Peptides Europe"
                    fill
                    className="object-cover mix-blend-screen scale-110 opacity-90 transition-transform duration-1000 group-hover:scale-[1.15]"
                    priority
                  />
                  {/* Overlay dark gradient to ensure text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-void via-brand-void/30 to-transparent"></div>
                </div>
              </div>

              <div className="absolute inset-0 z-20 flex flex-col items-center justify-end p-8 text-center border border-brand-gold/10 rounded-xl m-2 bg-black/20 backdrop-blur-md pointer-events-none transition-all duration-700 group-hover:bg-black/10">
                <h2 className="text-3xl font-light tracking-wide text-white">Retatrutide <span className="text-brand-gold font-medium">10mg</span></h2>
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
        </div >
      </section >

      {/* WHY CHOOSE US / FEATURES */}
      <section id="science" className="py-24 px-6 bg-black relative" >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-light mb-4">{t('section_science_title_1')} <span className="text-brand-gold font-medium">{t('section_science_title_2')}</span></h2>
            <p className="text-white/50 max-w-2xl mx-auto">{t('section_science_desc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} viewport={{ once: true, amount: 0.05 }} transition={{ duration: 0.6 }}
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
              whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} viewport={{ once: true, amount: 0.05 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-panel p-8 group hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden border-brand-gold/30"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-gold to-brand-gold-light"></div>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className="w-24 h-24 text-brand-gold" />
              </div>
              <div className="relative z-10 w-12 h-12 bg-brand-gold/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-gold/20 transition-colors">
                <ShieldCheck className="text-brand-gold w-6 h-6" />
              </div>
              <h3 className="relative z-10 text-xl font-medium mb-3">{t('card2_title')}</h3>
              <p className="relative z-10 text-white/50 text-sm leading-relaxed">{t('card2_desc')}</p>
            </motion.div>

            <motion.div
              whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} viewport={{ once: true, amount: 0.05 }} transition={{ duration: 0.6, delay: 0.2 }}
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
      </section >

      {/* TRUST BADGES & GUARANTEES */}

      {/* Mobile: fade banners in sequenza */}
      <section className="md:hidden py-6 bg-[#0a0a0a] border-t border-b border-white/5">
        {(() => {
          const items = [
            { icon: <ShieldCheck className="w-5 h-5 text-brand-gold shrink-0" />, label: t('ticker_purity') },
            { icon: <FlaskConical className="w-5 h-5 text-brand-gold shrink-0" />, label: t('ticker_lab') },
            { icon: <Package className="w-5 h-5 text-brand-gold shrink-0" />, label: t('ticker_stealth') },
            { icon: <Truck className="w-5 h-5 text-brand-gold shrink-0" />, label: t('ticker_guarantee') },
          ];
          return (
            <>
              <div className="relative h-7 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tickerIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.35 }}
                    className="absolute flex items-center gap-2.5"
                  >
                    {items[tickerIndex].icon}
                    <span className="font-medium text-white/90 text-sm tracking-wide">{items[tickerIndex].label}</span>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex justify-center gap-1.5 mt-2.5">
                {items.map((_, i) => (
                  <div key={i} className={`w-1 h-1 rounded-full transition-colors duration-300 ${i === tickerIndex ? 'bg-brand-gold' : 'bg-white/20'}`} />
                ))}
              </div>
            </>
          );
        })()}
      </section>

      {/* Desktop: infinite scrolling ticker */}
      <section className="hidden md:block py-8 bg-[#0a0a0a] border-t border-b border-white/5 overflow-hidden">
        <div className="relative flex w-full">
          <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-[#0a0a0a] to-transparent z-10"></div>
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#0a0a0a] to-transparent z-10"></div>
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 25, ease: "linear", repeat: Infinity }}
            className="flex gap-16 min-w-max items-center pr-16"
          >
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-16 items-center">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-brand-gold" />
                  <span className="font-medium text-white/90 text-sm tracking-wide">{t('ticker_purity')}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                <div className="flex items-center gap-3">
                  <FlaskConical className="w-6 h-6 text-brand-gold" />
                  <span className="font-medium text-white/90 text-sm tracking-wide">{t('ticker_lab')}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-brand-gold" />
                  <span className="font-medium text-white/90 text-sm tracking-wide">{t('ticker_stealth')}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                <div className="flex items-center gap-3">
                  <Truck className="w-6 h-6 text-brand-gold" />
                  <span className="font-medium text-white/90 text-sm tracking-wide">{t('ticker_guarantee')}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* QUALITY PIPELINE */}
      <section className="py-24 px-6 bg-brand-void relative" id="quality" >
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
            <button onClick={() => setShowCoaModal(true)} className="inline-flex items-center gap-2 text-sm text-brand-gold hover:text-brand-gold-light transition-colors underline underline-offset-4 decoration-brand-gold/30 min-h-[44px] py-2 px-3">
              <FlaskConical className="w-4 h-4" />
              {t('btn_view_coa')}
            </button>
          </div>
        </div>
      </section >

      {/* TESTIMONIALS (Rec 4) */}
      <section className="py-24 px-6 bg-brand-void border-t border-white/5 relative overflow-hidden" id="testimonials" >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-gold/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-light mb-4 text-white">{t('trust_earned')} <span className="text-brand-gold font-medium">{t('trust_earned_gold')}</span></h2>
            <p className="text-white/50 max-w-2xl mx-auto">{t('trust_earned_sub')}</p>
          </div>

          {/* Trust micro-badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs text-white/70 font-medium">
              <span className="w-2 h-2 rounded-full bg-brand-gold shrink-0"></span>
              HPLC ≥99.8% Verified
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs text-white/70 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-400 shrink-0"></span>
              EU Direct Shipping
            </div>
            <button
              onClick={() => setShowCoaModal(true)}
              className="flex items-center gap-2 bg-brand-gold/10 border border-brand-gold/30 px-4 py-2 rounded-full text-xs text-brand-gold font-medium hover:bg-brand-gold/20 transition-colors"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Janoshik Tested — {t('trust_badge_view_report')}
            </button>
          </div>
          <motion.div
            whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true, amount: 0.05 }} transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="glass-panel p-8 border-brand-gold/20 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex text-brand-gold text-lg">★★★★★</div>
                <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full"><Shield className="w-3 h-3" /> {t('verified_buyer')}</span>
              </div>
              <p className="text-white/80 leading-relaxed italic">{t('review_1_desc')}</p>
              <div className="mt-auto pt-4 border-t border-white/10 flex flex-col">
                <span className="text-white font-medium">{t('review_1_name')}</span>
                <span className="text-brand-gold/70 text-sm">{t('review_1_item')}</span>
              </div>
            </div>
            <div className="glass-panel p-8 border-brand-gold/20 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex text-brand-gold text-lg">★★★★★</div>
                <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full"><Shield className="w-3 h-3" /> {t('verified_buyer')}</span>
              </div>
              <p className="text-white/80 leading-relaxed italic">{t('review_2_desc')}</p>
              <div className="mt-auto pt-4 border-t border-white/10 flex flex-col">
                <span className="text-white font-medium">{t('review_2_name')}</span>
                <span className="text-brand-gold/70 text-sm">{t('review_2_item')}</span>
              </div>
            </div>
            <div className="glass-panel p-8 border-brand-gold/20 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex text-brand-gold text-lg">★★★★★</div>
                <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full"><Shield className="w-3 h-3" /> {t('verified_buyer')}</span>
              </div>
              <p className="text-white/80 leading-relaxed italic">{t('review_3_desc')}</p>
              <div className="mt-auto pt-4 border-t border-white/10 flex flex-col">
                <span className="text-white font-medium">{t('review_3_name')}</span>
                <span className="text-brand-gold/70 text-sm">{t('review_3_item')}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section >

      {/* WHY AURA */}
      <section className="py-24 px-6 border-t border-white/5" >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-light mb-4 text-white">{t('why_title')} <span className="text-brand-gold font-medium">{t('why_subtitle')}</span></h2>
          </div>
          <motion.div
            whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true, amount: 0.05 }} transition={{ duration: 0.6 }}
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
      <section className="py-16 px-6 border-t border-white/5" >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-medium text-white mb-8 flex items-center gap-3">
            <Thermometer className="w-5 h-5 text-brand-gold" />
            {t('specs_title')}
          </h2>
          <div className="glass-panel border-white/5 overflow-hidden">
            {[
              { label: t('specs_format'), value: t('specs_format_val') },
              { label: t('specs_purity'), value: t('specs_purity_val') },
              { label: t('specs_storage'), value: t('specs_storage_val') },
              { label: t('specs_reconstituted'), value: t('specs_reconstituted_val') },
              { label: t('specs_solvent'), value: t('specs_solvent_val') },
              { label: t('specs_cas'), value: t('specs_cas_val') },
            ].map((row, i) => (
              <div key={i} className={`flex flex-col sm:flex-row sm:justify-between sm:items-center px-6 py-4 gap-1 ${i < 5 ? 'border-b border-white/5' : ''}`}>
                <span className="text-sm text-white/50">{row.label}</span>
                <span className="text-sm text-white font-medium font-mono sm:text-right">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* PEPTIDE CALCULATOR CTA (Rec 7) */}
      <section className="py-12 px-6 bg-brand-gold/5 border-t border-brand-gold/20" >
        <div className="max-w-4xl mx-auto glass-panel p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-brand-gold/30 gold-glow">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-void border border-brand-gold flex items-center justify-center shrink-0">
              <FlaskConical className="w-8 h-8 text-brand-gold" />
            </div>
            <div>
              <h3 className="text-2xl font-medium text-white">{t('calculator_title')}</h3>
              <p className="text-white/60 text-sm mt-1">{t('calculator_desc')}</p>
            </div>
          </div>
          <a href={`/${locale}/calculator`}><PremiumButton variant="outline">{t('calculator_cta')}</PremiumButton></a>
        </div>
      </section >

      {/* BUYER PROTECTION BOX */}
      <section className="py-16 px-6 bg-brand-void border-t border-white/5" >
        <div className="max-w-3xl mx-auto">
          <div className="glass-panel p-8 border-green-500/30 bg-green-500/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400"></div>
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-7 h-7 text-green-400" />
              </div>
              <div className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-white">{t('buyer_protection_title')}</h2>
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
              <ShieldCheck className="w-4 h-4 text-brand-gold" /> {/* Changed Lock to ShieldCheck */}
              <span className="text-xs uppercase tracking-[0.2em] text-brand-gold font-medium">{t('faq_category_ordering')}</span>
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
                    <div className={`px-6 text-white/60 text-sm leading-relaxed transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[800px] pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
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
              <span className="text-xs uppercase tracking-[0.2em] text-brand-gold font-medium">{t('faq_category_policy')}</span>
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
                    <div className={`px-6 text-white/60 text-sm leading-relaxed transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[800px] pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                      {t(`faq_a${num}`)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Support CTA at the bottom of FAQ */}
          <div className="mt-12 text-center">
            <p className="text-white/40 text-sm">{t('faq_contact_pre')}<a href="mailto:support@retatrutide-research.com" className="text-brand-gold hover:text-brand-gold-light underline underline-offset-4 decoration-brand-gold/30 transition-colors">{t('faq_contact_link')}</a></p>
          </div>
        </div>
      </section >

      {/* FOOTER - MIAMI STYLE (Rec 3) */}
      < footer className="border-t border-white/5 py-12 px-6 bg-brand-void" >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-sm text-white/40 mb-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full border border-brand-gold flex items-center justify-center">
                <div className="w-2 h-2 bg-brand-gold rounded-full gold-glow"></div>
              </div>
              <span className="text-lg font-medium tracking-widest uppercase text-white">Retatrutide</span>
            </div>
            <p>{t('footer_description')}</p>
          </div>

          <div className="flex flex-col gap-4 md:col-start-3">
            <h4 className="text-white font-medium uppercase tracking-widest text-xs mb-2">{t('footer_office_title')}</h4>
            <p className="flex items-center gap-2"><Navigation className="w-4 h-4 text-brand-gold" /> {t('footer_office_address')}</p>
            <p className="flex items-center gap-2">📧 {t('footer_office_email')}</p>
            <p className="flex items-center gap-2">⏱️ {t('footer_office_hours')}</p>
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
              <ShieldCheck className="w-3 h-3 text-brand-gold" /> {t('footer_secure')} {/* Changed Lock to ShieldCheck */}
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
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="text-xl md:text-2xl font-light text-white flex items-center gap-3">
                  <FlaskConical className="w-6 h-6 text-brand-gold" />
                  {t('lab_title')}
                </h3>
                <button onClick={() => setShowCoaModal(false)} className="text-white/50 hover:text-white transition-colors">
                  ✕
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/2 rounded-xl overflow-hidden border border-brand-gold/20 relative group bg-black/50">
                  <div className="absolute inset-0 bg-brand-gold/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-sm">
                    <PremiumButton onClick={() => window.open('/assets/janoshik-coa-retatrutide-10mg.png', '_blank')} className="scale-90">
                      {t('lab_verify')}
                    </PremiumButton>
                  </div>
                  <Image
                    src="/assets/janoshik-coa-retatrutide-10mg.png"
                    alt="Janoshik Certificate of Analysis - Retatrutide 10mg purity verification 99.86% HPLC tested"
                    width={800}
                    height={1000}
                    className="w-full h-auto object-cover opacity-80"
                  />
                </div>

                <div className="w-full md:w-1/2 flex flex-col justify-center gap-6">
                  <div className="flex flex-col gap-2 border-b border-white/5 pb-4">
                    <span className="text-sm text-brand-gold tracking-widest uppercase">{t('lab_compound')}</span>
                    <span className="text-xl text-white font-medium">Retatrutide (LY3437943)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col"><span className="text-xs text-white/50">{t('lab_declared')}</span><span className="text-white font-medium">10.0 mg</span></div>
                    <div className="flex flex-col"><span className="text-xs text-white/50">{t('lab_measured')}</span><span className="text-white font-medium">10.12 mg</span></div>
                    <div className="flex flex-col"><span className="text-xs text-white/50">{t('lab_purity')}</span><span className="text-brand-gold font-medium">99.86%</span></div>
                    <div className="flex flex-col"><span className="text-xs text-white/50">{t('lab_status')}</span><span className="text-green-400 font-medium flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> {t('lab_pass')}</span></div>
                  </div>
                  <div className="mt-8">
                    <PremiumButton onClick={() => window.open('/assets/janoshik-coa-retatrutide-10mg.png', '_blank')} className="scale-90">
                      {t('lab_download')}
                    </PremiumButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* STICKY MOBILE PURCHASE BAR */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-brand-void/95 backdrop-blur-xl border-t border-brand-gold/20 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
          {/* Prezzo */}
          <div className="flex flex-col shrink-0 min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] text-white/40 leading-none mr-0.5">{t('hero_cta_starting')}</span>
              <span className="text-lg font-bold text-brand-gold leading-none">97€</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0"></span>
              <span className="text-[10px] text-red-400 leading-none whitespace-nowrap">{t('inventory_high_demand')} 47 {t('inventory_kits_remaining')}</span>
            </div>
          </div>
          <PremiumButton
            className="flex-1 !py-2.5 !text-sm"
            onClick={() => window.location.href = `/${locale}/order`}
          >
            <span className="flex items-center justify-center gap-2">
              {t('hero_cta_hook')} <ArrowRight className="w-4 h-4" />
            </span>
          </PremiumButton>
        </div>
      )}

      {/* DYNAMIC TRUST: RECENT SALES POPUP */}
      <RecentSalesPopup />

      {/* SEO: Structured Data */}
      <HomeStructuredData />

    </main>
  );
}
