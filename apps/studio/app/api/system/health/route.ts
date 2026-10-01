import { NextResponse } from 'next/server';

import { studioConfig } from '@/lib/studio/config';
import { firebaseDiagnostics } from '@/lib/studio/firebase';
import { publicIntegrationDiagnostics, studioIntegrations } from '@/lib/studio/integrations';
import { buildAllReadinessProfiles, observeAllStudioIntegrations } from '@/lib/studio/observed-readiness';
import { moduleStatuses, readinessSummary, statusWarnings } from '@/lib/studio/status';

export const dynamic = 'force-dynamic';

const configuredIntegrations = studioIntegrations.filter((integration) => integration.status === 'configured');
const missingIntegrations = studioIntegrations.filter((integration) => integration.status === 'missing');
const requiredMissingIntegrations = missingIntegrations.filter((integration) => integration.required);
const configured = configuredIntegrations;
const missing = missingIntegrations;
const requiredMissing = requiredMissingIntegrations;

const integrationSummary = () => {
  return {
    total: studioIntegrations.length,
    configured: configured.length,
    missing: missing.length,
    requiredMissing: requiredMissing.length,
    requiredMissingIds: requiredMissing.map((integration) => integration.id),
  };
};

export async function GET() {
  const localReadiness = readinessSummary();
  const observations = await observeAllStudioIntegrations();
  const profiles = buildAllReadinessProfiles(observations);
  const fullPlatform = profiles.find((profile) => profile.id === 'FULL_STUDIO_PLATFORM');

  const body = {
    ok: localReadiness.ok && Boolean(fullPlatform?.ok),
    service: 'urai-studio' as const,
    version: studioConfig.version,
    environment: studioConfig.environment,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    readiness: {
      ok: localReadiness.ok,
      status: localReadiness.status,
      blockers: localReadiness.blockers,
      warnings: localReadiness.warnings,
      checks: localReadiness.checks.map(({ id, required, ok }) => ({ id, required, ok })),
    },
    integrations: publicIntegrationDiagnostics(),
    observedIntegrations: observations.map(({ id, required, configured, observed, state, httpStatus, attempts, checkedAt }) => ({
      id,
      required,
      configured,
      observed,
      state,
      httpStatus,
      attempts,
      checkedAt,
    })),
    integrationSummary: integrationSummary(),
    readinessProfiles: profiles,
    modules: moduleStatuses(),
    firebase: {
      configured: firebaseDiagnostics.configured,
      adminAvailable: firebaseDiagnostics.adminAvailable,
      emulator: firebaseDiagnostics.emulator,
    },
    warnings: statusWarnings(),
  };

  return NextResponse.json(body, {
    status: body.ok ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
