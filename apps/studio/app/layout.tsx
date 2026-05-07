import type { Metadata, Viewport } from 'next';

import './globals.css';

import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { StudioShell } from '@/components/studio/StudioShell';
import { siteMeta } from '@/lib/studio/site';

export const metadata: Metadata = {
  metadataBase: new URL(siteMeta.url),
  title: {
    default: siteMeta.title,
    template: '%s | URAI Studio',
  },
  description: siteMeta.description,
  applicationName: siteMeta.name,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: siteMeta.url,
    siteName: siteMeta.name,
    title: siteMeta.title,
    description: siteMeta.description,
    images: [siteMeta.ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteMeta.title,
    description: siteMeta.description,
    images: [siteMeta.ogImage],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#05070d',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <StudioShell>
          <main className="container" id="main-content">{children}</main>
        </StudioShell>
        <Footer />
      </body>
    </html>
  );
}
