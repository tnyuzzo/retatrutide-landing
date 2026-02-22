import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';

const BASE_URL = 'https://aurapep.eu';

/**
 * Build alternate language links for hreflang tags
 */
export function getAlternateLanguages(path: string): Record<string, string> {
  const alternates: Record<string, string> = {};
  for (const locale of routing.locales) {
    const localePath = locale === routing.defaultLocale ? '' : `/${locale}`;
    const langCode = locale === 'uk' ? 'uk-UA' : locale;
    alternates[langCode] = `${BASE_URL}${localePath}${path}`;
  }
  alternates['x-default'] = `${BASE_URL}${path}`;
  return alternates;
}

/**
 * Build canonical URL for a given locale and path
 */
export function getCanonicalUrl(locale: string, path: string): string {
  const localePath = locale === routing.defaultLocale ? '' : `/${locale}`;
  return `${BASE_URL}${localePath}${path}`;
}

/**
 * Build base metadata with OG, Twitter, hreflang, canonical
 */
export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage = '/images/retatrutide_hero_gold.png',
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
}): Metadata {
  const canonical = getCanonicalUrl(locale, path);
  const alternateLanguages = getAlternateLanguages(path);
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`;

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical,
      languages: alternateLanguages,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      siteName: 'Aura Peptides',
      locale: locale === 'uk' ? 'uk_UA' : locale,
      type: 'website',
      images: [
        {
          url: fullOgImage,
          width: 1200,
          height: 630,
          alt: 'Retatrutide 10mg - Aura Peptides Europe',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [fullOgImage],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
