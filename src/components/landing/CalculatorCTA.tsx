"use client";

import { FlaskConical } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useTranslations, useLocale } from "next-intl";

export function CalculatorCTA() {
  const t = useTranslations('Index');
  const locale = useLocale();

  return (
    <section className="py-12 px-6 bg-brand-void border-t border-white/5">
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
    </section>
  );
}
