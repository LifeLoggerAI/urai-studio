import { ModuleOverviewPage } from '@/components/studio/ModuleOverviewPage';

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