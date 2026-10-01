import { NextResponse } from 'next/server';

import { publicIntegrationDiagnostics } from '@/lib/studio/integrations';
import { studioModules } from '@/lib/studio/modules';

export const dynamic = 'force-dynamic';

export async function GET() {
  const integrations = publicIntegrationDiagnostics();
  const missingRequired = integrations
    .filter((integration) => integration.required && integration.status === 'missing')
    .map((integration) => integration.id);

  const body = {
    ok: missingRequired.length === 0,
    service: 'urai-studio' as const,
    integrations,
    modules: studioModules.map((module) => ({
      id: module.id,
      name: module.name,
      route: module.route,
      integrationType: module.integrationType,
      status: module.status,
      configurationRequired: module.requiredEnv.length > 0,
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
