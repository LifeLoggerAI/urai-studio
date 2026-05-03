import { notFound } from 'next/navigation';

import { studioModules } from '@/lib/studio/modules';
import { systems } from '@/lib/studio/systems';

type ModuleOverviewPageProps = {
  slug?: string;
  route?: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
};

export function ModuleOverviewPage({
  slug,
  route,
  fallbackTitle = 'Module unavailable',
  fallbackDescription = 'This module is not currently configured.',
}: ModuleOverviewPageProps) {
  const system = slug ? systems.find((item) => item.slug === slug) : undefined;
  const module = route ? studioModules.find((item) => item.route === route) : undefined;

  if (!system && !module) {
    if (fallbackTitle || fallbackDescription) {
      return (
        <section>
          <h1>{fallbackTitle}</h1>
          <div className="card">{fallbackDescription}</div>
        </section>
      );
    }

    return notFound();
  }

  const title = system?.name ?? module?.name ?? fallbackTitle;
  const description = system?.description ?? module?.description ?? fallbackDescription;
  const status = system?.status ?? module?.status ?? 'unknown';
  const capabilities = system?.capabilities ?? module?.capabilities ?? [];

  return (
    <section>
      <h1>{title}</h1>
      <p>{description}</p>

      <div className="card">
        <strong>Status:</strong> {status}
        <br />

        {module ? (
          <>
            <strong>Integration:</strong> {module.integrationType}
            <br />
            <strong>Health:</strong> {module.healthEndpoint ?? 'n/a'}
            <br />
            <strong>Inputs:</strong> {module.inputs.join(', ') || 'None'}
            <br />
            <strong>Outputs:</strong> {module.outputs.join(', ') || 'None'}
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

        {module ? (
          <>
            <strong>Fallback:</strong> {module.fallbackBehavior}
          </>
        ) : null}
      </div>
    </section>
  );
}