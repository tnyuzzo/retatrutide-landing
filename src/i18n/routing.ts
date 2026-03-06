import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: ['en', 'it', 'fr', 'de', 'es', 'pt', 'pl', 'ru', 'uk', 'ar'],

    // Used when no locale matches
    defaultLocale: 'en',

    // All locales always have prefix in URL (e.g. /en/calculator, /it/calculator)
    localePrefix: 'always'
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
    createNavigation(routing);
