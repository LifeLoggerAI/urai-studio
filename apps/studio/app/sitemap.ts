import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.uraistudio.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
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
    '/settings',
    '/status',
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date('2026-05-06T00:00:00.000Z'),
  }));
}
