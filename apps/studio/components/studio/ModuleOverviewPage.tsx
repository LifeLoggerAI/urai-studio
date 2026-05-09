import { notFound } from 'next/navigation';

import { studioModules } from '@/lib/studio/modules';
import { systems } from '@/lib/studio/systems';

type ModuleOverviewPageProps = {
  slug?: string;
  route?: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
};

function pageMarkerFromRoute(route?: string, slug?: string) {
  return (route?.replace(/^\//, '') || slug || 'module').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
}

export function ModuleOverviewPage({
  slug,
  route,
  fallbackTitle = 'Module unavailable',
  fallbackDescription = 'This module is not currently configured.',
}: ModuleOverviewPageProps) {
  const system = slug ? systems.find((item) => item.slug === slug) : undefined;
  const studioModule = route ? studioModules.find((item) => item.route === route) : undefined;
  const marker = pageMarkerFromRoute(route, slug);

  if (!system && !studioModule) {
    if (fallbackTitle || fallbackDescription) {
      return (
        <section data-urai-studio-page={marker} className="page-stack">
          <p className="eyebrow">Feature-gated module</p>
          <h1>{fallbackTitle}</h1>
          <div className="card">{fallbackDescription}</div>
        </section>
      );
    }

    return notFound();
  }

  const title = system?.name ?? studioModule?.name ?? fallbackTitle;
  const description = system?.description ?? studioModule?.description ?? fallbackDescription;
  const status = system?.status ?? studioModule?.status ?? 'unknown';
  const capabilities = system?.capabilities ?? studioModule?.capabilities ?? [];

  return (
    <section data-urai-studio-page={marker} className="page-stack">
      <p className="eyebrow">URAI Studio module</p>
      <h1>{title}</h1>
      <p>{description}</p>

      <div className="card">
        <strong>Status:</strong> {status}
        <br />

        {studioModule ? (
          <>
            <strong>Integration:</strong> {studioModule.integrationType}
            <br />
            <strong>Health:</strong> {studioModule.healthEndpoint ?? 'n/a'}
            <br />
            <strong>Inputs:</strong> {studioModule.inputs.join(', ') || 'None'}
            <br />
            <strong>Outputs:</strong> {studioModule.outputs.join(', ') || 'None'}
            <br />
          </>
        ) : null}

        <strong>Capabilities:</strong> {capabilities.join(', ') || 'None'}
        <br />

        {system ? (
          <>
            <strong>Dependencies:</strong> {system.dependencies.join(', ') || 'None'}
            <br />
            <strong>Version lane:</strong> {system.versionLane}
            <br />
          </>
        ) : null}

        {studioModule ? (
          <>
            <strong>Fallback:</strong> {studioModule.fallbackBehavior}
          </>
        ) : null}
      </div>
    </section>
  );
}