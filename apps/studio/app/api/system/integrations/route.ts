import { NextResponse } from 'next/server';

import { studioIntegrations, type StudioIntegrationDiagnostic } from '@/lib/studio/integrations';
import { studioModules } from '@/lib/studio/modules';

export const dynamic = 'force-dynamic';

type SystemIntegrationsResponse = {
  ok: boolean;
  service: 'urai-studio';
  integrations: StudioIntegrationDiagnostic[];
  modules: Array<{
    id: string;
    name: string;
    route: string;
    integrationType: string;
    status: string;
    requiredEnv: string[];
  }>;
  missingRequired: string[];
  generatedAt: string;
};

export async function GET() {
  const missingRequired = studioIntegrations
    .filter((integration) => integration.required && integration.status === 'missing')
    .map((integration) => integration.id);

  const body: SystemIntegrationsResponse = {
    ok: missingRequired.length === 0,
    service: 'urai-studio',
    integrations: studioIntegrations,
    modules: studioModules.map((module) => ({
      id: module.id,
      name: module.name,
      route: module.route,
      integrationType: module.integrationType,
      status: module.status,
      requiredEnv: module.requiredEnv,
    })),
    missingRequired,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: body.ok ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
