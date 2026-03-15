import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: ['en', 'it', 'fr', 'de', 'es', 'pt', 'pl', 'ru', 'uk', 'ar'],

    // Used when no locale matches
    defaultLocale: 'en',

    // All locales always have prefix in URL (e.g. /en/calculator, /it/calculator)
    localePrefix: 'always',

    // Disable middleware-injected Link headers for hreflang —
    // we handle hreflang via <link> tags in page metadata (src/lib/seo.ts)
    // which correctly use locale-prefixed URLs and uk-UA language codes.
    // The middleware's default alternateLinks uses unprefixed x-default URLs
    // that return 307 redirects (since localePrefix is 'always'), and uses
    // raw locale codes (e.g. 'uk' instead of 'uk-UA'), causing Ahrefs to flag
    // "hreflang to redirect" and "more than one page for same language".
    alternateLinks: false
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
    createNavigation(routing);
