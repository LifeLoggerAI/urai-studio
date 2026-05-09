import type { Metadata } from 'next';

import { ModuleOverviewPage } from '@/components/studio/ModuleOverviewPage';

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'URAI Studio analytics route for usage reporting, diagnostics, and analytics integration status.',
  alternates: {
    canonical: '/analytics',
  },
};

export default function Page() {
  return (
    <ModuleOverviewPage
      slug="analytics"
      route="/analytics"
      fallbackTitle="Analytics"
      fallbackDescription="Analytics reporting is environment-gated and shows diagnostic fallback state until configured."
    />
  );
}
