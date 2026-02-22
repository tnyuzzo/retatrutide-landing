"use client";

import { useLocale, useTranslations } from "next-intl";

export function CryptoGuideStructuredData() {
  const locale = useLocale();
  const t = useTranslations("Index");
  const baseUrl = "https://aurapep.eu";
  const localePath = locale === "en" ? "" : `/${locale}`;

  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: t("crypto_title"),
    description: t("crypto_subtitle"),
    step: [
      {
        "@type": "HowToStep",
        name: t("crypto_step1_title"),
        text: t("crypto_step1_desc"),
        position: 1,
      },
      {
        "@type": "HowToStep",
        name: t("crypto_step2_title"),
        text: t("crypto_step2_desc"),
        position: 2,
      },
    ],
    totalTime: "PT5M",
  };

  const faqItems = [
    {
      "@type": "Question" as const,
      name: t("crypto_faq_safe_q"),
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: t("crypto_faq_safe_a"),
      },
    },
    {
      "@type": "Question" as const,
      name: t("crypto_faq_time_q"),
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: t("crypto_faq_time_a"),
      },
    },
    {
      "@type": "Question" as const,
      name: t("crypto_faq_which_q"),
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: t("crypto_faq_which_a"),
      },
    },
  ];

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems,
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${baseUrl}${localePath || "/"}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("crypto_title"),
        item: `${baseUrl}${localePath}/crypto-guide`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
    </>
  );
}
