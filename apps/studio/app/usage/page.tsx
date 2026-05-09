import type { Metadata } from 'next';

import { ModuleOverviewPage } from '@/components/studio/ModuleOverviewPage';

export const metadata: Metadata = {
  title: 'Usage',
  description: 'URAI Studio usage reporting route with analytics-backed diagnostics and fallback mode.',
  alternates: {
    canonical: '/usage',
  },
};

export default function Page() {
  return (
    <ModuleOverviewPage
      slug="usage"
      route="/usage"
      fallbackTitle="Usage"
      fallbackDescription="Usage reporting requires analytics backend; currently showing diagnostic mode."
    />
  );
}
