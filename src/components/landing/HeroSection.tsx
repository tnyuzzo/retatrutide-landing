"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Shield, Lock, Truck, ArrowRight, Gift } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useTranslations, useLocale } from "next-intl";
import { usePostHog } from "posthog-js/react";
import { LiveInventoryBadge } from "@/components/ui/LiveInventoryBadge";

export function HeroSection() {
  const t = useTranslations('Index');
  const locale = useLocale();
  const posthog = usePostHog();

  return (
    <section className="relative md:min-h-screen flex items-start md:items-center justify-center pt-16 md:pt-24 pb-16 md:pb-12 px-6">
      {/* Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-t-accent/10 blur-[120px] rounded-full pointer-events-none radial-glow"></div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">

        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex flex-col items-center lg:items-start text-center lg:text-left gap-5 lg:gap-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-t-accent/30 bg-t-accent/5 w-fit whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-t-accent animate-pulse shrink-0"></span>
            <span className="text-xs uppercase tracking-[0.2em] text-t-accent">{t('hero_badge')}</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-extralight leading-tight">
            {t('hero_title')} <br />
            <span className="font-semibold text-gradient-gold">Retatrutide</span>
          </h1>

          <p className="text-xs md:text-lg lg:text-xl text-t-text-2 font-light max-w-lg mx-auto lg:mx-0 leading-relaxed line-clamp-3 md:line-clamp-none">
            {t('hero_subtitle')}
          </p>

          {/* Mobile + Tablet product image — above the fold before CTA */}
          <div className="lg:hidden relative h-44 sm:h-52 md:h-80 w-full md:max-w-2xl mx-auto lg:mx-0 rounded-2xl overflow-hidden border border-t-accent/20 bg-t-bg-card gold-glow">
            <div className="absolute inset-0">
              <Image
                src="/images/product_hero_v5_wide.webp"
                alt="Retatrutide 10mg"
                fill
                className="object-cover object-center opacity-95"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
            <div className="absolute bottom-3 inset-x-0 text-center z-10">
              <p className="text-t-text text-sm font-light">Retatrutide <span className="text-t-accent font-medium">10mg</span></p>
              <p className="text-t-accent/70 text-xs font-mono mt-0.5">≥ 99.8% HPLC</p>
            </div>
          </div>

          {/* Mobile/Tablet: info strip sopra il CTA */}
          <div className="lg:hidden flex items-center flex-wrap justify-center gap-x-1.5 gap-y-0.5 px-1">
            <span className="text-t-accent font-semibold text-sm">99€</span>
            <span className="text-t-text-4 text-xs">/{t('hero_per_vial')}</span>
            <span className="text-t-text-4 text-xs">·</span>
            <span className="text-t-text-3 text-xs">{t('hero_min_qty')}</span>
            <span className="text-t-text-4 text-xs">·</span>
            <span className="flex items-center gap-1 text-xs text-t-text-3">
              <Gift className="w-3 h-3 text-t-accent shrink-0" />
              {t('hero_free_bac_water')}
            </span>
          </div>

          <div className="flex flex-col items-center lg:items-start gap-3 lg:gap-4 lg:mt-8 w-full">
            {/* Desktop: alert sopra il CTA */}
            <div className="hidden lg:block w-full">
              <LiveInventoryBadge />
            </div>

            <PremiumButton
              className="shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] hover:scale-105 transition-all duration-300 group relative overflow-hidden px-12 py-4 text-lg w-full sm:w-auto"
              onClick={() => { posthog?.capture('cta_clicked', { location: 'hero', locale }); (window as any).clarity?.("set", "cta_clicked", "hero"); window.location.href = `/${locale}/order`; }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-t-text/10 to-transparent animate-[shimmer_3s_ease-in-out_infinite]"></div>
              <span className="relative z-10 flex items-center justify-center gap-2 w-full">
                {t('hero_cta_hook')} <ArrowRight className="w-5 h-5 ml-1" />
              </span>
            </PremiumButton>

            {/* Mobile/Tablet: alert sotto il CTA */}
            <div className="lg:hidden w-full flex justify-center">
              <LiveInventoryBadge />
            </div>

            <div className="hidden lg:flex items-center gap-2 text-t-text-3 text-sm pl-2">
              <Lock className="w-3 h-3 text-t-accent" />
              <span>{t('hero_cta_starting')} <strong className="text-t-text">99€</strong> {t('hero_cta_per_vial')}</span>
            </div>
          </div>

          {/* TRUST ELEMENTS BATCH 1 (Rec 1, 2, 10) */}
          <div className="flex flex-col gap-4 mt-6 p-5 rounded-2xl bg-t-bg-subtle border border-t-border backdrop-blur-sm max-w-xl mx-auto lg:mx-0">
            {/* Rec 10: Shipping Promise */}
            <div className="flex items-start gap-3 text-t-accent text-sm">
              <Truck className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1">
                <span><strong className="text-t-text">{t('shipping_promise')}</strong> <span className="block md:inline mt-0.5 md:mt-0">{t('shipping_condition')}</span></span>
                <div className="flex items-center gap-1.5 text-xs text-t-text-2 font-medium mt-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></span>
                  <span>{t('shipping_timeline_simple')}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Trust Signals */}
          <div className="hidden md:flex flex-col items-center lg:items-start gap-6 mt-8 pt-8 border-t border-t-border" >
            <div className="flex items-center gap-8">
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-semibold text-t-text">{t('feature_eu')}</span>
                <span className="text-xs text-t-accent uppercase tracking-wider">{t('feature_eu_sub')}</span>
              </div>
              <div className="w-px h-10 bg-t-bg-subtle"></div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-semibold text-t-text">{t('feature_crypto')}</span>
                <span className="text-xs text-t-accent uppercase tracking-wider">{t('feature_crypto_sub')}</span>
              </div>
              <div className="w-px h-10 bg-t-bg-subtle"></div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-semibold text-t-text">{t('feature_guarantee')}</span>
                <span className="text-xs text-t-accent uppercase tracking-wider">{t('feature_guarantee_sub')}</span>
              </div>
            </div>

            {/* Rec 5 & 9: Sterility and HPLC Standardized Claims */}
            <div className="flex items-start gap-4 p-4 rounded-xl border border-t-accent/20 bg-t-accent/5 max-w-lg mx-auto lg:mx-0">
              <Shield className="w-8 h-8 text-t-accent shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-t-text">{t('clinical_grade')}</span>
                <span className="text-xs text-t-text-2 leading-relaxed mt-1">
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
          <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden glass-panel border-t-accent/20 p-2 gold-glow transition-all duration-700 group-hover:shadow-[0_0_40px_rgba(255,215,0,0.2)] group-hover:-translate-y-2 group-hover:border-t-accent/40">
            {/* Product Image Layer */}
            <div className="absolute inset-0 z-10 p-2">
              <div className="relative w-full h-full rounded-xl overflow-hidden">
                <Image
                  src="/images/product_hero_v5.webp"
                  alt="Retatrutide 10mg premium research peptide vial - 99.8% HPLC verified purity - Aura Peptides Europe"
                  fill
                  className="theme-dark-only object-cover object-center opacity-95 transition-transform duration-1000 group-hover:scale-[1.04]"
                  priority
                />
                <Image
                  src="/images/vial_v7_white.webp"
                  alt="Retatrutide 10mg premium research peptide vial - 99.8% HPLC verified purity - Aura Peptides Europe"
                  fill
                  className="theme-light-only object-cover object-center opacity-95 transition-transform duration-1000 group-hover:scale-[1.04]"
                  priority
                />
                {/* Overlay dark gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              </div>
            </div>

            <div className="absolute inset-0 z-20 flex flex-col items-center justify-end p-8 text-center border border-t-accent/10 rounded-xl m-2 pointer-events-none transition-all duration-700">
              <h2 className="text-3xl font-light tracking-wide text-t-text drop-shadow-lg">Retatrutide <span className="text-t-accent font-medium">10mg</span></h2>
              <p className="text-t-accent/80 text-sm mt-2 font-mono drop-shadow">CAS: 2381089-83-2</p>
              <p className="text-t-text-2 text-xs mt-4 drop-shadow">{t('vial_purity')}</p>
            </div>
          </div>

          {/* Floating UI Elements */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-4 md:-right-12 top-1/4 glass-panel p-4 flex items-center gap-4 border border-t-accent/20"
          >
            <div className="p-2 bg-t-accent/10 rounded-full"><Shield className="text-t-accent w-5 h-5" /></div>
            <div>
              <p className="text-xs text-t-text-3 uppercase tracking-widest">{t('purity_level')}</p>
              <p className="text-lg text-t-accent font-mono">&ge; 99.8%</p>
            </div>
          </motion.div>

        </motion.div>
      </div >
    </section >
  );
}
