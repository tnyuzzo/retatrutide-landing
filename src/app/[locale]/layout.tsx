import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getAlternateLanguages, getCanonicalUrl } from '@/lib/seo';
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = 'https://aurapep.eu';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Index' });

  const canonical = getCanonicalUrl(locale, '');
  const alternateLanguages = getAlternateLanguages('');

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: t('seo_home_title'),
      template: `%s | Aura Peptides`,
    },
    description: t('seo_home_description'),
    alternates: {
      canonical,
      languages: alternateLanguages,
    },
    openGraph: {
      title: t('seo_home_og_title'),
      description: t('seo_home_og_description'),
      url: canonical,
      siteName: 'Aura Peptides',
      locale: locale === 'uk' ? 'uk_UA' : locale,
      type: 'website',
      images: [
        {
          url: '/images/retatrutide_hero_gold.png',
          width: 1200,
          height: 630,
          alt: 'Retatrutide 10mg - Aura Peptides Europe',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('seo_home_og_title'),
      description: t('seo_home_og_description'),
      images: ['/images/retatrutide_hero_gold.png'],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "it" | "fr" | "de" | "es" | "pt" | "pl" | "ru" | "uk" | "ar")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
