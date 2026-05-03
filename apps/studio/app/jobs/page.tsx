import { ModuleOverviewPage } from '@/components/studio/ModuleOverviewPage';

export default function Page() {
  return (
    <ModuleOverviewPage
      slug="jobs"
      route="/jobs"
      fallbackTitle="Jobs"
      fallbackDescription="Job queue surface available. Connect backend jobs store to render live data."
    />
  );
}