import type { Metadata } from 'next';

import { ModuleOverviewPage } from '@/components/studio/ModuleOverviewPage';

export const metadata: Metadata = {
  title: 'Integrations',
  description: 'URAI Studio integrations route for environment-gated external systems and diagnostic fallback state.',
  alternates: {
    canonical: '/integrations',
  },
};

export default function Page() {
  return (
    <ModuleOverviewPage
      slug="integrations"
      route="/integrations"
      fallbackTitle="Integrations"
      fallbackDescription="External integrations are environment-gated. Disconnected integrations surface diagnostics, not fake success."
    />
  );
}
