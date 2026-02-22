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
      "Premium research peptides for the European market. ≥99.8% HPLC-verified purity, Janoshik tested.",
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@aurapeptides.eu",
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
    sku: "RETA-10MG",
    gtin13: "2381089832",
    brand: {
      "@type": "Brand",
      name: "Aura Peptides",
    },
    manufacturer: {
      "@type": "Organization",
      name: "Aura Peptides",
    },
    offers: {
      "@type": "Offer",
      url: `${baseUrl}${localePath}/order`,
      priceCurrency: "EUR",
      price: "97",
      priceValidUntil: "2026-12-31",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
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
        value: "Janoshik Analytical Laboratory",
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
