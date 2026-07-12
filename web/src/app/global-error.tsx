'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

// Catches React render errors at the root and reports them to Sentry.
// Replaces the whole document, so it uses inline styles (no layout/Tailwind).
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', display: 'grid', placeItems: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: '#64748b', marginBottom: 16 }}>An unexpected error occurred. It has been reported.</p>
          <button
            onClick={reset}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
