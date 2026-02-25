"use client";

import { useLocale, useTranslations } from "next-intl";

export function PortalStructuredData() {
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
        name: t("portal_title"),
        item: `${baseUrl}${localePath}/portal`,
      },
    ],
  };

  const webApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: t("seo_portal_title"),
    description: t("seo_portal_description"),
    url: `${baseUrl}${localePath}/portal`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    provider: {
      "@type": "Organization",
      name: "Aura Peptides",
      url: baseUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApp) }}
      />
    </>
  );
}
