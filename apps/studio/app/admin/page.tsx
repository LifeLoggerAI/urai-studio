import type { Metadata } from 'next';

import { ModuleOverviewPage } from '@/components/studio/ModuleOverviewPage';

export const metadata: Metadata = {
  title: 'Admin',
  description: 'URAI Studio admin route for operational diagnostics, controls, and guarded system configuration state.',
  alternates: {
    canonical: '/admin',
  },
};

export default function Page() {
  return (
    <ModuleOverviewPage
      slug="admin"
      route="/admin"
      fallbackTitle="Admin"
      fallbackDescription="Admin controls are available only when the admin integration is configured."
    />
  );
}
