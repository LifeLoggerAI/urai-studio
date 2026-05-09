import { NextResponse } from 'next/server';

import { studioModules } from '@/lib/studio/modules';
import { studioConfig } from '@/lib/studio/config';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'urai-studio',
    version: '1.0.0',
    domain: 'https://www.uraistudio.com',
    environment: studioConfig.environment,
    moduleRegistry: studioModules,
    routeMap: Object.fromEntries(studioModules.map((module) => [module.id, module.route])),
    healthEndpoint: '/api/system/health',
    acceptedIntegrationIds: studioModules.map((module) => module.id),
    connectedSystems: ['URAI', 'URAI Spatial', 'URAI Jobs', 'Asset Factory'],
    assetHandoffModel: 'uri+metadata+jobId',
    statusModel: ['live', 'fallback', 'mock', 'disconnected'],
    authRequirements: 'Public system routes are readable. Mutating production APIs must be authenticated and scoped by tenant/user when enabled.',
    healthGuarantees: 'Returns structured JSON without secrets and reports configured integrations, module status, and warnings.',
    smokeTestCoverage: ['/', '/studio', '/generate', '/assets', '/pricing', '/about', '/privacy', '/terms', '/api/system/health', '/api/system/manifest', '/api/system/capabilities', '/api/system/integration-contract'],
    breakingChangePolicy: 'semver-major-only',
    compatibilityNotes: 'Additive fields are backward compatible.',
  });
}
