import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.uraistudio.com';

const publicRoutes = [
  '/',
  '/studio',
  '/systems',
  '/motion',
  '/cinema',
  '/music',
  '/visuals',
  '/spatial',
  '/demo',
  '/waitlist',
  '/contact',
  '/privacy',
  '/terms',
  '/status',
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date('2026-05-08T00:00:00.000Z'),
  }));
}
