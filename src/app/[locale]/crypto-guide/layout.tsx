import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Index' });

  return buildPageMetadata({
    locale,
    path: '/crypto-guide',
    title: t('seo_crypto_title'),
    description: t('seo_crypto_description'),
    ogTitle: t('seo_crypto_og_title'),
    ogDescription: t('seo_crypto_og_description'),
  });
}

export default function CryptoGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
