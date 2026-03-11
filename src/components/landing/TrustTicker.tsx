"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, FlaskConical, Package, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

export function TrustTicker() {
  const t = useTranslations('Index');
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTickerIndex(prev => (prev + 1) % 4), 2500);
    return () => clearInterval(interval);
  }, []);

  const items = [
    { icon: <ShieldCheck className="w-5 h-5 text-brand-gold shrink-0" />, label: t('ticker_purity') },
    { icon: <FlaskConical className="w-5 h-5 text-brand-gold shrink-0" />, label: t('ticker_lab') },
    { icon: <Package className="w-5 h-5 text-brand-gold shrink-0" />, label: t('ticker_stealth') },
    { icon: <Truck className="w-5 h-5 text-brand-gold shrink-0" />, label: t('ticker_guarantee') },
  ];

  return (
    <>
      {/* Mobile: fade banners in sequenza */}
      <section className="md:hidden py-6 bg-brand-void border-t border-b border-white/5">
        <div className="relative h-7 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={tickerIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              className="absolute flex items-center gap-2.5"
            >
              {items[tickerIndex].icon}
              <span className="font-medium text-white/90 text-sm tracking-wide">{items[tickerIndex].label}</span>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex justify-center gap-1.5 mt-2.5">
          {items.map((_, i) => (
            <div key={i} className={`w-1 h-1 rounded-full transition-colors duration-300 ${i === tickerIndex ? 'bg-brand-gold' : 'bg-white/20'}`} />
          ))}
        </div>
      </section>

      {/* Desktop: infinite scrolling ticker */}
      <section className="hidden md:block py-8 bg-brand-void border-t border-b border-white/5 overflow-hidden">
        <div className="relative flex w-full">
          <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-brand-void to-transparent z-10"></div>
          <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-brand-void to-transparent z-10"></div>
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 25, ease: "linear", repeat: Infinity }}
            className="flex gap-16 min-w-max items-center pr-16"
          >
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-16 items-center">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-brand-gold" />
                  <span className="font-medium text-white/90 text-sm tracking-wide">{t('ticker_purity')}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                <div className="flex items-center gap-3">
                  <FlaskConical className="w-6 h-6 text-brand-gold" />
                  <span className="font-medium text-white/90 text-sm tracking-wide">{t('ticker_lab')}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-brand-gold" />
                  <span className="font-medium text-white/90 text-sm tracking-wide">{t('ticker_stealth')}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                <div className="flex items-center gap-3">
                  <Truck className="w-6 h-6 text-brand-gold" />
                  <span className="font-medium text-white/90 text-sm tracking-wide">{t('ticker_guarantee')}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
}
