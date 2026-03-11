"use client";

import { User } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

export function Navbar() {
  const t = useTranslations('Index');
  const locale = useLocale();

  return (
    <nav className="fixed top-0 w-full z-50 glass-panel !rounded-none !border-t-0 !border-l-0 !border-r-0 border-b-white/5 py-2 md:py-4 px-6 md:px-8 lg:px-12 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-brand-gold flex items-center justify-center shrink-0">
          <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-brand-gold rounded-full gold-glow"></div>
        </div>
        <span className="text-base md:text-xl font-medium tracking-widest uppercase whitespace-nowrap">
          {t('title')}
        </span>
      </div>
      <div className="flex items-center gap-3 md:gap-6">
        <a href={`/${locale}/calculator`} className="hidden md:inline-block text-xs lg:text-sm tracking-widest text-white/70 uppercase whitespace-nowrap hover:text-brand-gold transition-colors">{t('nav_calculator')}</a>
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
  );
}
