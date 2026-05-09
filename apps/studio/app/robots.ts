import type { MetadataRoute } from 'next';

import { siteMeta } from '@/lib/studio/site';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? siteMeta.url ?? 'https://www.uraistudio.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}