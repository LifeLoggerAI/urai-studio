import type { Metadata } from 'next';

import { ImmersiveLifeWorld } from '@/components/urai/ImmersiveLifeWorld';

export const metadata: Metadata = {
  title: 'URAI Life Map',
  description:
    'A cinematic symbolic life interface for the URAI memory galaxy, inner sky, companion orb, and foundation layer.',
  alternates: {
    canonical: '/life-map',
  },
};

export default function LifeMapPage() {
  return <ImmersiveLifeWorld />;
}
