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
    path: '/order',
    title: t('seo_order_title'),
    description: t('seo_order_description'),
    ogTitle: t('seo_order_og_title'),
    ogDescription: t('seo_order_og_description'),
  });
}

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
