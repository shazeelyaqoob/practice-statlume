import type { Metadata, Viewport } from 'next';
import './globals.css';
import { archivo, archivoDisplay } from './fonts';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'Statlume', template: '%s · Statlume' },
  description:
    'Statlume is a store analytics dashboard: revenue, orders, products and customers for any date range.',
  applicationName: 'Statlume',
  openGraph: { type: 'website', siteName: 'Statlume' },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: '#F4F6F3',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${archivoDisplay.variable}`}>
      <body>{children}</body>
    </html>
  );
}
