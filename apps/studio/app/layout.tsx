import type { Metadata, Viewport } from 'next';

import './globals.css';
import './aaa-system-lock.css';

import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { StudioShell } from '@/components/studio/StudioShell';
import { siteMeta } from '@/lib/studio/site';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? siteMeta.url ?? 'https://www.uraistudio.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteMeta.name,
  title: {
    default: siteMeta.title,
    template: '%s | URAI Studio',
  },
  description: siteMeta.description,
  keywords: [
    'URAI Studio',
    'AI creative studio',
    'cinematic AI systems',
    'spatial storytelling',
    'memory replay',
    'motion design',
    'creative infrastructure',
  ],
  authors: [{ name: 'URAI Labs LLC' }],
  creator: 'URAI Labs LLC',
  publisher: 'URAI Labs LLC',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: siteMeta.name,
    title: siteMeta.title,
    description: siteMeta.description,
    images: [
      {
        url: siteMeta.ogImage ?? '/og',
        width: 1200,
        height: 630,
        alt: 'URAI Studio cinematic AI systems for memory, media, and spatial intelligence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteMeta.title,
    description: siteMeta.description,
    images: [siteMeta.ogImage ?? '/og'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
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
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <StudioShell>
          <main className="container" id="main-content" tabIndex={-1}>
            {children}
          </main>
        </StudioShell>
        <Footer />
      </body>
    </html>
  );
}
