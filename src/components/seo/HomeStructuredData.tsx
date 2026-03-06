"use client";

import { useLocale, useTranslations } from "next-intl";

export function HomeStructuredData() {
  const locale = useLocale();
  const t = useTranslations("Index");
  const baseUrl = "https://aurapep.eu";
  const localePath = locale === "en" ? "" : `/${locale}`;

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Aura Peptides",
    url: baseUrl,
    logo: `${baseUrl}/images/retatrutide_hero_gold.png`,
    description:
      "Premium research peptides for the European market. ≥99.8% HPLC-verified purity, independently tested.",
    contactPoint: {
      "@type": "ContactPoint",
      email: "info@aurapep.eu",
      contactType: "customer service",
      availableLanguage: [
        "English",
        "Italian",
        "French",
        "German",
        "Spanish",
        "Portuguese",
        "Polish",
        "Russian",
        "Ukrainian",
        "Arabic",
      ],
    },
    areaServed: {
      "@type": "Place",
      name: "European Union",
    },
  };

  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Retatrutide 10mg",
    description: t("hero_subtitle"),
    image: `${baseUrl}/images/retatrutide_hero_gold.png`,
    url: `${baseUrl}${localePath}`,
    sku: "RET-KIT-1",
    brand: {
      "@type": "Brand",
      name: "Aura Peptides",
    },
    manufacturer: {
      "@type": "Organization",
      name: "Aura Peptides",
    },
    offers: {
      "@type": "AggregateOffer",
      url: `${baseUrl}${localePath}/order`,
      priceCurrency: "EUR",
      lowPrice: "98.50",
      highPrice: "197.00",
      offerCount: 6,
      offers: [
        { "@type": "Offer", price: "197.00", priceCurrency: "EUR", availability: "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition", priceValidUntil: "2026-12-31", eligibleQuantity: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2 } },
        { "@type": "Offer", price: "177.30", priceCurrency: "EUR", availability: "https://schema.org/InStock", priceValidUntil: "2026-12-31", eligibleQuantity: { "@type": "QuantitativeValue", minValue: 3, maxValue: 4 } },
        { "@type": "Offer", price: "167.45", priceCurrency: "EUR", availability: "https://schema.org/InStock", priceValidUntil: "2026-12-31", eligibleQuantity: { "@type": "QuantitativeValue", minValue: 5, maxValue: 9 } },
        { "@type": "Offer", price: "147.75", priceCurrency: "EUR", availability: "https://schema.org/InStock", priceValidUntil: "2026-12-31", eligibleQuantity: { "@type": "QuantitativeValue", minValue: 10, maxValue: 19 } },
        { "@type": "Offer", price: "128.05", priceCurrency: "EUR", availability: "https://schema.org/InStock", priceValidUntil: "2026-12-31", eligibleQuantity: { "@type": "QuantitativeValue", minValue: 20, maxValue: 29 } },
        { "@type": "Offer", price: "98.50", priceCurrency: "EUR", availability: "https://schema.org/InStock", priceValidUntil: "2026-12-31", eligibleQuantity: { "@type": "QuantitativeValue", minValue: 30 } },
      ],
      seller: {
        "@type": "Organization",
        name: "Aura Peptides",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "EUR",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: [
            "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
            "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
            "PL", "PT", "RO", "SK", "SI", "ES", "SE",
          ],
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 2,
            maxValue: 4,
            unitCode: "DAY",
          },
        },
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "7496",
      bestRating: "5",
      worstRating: "1",
    },
    review: [
      {
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
        author: { "@type": "Person", name: t("review_1_name") },
        reviewBody: t("review_1_desc").replace(/"/g, ""),
        datePublished: "2025-12-15",
      },
      {
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
        author: { "@type": "Person", name: t("review_2_name") },
        reviewBody: t("review_2_desc").replace(/"/g, ""),
        datePublished: "2026-01-10",
      },
      {
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
        author: { "@type": "Person", name: t("review_3_name") },
        reviewBody: t("review_3_desc").replace(/"/g, ""),
        datePublished: "2026-01-28",
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
        name: "CAS Number",
        value: "2381089-83-2",
      },
      {
        "@type": "PropertyValue",
        name: "Format",
        value: "Lyophilized Powder",
      },
      {
        "@type": "PropertyValue",
        name: "Third-Party Testing",
        value: "Independent Analytical Laboratory",
      },
    ],
  };

  const faqItems = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => ({
    "@type": "Question" as const,
    name: t(`faq_q${num}`),
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: t(`faq_a${num}`),
    },
  }));

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
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }}
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
