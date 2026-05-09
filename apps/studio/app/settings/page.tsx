import type { Metadata } from 'next';

import { ModuleOverviewPage } from '@/components/studio/ModuleOverviewPage';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'URAI Studio settings route for environment diagnostics, privacy posture, and safe configuration visibility.',
  alternates: {
    canonical: '/settings',
  },
};

export default function Page() {
  return (
    <ModuleOverviewPage
      slug="settings"
      route="/settings"
      fallbackTitle="Settings"
      fallbackDescription="Environment diagnostics only. Secrets are never displayed in UI."
    />
  );
}
