import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://aurapep.eu';
  const locales = routing.locales;
  const defaultLocale = routing.defaultLocale;

  const pages = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/calculator', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/order', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/crypto-guide', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/portal', priority: 0.5, changeFrequency: 'monthly' as const },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const page of pages) {
    for (const locale of locales) {
      const localePath = locale === defaultLocale ? '' : `/${locale}`;
      const url = `${baseUrl}${localePath}${page.path}`;

      const alternates: Record<string, string> = {};
      for (const altLocale of locales) {
        const altPath = altLocale === defaultLocale ? '' : `/${altLocale}`;
        const langCode = altLocale === 'uk' ? 'uk-UA' : altLocale;
        alternates[langCode] = `${baseUrl}${altPath}${page.path}`;
      }
      alternates['x-default'] = `${baseUrl}${page.path}`;

      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: alternates,
        },
      });
    }
  }

  return entries;
}
