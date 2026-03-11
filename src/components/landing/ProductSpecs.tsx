"use client";

import { Thermometer } from "lucide-react";
import { useTranslations } from "next-intl";

export function ProductSpecs() {
  const t = useTranslations('Index');

  return (
    <section className="py-16 px-6 border-t border-white/5">
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
    </section>
  );
}
