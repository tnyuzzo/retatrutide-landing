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
    path: '/calculator',
    title: t('seo_calc_title'),
    description: t('seo_calc_description'),
    ogTitle: t('seo_calc_og_title'),
    ogDescription: t('seo_calc_og_description'),
  });
}

export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
