"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePostHog } from "posthog-js/react";

export function FaqSectionLight() {
  const t = useTranslations('Index');
  const posthog = usePostHog();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className="py-14 px-6 bg-t-bg-alt" id="faq">
      <div className="max-w-[1000px] mx-auto">
        <h2 className="text-[1.55rem] md:text-[1.75rem] font-light text-t-text text-center mb-10 tracking-tight">
          {t('faq_title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
          {[1, 2, 3, 4, 10, 5, 6, 7, 8, 9].map((num) => {
            const isOpen = openFaq === num;
            return (
              <div key={num} className="border-b border-t-border-subtle">
                <button
                  onClick={() => {
                    if (!isOpen) {
                      posthog?.capture('faq_opened', { question: num });
                      (window as any).clarity?.("set", "faq_opened", String(num));
                    }
                    setOpenFaq(isOpen ? null : num);
                  }}
                  className="w-full flex justify-between items-center py-3.5 text-left group"
                >
                  <span className="text-[13px] font-medium text-t-text group-hover:text-t-text-2 transition-colors pr-4">
                    {t(`faq_q${num}`)}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-t-text-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className={`text-[13px] text-t-text-2 leading-[1.7] transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-[500px] pb-4 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  {t(`faq_a${num}`)}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-[13px] text-t-text-4">
          {t('faq_contact_pre')}{' '}
          <a
            href="mailto:info@aurapep.eu"
            className="text-t-text-2 font-medium hover:text-t-text underline underline-offset-4 decoration-t-border transition-colors"
          >
            {t('faq_contact_link')}
          </a>
        </p>
      </div>
    </section>
  );
}
