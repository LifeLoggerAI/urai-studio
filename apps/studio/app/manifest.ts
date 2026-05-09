import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'URAI Studio',
    short_name: 'URAI Studio',
    description:
      'Cinematic AI-native creative infrastructure for memory, media, motion, visuals, and spatial intelligence.',
    start_url: '/',
    display: 'standalone',
    background_color: '#05070d',
    theme_color: '#05070d',
    categories: ['business', 'productivity', 'entertainment'],
  };
}
