import { ModuleOverviewPage } from '@/components/studio/ModuleOverviewPage';

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