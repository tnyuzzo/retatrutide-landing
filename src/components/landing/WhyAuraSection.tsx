"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function WhyAuraSection() {
  const t = useTranslations('Index');

  return (
    <section className="py-16 px-6 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
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
    </section>
  );
}
