import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { routing } from '@/i18n/routing';
import { getAlternateLanguages, getCanonicalUrl } from '@/lib/seo';
import { PostHogProvider } from '@/components/PostHogProvider';
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
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
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value;

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} data-theme={theme === 'light' ? 'light' : undefined}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "vn1xc3jub1");`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage,p=new URLSearchParams(location.search);var vid=s.getItem('_vid');if(!vid){vid='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;return(c==='x'?r:r&3|8).toString(16)});s.setItem('_vid',vid);document.cookie='_vid='+vid+';path=/;max-age=7776000;SameSite=Lax';}var fc=p.get('fbclid');if(fc){var fbc='fb.1.'+Date.now()+'.'+fc;document.cookie='_fbc='+fbc+';path=/;max-age=7776000;SameSite=Lax';s.setItem('_fbc',fbc);}var ks=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','campaign_id','adset_id','ad_id','placement','site_source_name','funnel'];var ut=JSON.parse(s.getItem('_fb_utm')||'{}');var ch=false;for(var i=0;i<ks.length;i++){var v=p.get(ks[i]);if(v){ut[ks[i]]=v;ch=true;}}if(ch){ut._ts=Date.now();s.setItem('_fb_utm',JSON.stringify(ut));}var d={visitor_id:vid};if(fbc)d.fbc='fb.1.'+Date.now()+'.'+fc;if(fc)d.fbclid=fc;for(var j=0;j<ks.length;j++){if(ut[ks[j]])d[ks[j]]=ut[ks[j]];}navigator.sendBeacon('/api/visitor',new Blob([JSON.stringify(d)],{type:'application/json'}));}catch(e){}})();`,
          }}
        />
        <script src="https://analytics.ahrefs.com/analytics.js" data-key="ECL265EZNoHAwvuR19Pwaw" async />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PostHogProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
