import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Performance: sample 20% of transactions
  tracesSampleRate: 0.2,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",
});
