"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Users, ShieldCheck, Truck, Headphones } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { usePostHog } from "posthog-js/react";

export function HeroSectionLight() {
  const t = useTranslations('Index');
  const locale = useLocale();
  const posthog = usePostHog();

  return (
    <section className="relative bg-t-bg-alt">
      {/* Hero content */}
      <div className="max-w-[1140px] mx-auto px-6 pt-32 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-5"
          >
            {/* Badge pill */}
            <span className="inline-flex items-center self-start text-[11px] uppercase tracking-[0.14em] text-t-text-2 font-medium bg-t-bg-card border border-t-border rounded-full px-4 py-1.5">
              {t('hero_badge')}
            </span>

            {/* Heading */}
            <h1 className="text-[2.75rem] md:text-[3.5rem] lg:text-[4rem] leading-[1.05] tracking-tight font-bold text-t-text">
              {t('hero_title')}
              <br />
              Retatrutide
            </h1>

            {/* Subtitle */}
            <p className="text-[15px] md:text-base leading-[1.7] text-t-text-2 font-light max-w-[480px]">
              {t('hero_subtitle')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  posthog?.capture('cta_clicked', { location: 'hero_light', locale });
                  (window as any).clarity?.("set", "cta_clicked", "hero_light");
                  window.location.href = `/${locale}/order`;
                }}
                className="inline-flex items-center justify-center gap-2 bg-t-btn text-t-btn-text px-7 py-3 rounded-lg font-medium text-[15px] hover:opacity-90 transition-opacity"
              >
                {t('hero_cta_hook')} <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('product-specs');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center gap-2 border border-t-border text-t-text px-7 py-3 rounded-lg font-medium text-[15px] hover:bg-t-bg-subtle transition-colors"
              >
                {t('light_view_research')}
              </button>
            </div>

            {/* Trust checkmarks */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-1">
              {[
                { main: `${t('feature_eu')} ${t('feature_eu_sub')}` },
                { main: t('feature_crypto'), sub: `(${t('feature_crypto_sub')})` },
                { main: t('feature_guarantee'), sub: `(${t('feature_guarantee_sub')})` },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-[18px] h-[18px] text-t-btn mt-0.5 shrink-0" fill="currentColor" strokeWidth={0} />
                  <span className="text-[13px] text-t-text leading-snug">
                    <span className="font-semibold">{item.main}</span>
                    {item.sub && <span className="text-t-text-3 font-normal"> {item.sub}</span>}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — vial */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative flex items-center justify-center lg:justify-end"
          >
            <Image
              src="/images/vial_v7_white.webp"
              alt="Retatrutide 10mg premium research peptide vial"
              width={420}
              height={520}
              className="w-auto h-[300px] md:h-[380px] lg:h-[440px] object-contain"
              priority
            />
          </motion.div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="border-t border-t-border bg-t-bg">
        <div className="max-w-[1140px] mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: <Users className="w-6 h-6" />, value: "25+", label: t('light_stat_reviews') },
              { icon: <ShieldCheck className="w-6 h-6" />, value: "99.8%", label: t('light_stat_purity') },
              { icon: <Truck className="w-6 h-6" />, value: "3-5 Day", label: t('light_stat_delivery') },
              { icon: <Headphones className="w-6 h-6" />, value: "24/7", label: t('light_stat_support') },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3 justify-center">
                <div className="text-t-text-3">{stat.icon}</div>
                <div>
                  <div className="text-xl font-bold text-t-text leading-none">{stat.value}</div>
                  <div className="text-[11px] text-t-text-3 mt-0.5">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
