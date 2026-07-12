import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers';
import { themeScript } from '@/providers/ThemeProvider';

// Self-hosted Inter (downloaded + bundled at build time — no runtime fetch).
// Exposed as --font-inter and consumed by --font-sans in globals.css.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'AssetFlow — Enterprise Asset & Resource Management',
  description: 'Track every asset across its full lifecycle: allocation, transfers, resource booking, maintenance, and audit — all in one workspace.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
