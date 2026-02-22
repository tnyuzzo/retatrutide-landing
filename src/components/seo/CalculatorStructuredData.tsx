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
    name: t("calc_title"),
    description: t("calc_subtitle"),
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

  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to Calculate Retatrutide Dosage`,
    description: t("calc_subtitle"),
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }}
      />
    </>
  );
}
