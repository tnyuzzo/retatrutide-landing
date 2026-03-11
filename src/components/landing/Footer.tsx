"use client";

import { ShieldCheck, Navigation } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

export function Footer() {
  const t = useTranslations('Index');

  return (
    <footer className="border-t border-white/5 py-10 px-6 bg-brand-void">
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
            <ShieldCheck className="w-3 h-3 text-brand-gold" /> {t('footer_secure')}
          </span>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
