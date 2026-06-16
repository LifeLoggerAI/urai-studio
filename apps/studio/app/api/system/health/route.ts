import { NextResponse } from 'next/server';

import { studioConfig } from '@/lib/studio/config';
import { firebaseDiagnostics } from '@/lib/studio/firebase';
import { studioIntegrations } from '@/lib/studio/integrations';
import { moduleStatuses, readinessSummary, statusWarnings } from '@/lib/studio/status';

export const dynamic = 'force-dynamic';

const configuredIntegrations = studioIntegrations.filter((integration) => integration.status === 'configured');
const missingIntegrations = studioIntegrations.filter((integration) => integration.status === 'missing');
const requiredMissingIntegrations = missingIntegrations.filter((integration) => integration.required);

const integrationSummary = () => {
  return {
    total: studioIntegrations.length,
    configured: configuredIntegrations.length,
    missing: missingIntegrations.length,
    requiredMissing: requiredMissingIntegrations.length,
    requiredMissingIds: requiredMissingIntegrations.map((integration) => integration.id),
  };
};

type SystemHealthResponse = {
  ok: boolean;
  service: 'urai-studio';
  version: string;
  environment: string;
  timestamp: string;
  uptime: number;
  readiness: ReturnType<typeof readinessSummary>;
  firebase: typeof firebaseDiagnostics;
  integrations: typeof studioIntegrations;
  integrationSummary: ReturnType<typeof integrationSummary>;
  modules: ReturnType<typeof moduleStatuses>;
  warnings: string[];
};

export async function GET() {
  const readiness = readinessSummary();
  const body: SystemHealthResponse = {
    ok: readiness.ok,
    service: 'urai-studio',
    version: studioConfig.version,
    environment: studioConfig.environment,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    readiness,
    firebase: firebaseDiagnostics,
    integrations: studioIntegrations,
    integrationSummary: integrationSummary(),
    modules: moduleStatuses(),
    warnings: statusWarnings(),
  };

  return NextResponse.json(body, {
    status: readiness.ok ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
