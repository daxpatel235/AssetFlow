import * as Sentry from '@sentry/nextjs';

// Runs in the edge runtime (middleware). No-op unless a DSN is provided.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
