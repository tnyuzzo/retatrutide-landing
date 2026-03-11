"use client";

import { Shield, ShieldCheck, Zap, FlaskConical, Beaker, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

export function QualityPipeline() {
  const t = useTranslations('Index');

  return (
    <section className="py-16 px-6 bg-brand-void relative" id="quality">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-gold/3 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-light mb-4 text-white">{t('qa_title')} <span className="text-brand-gold font-medium">{t('qa_subtitle')}</span></h2>
          <p className="text-white/50 max-w-2xl mx-auto">{t('qa_desc')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { icon: <Beaker className="w-5 h-5" />, key: 'qa_step1' },
            { icon: <FlaskConical className="w-5 h-5" />, key: 'qa_step2' },
            { icon: <Zap className="w-5 h-5" />, key: 'qa_step3' },
            { icon: <Shield className="w-5 h-5" />, key: 'qa_step4' },
            { icon: <ShieldCheck className="w-5 h-5" />, key: 'qa_step5' },
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-3 relative">
              <div className="w-14 h-14 rounded-full border border-brand-gold/30 bg-brand-gold/5 flex items-center justify-center text-brand-gold">
                {step.icon}
              </div>
              {i < 4 && <ArrowRight className="hidden md:block absolute -right-4 top-4 w-4 h-4 text-brand-gold/30" />}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-brand-gold/60 font-mono">0{i + 1}</span>
                <span className="text-sm font-medium text-white">{t(`${step.key}_title`)}</span>
                <span className="text-xs text-white/40 leading-relaxed">{t(`${step.key}_desc`)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
