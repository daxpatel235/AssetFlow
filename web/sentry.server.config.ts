import * as Sentry from '@sentry/nextjs';

// Runs on the Node server. No-op unless a DSN is provided.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
