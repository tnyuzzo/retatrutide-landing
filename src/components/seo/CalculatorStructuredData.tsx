"use client";

import { useLocale, useTranslations } from "next-intl";

export function CalculatorStructuredData() {
  const locale = useLocale();
  const t = useTranslations("Index");
  const baseUrl = "https://aurapep.eu";
  const localePath = locale === "en" ? "" : `/${locale}`;

  const webApplication = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Retatrutide Dosage Calculator",
    description: "Free retatrutide dosage calculator. Enter vial size (10mg), bacteriostatic water volume, and desired dose to get exact syringe units for U-100 insulin syringes.",
    url: `${baseUrl}${localePath}/calculator`,
    applicationCategory: "HealthApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    creator: {
      "@type": "Organization",
      name: "Aura Peptides",
      url: baseUrl,
    },
    inLanguage: locale === "uk" ? "uk-UA" : locale,
    keywords: "retatrutide dosage calculator, retatrutide calculator, peptide reconstitution calculator, retatrutide syringe units, bac water calculator",
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
        name: t("calc_title"),
        item: `${baseUrl}${localePath}/calculator`,
      },
    ],
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: t("calc_faq_q1"),
        acceptedAnswer: {
          "@type": "Answer",
          text: t("calc_faq_a1"),
        },
      },
      {
        "@type": "Question",
        name: t("calc_faq_q2"),
        acceptedAnswer: {
          "@type": "Answer",
          text: t("calc_faq_a2"),
        },
      },
      {
        "@type": "Question",
        name: t("calc_faq_q3"),
        acceptedAnswer: {
          "@type": "Answer",
          text: t("calc_faq_a3"),
        },
      },
      {
        "@type": "Question",
        name: t("calc_faq_q4"),
        acceptedAnswer: {
          "@type": "Answer",
          text: t("calc_faq_a4"),
        },
      },
    ],
  };

  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Calculate Retatrutide Dosage",
    description: "Step-by-step guide to reconstituting retatrutide and calculating exact syringe units for your desired dose using a U-100 insulin syringe.",
    step: [
      {
        "@type": "HowToStep",
        name: t("calc_section_mix"),
        text: "Enter the peptide amount in mg and the bacteriostatic water volume in ml to determine concentration.",
      },
      {
        "@type": "HowToStep",
        name: t("calc_section_dose"),
        text: "Enter your desired dose in mcg to calculate the exact syringe units to draw.",
      },
      {
        "@type": "HowToStep",
        name: t("calc_result"),
        text: "Read the calculated units and ml volume from the visual syringe display.",
      },
    ],
    tool: [
      {
        "@type": "HowToTool",
        name: "Insulin syringe (U-100)",
      },
      {
        "@type": "HowToTool",
        name: "Bacteriostatic water",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplication) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }}
      />
    </>
  );
}
