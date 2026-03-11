"use client";

import Image from "next/image";
import { FlaskConical, ShieldCheck } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useTranslations } from "next-intl";

interface CoaModalProps {
  open: boolean;
  onClose: () => void;
}

export function CoaModal({ open, onClose }: CoaModalProps) {
  const t = useTranslations('Index');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative glass-panel border-brand-gold/30 p-2 md:p-6 max-w-4xl w-full h-[90vh] md:h-[80vh] flex flex-col gold-glow animate-fade-in bg-[#050505]">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <h3 className="text-xl md:text-2xl font-light text-white flex items-center gap-3">
            <FlaskConical className="w-6 h-6 text-brand-gold" />
            {t('lab_title')}
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2 rounded-xl overflow-hidden border border-brand-gold/20 relative group bg-black/50">
            <div className="absolute inset-0 bg-brand-gold/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-sm">
              <PremiumButton onClick={() => window.open('/assets/janoshik-coa-retatrutide-10mg.png', '_blank')} className="scale-90">
                {t('lab_verify')}
              </PremiumButton>
            </div>
            <Image
              src="/assets/janoshik-coa-retatrutide-10mg.png"
              alt="Certificate of Analysis - Retatrutide 10mg purity verification 99.86% HPLC tested"
              width={800}
              height={1000}
              className="w-full h-auto object-cover opacity-80"
            />
          </div>

          <div className="w-full md:w-1/2 flex flex-col justify-center gap-6">
            <div className="flex flex-col gap-2 border-b border-white/5 pb-4">
              <span className="text-sm text-brand-gold tracking-widest uppercase">{t('lab_compound')}</span>
              <span className="text-xl text-white font-medium">Retatrutide (LY3437943)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col"><span className="text-xs text-white/50">{t('lab_declared')}</span><span className="text-white font-medium">10.0 mg</span></div>
              <div className="flex flex-col"><span className="text-xs text-white/50">{t('lab_measured')}</span><span className="text-white font-medium">10.12 mg</span></div>
              <div className="flex flex-col"><span className="text-xs text-white/50">{t('lab_purity')}</span><span className="text-brand-gold font-medium">99.86%</span></div>
              <div className="flex flex-col"><span className="text-xs text-white/50">{t('lab_status')}</span><span className="text-green-400 font-medium flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> {t('lab_pass')}</span></div>
            </div>
            <div className="mt-8">
              <PremiumButton onClick={() => window.open('/assets/janoshik-coa-retatrutide-10mg.png', '_blank')} className="scale-90">
                {t('lab_download')}
              </PremiumButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
