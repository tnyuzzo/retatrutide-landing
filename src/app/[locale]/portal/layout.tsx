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
    path: '/portal',
    title: t('seo_portal_title'),
    description: t('seo_portal_description'),
    ogTitle: t('seo_portal_og_title'),
    ogDescription: t('seo_portal_og_description'),
  });
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
