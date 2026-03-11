"use client";

import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

export function BuyerProtection() {
  const t = useTranslations('Index');

  return (
    <section className="py-12 px-6 bg-brand-void border-t border-white/5">
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
    </section>
  );
}
