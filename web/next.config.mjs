import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prisma is server-only; keep it out of the client/edge bundle.
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  // Type errors still fail the build; lint runs as a separate CI step for speed.
  eslint: { ignoreDuringBuilds: true },
  // Security headers (the helmet equivalent for Next.js). Applied to every
  // response. Kept framework-safe: no strict CSP that would break the inline
  // runtime, but the high-value clickjacking / MIME / referrer / permissions
  // hardening that costs nothing.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Only meaningful over HTTPS; browsers ignore it on plain http://localhost.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

// Sentry wraps the config. It is a no-op at runtime unless SENTRY_DSN is set,
// so local dev without a DSN just works.
export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Only upload source maps in CI/production builds where an auth token exists.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  disableLogger: true,
});
