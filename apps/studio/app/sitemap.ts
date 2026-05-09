import type { MetadataRoute } from 'next';

import { publicRoutes, siteMeta } from '@/lib/studio/site';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? siteMeta.url ?? 'https://www.uraistudio.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-05-08T00:00:00.000Z');

  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route === '/' ? '' : route}`,
    lastModified,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : 0.7,
  }));
}