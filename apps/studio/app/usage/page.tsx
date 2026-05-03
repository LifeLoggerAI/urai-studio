import { ModuleOverviewPage } from '@/components/studio/ModuleOverviewPage';

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