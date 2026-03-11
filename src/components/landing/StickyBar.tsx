"use client";

import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useTranslations, useLocale } from "next-intl";
import { usePostHog } from "posthog-js/react";
import { useStock } from "@/components/ui/useStock";

export function StickyBar() {
  const t = useTranslations('Index');
  const locale = useLocale();
  const posthog = usePostHog();
  const stock = useStock();
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowStickyBar(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!showStickyBar) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-brand-void/95 backdrop-blur-xl border-t border-brand-gold/20 px-4 py-3 flex items-center justify-between gap-4 shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-white/40 leading-none">{t('hero_cta_starting')}</span>
          <span className="text-2xl font-bold text-brand-gold leading-none">99€</span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0"></span>
          <span className="text-xs text-red-400 leading-none whitespace-nowrap">{t('inventory_high_demand')} <strong className="text-white tabular-nums">{stock}</strong> {t('inventory_kits_remaining')}</span>
        </div>
      </div>
      <PremiumButton
        className="shrink-0 !py-2.5 !px-10 !text-sm"
        onClick={() => { posthog?.capture('cta_clicked', { location: 'sticky_bar', locale }); (window as any).clarity?.("set", "cta_clicked", "sticky_bar"); window.location.href = `/${locale}/order`; }}
      >
        <span className="flex items-center gap-2">
          {t('hero_cta_hook')} <ArrowRight className="w-4 h-4" />
        </span>
      </PremiumButton>
    </div>
  );
}
