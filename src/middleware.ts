import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
    // Match internationalized pathnames + unprefixed paths (default locale)
    matcher: ['/', '/(it|en|fr|de|es|pt|pl|ru|uk|ar)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
