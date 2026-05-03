import { ModuleOverviewPage } from '@/components/studio/ModuleOverviewPage';

export default function Page() {
  return (
    <ModuleOverviewPage
      slug="assets"
      route="/assets"
      fallbackTitle="Assets"
      fallbackDescription="No live asset source configured. Connect Asset Factory or storage integration to populate registry."
    />
  );
}