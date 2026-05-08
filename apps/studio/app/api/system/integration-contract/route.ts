import { NextResponse } from 'next/server';

import { studioConfig } from '@/lib/studio/config';
import { studioModules } from '@/lib/studio/modules';
import { systemCapabilities } from '@/lib/studio/types';

export async function GET() {
  const routes = ['/', '/about', '/studio', '/generate', '/assets', '/jobs', '/pricing', '/contact', '/privacy', '/terms', '/status', '/system', '/dashboard', '/settings', '/usage', '/analytics', '/integrations', '/asset-factory', '/motion', '/cinema', '/music', '/visuals', '/spatial', '/admin'];
  const apiEndpoints = ['/api/system/health', '/api/system/manifest', '/api/system/capabilities', '/api/system/integration-contract', '/api/system/openapi'];

  return NextResponse.json({
    ok: true,
    service: 'urai-studio',
    version: studioConfig.version ?? '1.0.0',
    domain: 'https://www.uraistudio.com',
    appRoot: 'apps/studio',
    routes,
    apiEndpoints,
    authRequirements: {
      publicRoutes: ['/', '/about', '/studio', '/generate', '/assets', '/jobs', '/pricing', '/contact', '/privacy', '/terms', '/status', '/system'],
      protectedRoutes: ['/dashboard', '/settings', '/usage', '/analytics', '/integrations', '/asset-factory', '/motion', '/cinema', '/music', '/visuals', '/spatial', '/admin'],
      note: 'Protected routes must be tenant-scoped before live private data is exposed.',
    },
    environmentVariables: [
      'NEXT_PUBLIC_SITE_URL',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'STUDIO_GENERATION_ENDPOINT',
      'STUDIO_GENERATION_API_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'CRON_SECRET',
    ],
    connectedSystems: studioModules.map((module) => ({ id: module.id, name: module.name, route: module.route, status: module.status, requiredEnv: module.requiredEnv })),
    moduleRegistry: studioModules,
    capabilities: systemCapabilities,
    jobLifecycle: ['intake', 'queued', 'rendering', 'materialized', 'published', 'approved', 'rollback'],
    assetLifecycle: ['requested', 'generated', 'stored', 'reviewed', 'published', 'archived'],
    healthGuarantees: ['safe JSON responses', 'no secret exposure', 'feature-gated unavailable services', 'status warnings for disconnected integrations'],
    smokeTestCoverage: routes.concat(apiEndpoints),
    deploymentTarget: 'Firebase Hosting or Firebase App Hosting for https://www.uraistudio.com',
    rollbackInstructions: 'Revert the release branch or redeploy the previous verified Firebase Hosting/App Hosting version.',
    knownLimitations: ['Live deploy, Stripe checkout, private auth, and generation queue require production credentials and provider configuration.'],
  });
}
