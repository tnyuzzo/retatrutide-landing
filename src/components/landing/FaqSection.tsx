"use client";

import { useState } from "react";
import { Shield, ShieldCheck, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePostHog } from "posthog-js/react";

export function FaqSection() {
  const t = useTranslations('Index');
  const posthog = usePostHog();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className="py-16 px-6 bg-brand-void relative" id="faq">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-light mb-4 text-white">
            {t('faq_title')}
          </h2>
          <p className="text-white/50">{t('faq_subtitle')}</p>
        </div>

        {/* Ordering & Payment */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-brand-gold" />
            <span className="text-xs uppercase tracking-[0.2em] text-brand-gold font-medium">{t('faq_category_ordering')}</span>
          </div>
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5, 6].map((num) => {
              const isOpen = openFaq === num;
              return (
                <div key={num} className={`glass-panel overflow-hidden transition-all duration-300 border ${isOpen ? 'border-brand-gold/50' : 'border-white/5'}`}>
                  <button onClick={() => { if (!isOpen) { posthog?.capture('faq_opened', { question: num }); (window as any).clarity?.("set", "faq_opened", String(num)); } setOpenFaq(isOpen ? null : num); }} className="w-full flex justify-between items-center p-6 text-left">
                    <span className="font-medium text-white/90">{t(`faq_q${num}`)}</span>
                    <ChevronDown className={`w-5 h-5 text-brand-gold shrink-0 ml-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`px-6 text-white/60 text-sm leading-relaxed transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[800px] pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                    {t(`faq_a${num}`)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Policy & Legal */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-brand-gold" />
            <span className="text-xs uppercase tracking-[0.2em] text-brand-gold font-medium">{t('faq_category_policy')}</span>
          </div>
          <div className="flex flex-col gap-3">
            {[7, 8, 9].map((num) => {
              const isOpen = openFaq === num;
              return (
                <div key={num} className={`glass-panel overflow-hidden transition-all duration-300 border ${isOpen ? 'border-brand-gold/50' : 'border-white/5'}`}>
                  <button onClick={() => { if (!isOpen) { posthog?.capture('faq_opened', { question: num }); (window as any).clarity?.("set", "faq_opened", String(num)); } setOpenFaq(isOpen ? null : num); }} className="w-full flex justify-between items-center p-6 text-left">
                    <span className="font-medium text-white/90">{t(`faq_q${num}`)}</span>
                    <ChevronDown className={`w-5 h-5 text-brand-gold shrink-0 ml-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`px-6 text-white/60 text-sm leading-relaxed transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[800px] pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                    {t(`faq_a${num}`)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Support CTA */}
        <div className="mt-12 text-center">
          <p className="text-white/40 text-sm">{t('faq_contact_pre')}<a href="mailto:support@retatrutide-research.com" className="text-brand-gold hover:text-brand-gold-light underline underline-offset-4 decoration-brand-gold/30 transition-colors">{t('faq_contact_link')}</a></p>
        </div>
      </div>
    </section>
  );
}
