"use client";

import { motion } from "framer-motion";
import { Shield, ShieldCheck, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

export function FeaturesSection() {
  const t = useTranslations('Index');

  return (
    <section id="science" className="py-16 px-6 bg-brand-void relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
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
    </section>
  );
}
