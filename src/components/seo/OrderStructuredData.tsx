"use client";

import { useLocale, useTranslations } from "next-intl";

export function OrderStructuredData() {
  const locale = useLocale();
  const t = useTranslations("Index");
  const baseUrl = "https://aurapep.eu";
  const localePath = locale === "en" ? "" : `/${locale}`;

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
        name: t("order_select_title") + " " + t("order_select_highlight"),
        item: `${baseUrl}${localePath}/order`,
      },
    ],
  };

  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Retatrutide 10mg Research Kit",
    description: t("seo_order_description"),
    image: `${baseUrl}/images/retatrutide_hero_gold.png`,
    url: `${baseUrl}${localePath}/order`,
    sku: "RET-KIT-1",
    brand: {
      "@type": "Brand",
      name: "Aura Peptides",
    },
    offers: [
      {
        "@type": "Offer",
        price: "197.00",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        url: `${baseUrl}${localePath}/order`,
        priceValidUntil: "2026-12-31",
        eligibleQuantity: {
          "@type": "QuantitativeValue",
          minValue: 1,
          maxValue: 2,
        },
        seller: { "@type": "Organization", name: "Aura Peptides" },
      },
      {
        "@type": "Offer",
        price: "177.30",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: `${baseUrl}${localePath}/order`,
        priceValidUntil: "2026-12-31",
        eligibleQuantity: {
          "@type": "QuantitativeValue",
          minValue: 3,
          maxValue: 4,
        },
        seller: { "@type": "Organization", name: "Aura Peptides" },
      },
      {
        "@type": "Offer",
        price: "167.45",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: `${baseUrl}${localePath}/order`,
        priceValidUntil: "2026-12-31",
        eligibleQuantity: {
          "@type": "QuantitativeValue",
          minValue: 5,
          maxValue: 9,
        },
        seller: { "@type": "Organization", name: "Aura Peptides" },
      },
      {
        "@type": "Offer",
        price: "147.75",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: `${baseUrl}${localePath}/order`,
        priceValidUntil: "2026-12-31",
        eligibleQuantity: {
          "@type": "QuantitativeValue",
          minValue: 10,
          maxValue: 19,
        },
        seller: { "@type": "Organization", name: "Aura Peptides" },
      },
      {
        "@type": "Offer",
        price: "128.05",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: `${baseUrl}${localePath}/order`,
        priceValidUntil: "2026-12-31",
        eligibleQuantity: {
          "@type": "QuantitativeValue",
          minValue: 20,
          maxValue: 29,
        },
        seller: { "@type": "Organization", name: "Aura Peptides" },
      },
      {
        "@type": "Offer",
        price: "98.50",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: `${baseUrl}${localePath}/order`,
        priceValidUntil: "2026-12-31",
        eligibleQuantity: {
          "@type": "QuantitativeValue",
          minValue: 30,
        },
        seller: { "@type": "Organization", name: "Aura Peptides" },
      },
    ],
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Purity",
        value: "≥99.8% (HPLC Verified)",
      },
      {
        "@type": "PropertyValue",
        name: "Includes",
        value: "Bacteriostatic Water (free)",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }}
      />
    </>
  );
}
