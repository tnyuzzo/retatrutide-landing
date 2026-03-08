import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin(
  './src/i18n/request.ts'
);

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // PostHog reverse proxy — bypasses adblockers
      // Locale-prefixed paths (e.g. /fr/ingest/e, /de/ingest/flags)
      { source: '/:locale(en|it|fr|de|es|pt|pl|ru|uk|ar)/ingest/static/:path*', destination: 'https://eu-assets.i.posthog.com/static/:path*' },
      { source: '/:locale(en|it|fr|de|es|pt|pl|ru|uk|ar)/ingest/:path*', destination: 'https://eu.i.posthog.com/:path*' },
      // Non-prefixed paths (direct access)
      { source: '/ingest/static/:path*', destination: 'https://eu-assets.i.posthog.com/static/:path*' },
      { source: '/ingest/:path*', destination: 'https://eu.i.posthog.com/:path*' },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
      {
        source: '/:locale/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/:locale/checkout/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  silent: true,
  // Skip source map upload (no auth token configured)
  sourcemaps: {
    disable: true,
  },
  // Disable Sentry telemetry
  telemetry: false,
});
