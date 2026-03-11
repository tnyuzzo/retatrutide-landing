"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";

export function TestimonialsSection() {
  const t = useTranslations('Index');
  const [orderCount, setOrderCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/recent-activity')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.totalOrders > 0) setOrderCount(data.totalOrders); })
      .catch(() => {/* fallback to static */});
  }, []);

  return (
    <section className="py-16 px-6 bg-brand-void border-t border-white/5 relative overflow-hidden" id="testimonials">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-gold/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-light mb-4 text-white">{t('trust_earned')} <span className="text-brand-gold font-medium">{t('trust_earned_gold')}</span></h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            {t('trust_earned_sub', { count: (orderCount ?? 7496).toLocaleString() })}
          </p>
        </div>

        {/* Trust micro-badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs text-white/70 font-medium">
            <span className="w-2 h-2 rounded-full bg-brand-gold shrink-0"></span>
            {t('review_badge_hplc')}
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs text-white/70 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-400 shrink-0"></span>
            {t('review_badge_shipping')}
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs text-white/70 font-medium">
            <span className="w-2 h-2 rounded-full bg-brand-gold shrink-0"></span>
            {t('review_badge_lab')}
          </div>
        </div>
        <motion.div
          whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true, amount: 0.05 }} transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[1, 2, 3].map((num) => (
            <div key={num} className="glass-panel p-8 border-brand-gold/20 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex text-brand-gold text-lg">★★★★★</div>
                <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full"><Shield className="w-3 h-3" /> {t('verified_buyer')}</span>
              </div>
              <p className="text-white/80 leading-relaxed italic">{t(`review_${num}_desc`)}</p>
              <div className="mt-auto pt-4 border-t border-white/10 flex flex-col">
                <span className="text-white font-medium">{t(`review_${num}_name`)}</span>
                <span className="text-brand-gold/70 text-sm">{t(`review_${num}_item`)}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
