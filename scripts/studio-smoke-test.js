#!/usr/bin/env node

/**
 * URAI Studio smoke test.
 *
 * Static mode validates required repo files, frontend route files, callables,
 * Firebase rules, Functions v2 callable usage, Studio registry helpers, system API helpers,
 * health/readiness endpoints, integration helpers, system contract endpoints, module lookup helpers,
 * route metadata, static page metadata, and CI workflow presence.
 */

const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const requiredFiles = [
  'package.json',
  'pnpm-workspace.yaml',
  'firebase.json',
  'firestore.rules',
  'storage.rules',
  'firestore.indexes.json',
  '.env.example',
  '.github/workflows/studio-audit.yml',
  'functions/package.json',
  'functions/src/index.ts',
  'functions/src/studio-system.ts',
  'apps/studio/app/api/health/route.ts',
  'apps/studio/app/api/system/health/route.ts',
  'apps/studio/app/api/system/manifest/route.ts',
  'apps/studio/app/api/system/capabilities/route.ts',
  'apps/studio/app/api/system/openapi/route.ts',
  'apps/studio/app/api/system/integrations/route.ts',
  'apps/studio/app/api/integrations/asset-factory/health/route.ts',
  'apps/studio/app/healthz/route.ts',
  'apps/studio/app/readyz/route.ts',
  'apps/studio/app/dashboard/page.tsx',
  'apps/studio/app/usage/page.tsx',
  'apps/studio/app/integrations/page.tsx',
  'apps/studio/app/settings/page.tsx',
  'apps/studio/app/admin/page.tsx',
  'apps/studio/app/analytics/page.tsx',
  'apps/studio/app/privacy/page.tsx',
  'apps/studio/app/terms/page.tsx',
  'apps/studio/app/contact/page.tsx',
  'apps/studio/app/waitlist/page.tsx',
  'apps/studio/app/waitlist/WaitlistForm.tsx',
  'apps/studio/app/demo/page.tsx',
  'apps/studio/app/status/page.tsx',
  'apps/studio/app/systems/page.tsx',
  'apps/studio/app/system/page.tsx',
  'apps/studio/lib/integrations/assetFactory.ts',
  'apps/studio/lib/studio/config.ts',
  'apps/studio/lib/studio/firebase.ts',
  'apps/studio/lib/studio/integrations.ts',
  'apps/studio/lib/studio/modules.ts',
  'apps/studio/lib/studio/status.ts',
  'apps/studio/lib/studio/systems.ts',
  'apps/studio/lib/studio/types.ts',
  'apps/studio/lib/studio/firebase-client.ts',
  'apps/studio/components/studio/ModuleOverviewPage.tsx',
  'apps/studio/components/studio/StudioActionPanel.tsx',
  'apps/studio/app/studio/page.tsx',
  'apps/studio/app/studio/projects/page.tsx',
  'apps/studio/app/studio/assets/page.tsx',
  'apps/studio/app/studio/exports/page.tsx',
  'apps/studio/app/studio/admin/page.tsx',
  'apps/studio/app/studio/settings/page.tsx',
  'apps/studio/app/studio/xr/page.tsx',
  'README.md',
  'SYSTEM_MAP.md',
  'AUDIT_REPORT.md',
  'FIREBASE.md',
  'TESTING.md',
  'HANDOFF.md',
  'RELEASE_NOTES.md',
  'FINAL_AUDIT_REPORT.md',
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length > 0) {
  console.error('[urai-studio:smoke] Missing required files:');
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

function requireTokens(filePath, tokens, label) {
  const source = fs.readFileSync(path.join(root, filePath), 'utf8');
  for (const token of tokens) {
    if (!source.includes(token)) {
      console.error(`[urai-studio:smoke] ${label} missing token: ${token}`);
      process.exit(1);
    }
  }
  return source;
}

for (const [filePath, canonical] of [
  ['apps/studio/app/dashboard/page.tsx', '/dashboard'],
  ['apps/studio/app/usage/page.tsx', '/usage'],
  ['apps/studio/app/integrations/page.tsx', '/integrations'],
  ['apps/studio/app/settings/page.tsx', '/settings'],
  ['apps/studio/app/admin/page.tsx', '/admin'],
  ['apps/studio/app/analytics/page.tsx', '/analytics'],
  ['apps/studio/app/privacy/page.tsx', '/privacy'],
  ['apps/studio/app/terms/page.tsx', '/terms'],
  ['apps/studio/app/contact/page.tsx', '/contact'],
  ['apps/studio/app/waitlist/page.tsx', '/waitlist'],
  ['apps/studio/app/demo/page.tsx', '/demo'],
  ['apps/studio/app/status/page.tsx', '/status'],
  ['apps/studio/app/systems/page.tsx', '/system'],
]) {
  requireTokens(filePath, ['Metadata', 'metadata', `canonical: '${canonical}'`], `${canonical} page metadata`);
}

requireTokens('apps/studio/app/system/page.tsx', ['metadata', "'../systems/page'"], '/system alias page');
requireTokens('apps/studio/app/waitlist/WaitlistForm.tsx', ["'use client'", 'WaitlistForm', 'FormEvent', "fetch('/api/waitlist'"], 'waitlist client form');

requireTokens('apps/studio/lib/studio/config.ts', ['StudioConfig', 'studioConfig', 'siteUrl', 'firebaseProjectId'], 'config.ts');
requireTokens('apps/studio/lib/studio/firebase.ts', ['FirebaseDiagnostics', 'firebaseDiagnostics', 'emulator', 'adminAvailable'], 'firebase.ts');
requireTokens('apps/studio/lib/studio/integrations.ts', ['StudioIntegrationDiagnostic', 'StudioIntegrationStatus', 'studioIntegrations', 'required'], 'integrations.ts');
requireTokens('apps/studio/lib/integrations/assetFactory.ts', ['AssetFactoryPingResult', 'AbortController', "cache: 'no-store'", 'getAssetFactoryHealth', 'getAssetFactoryManifest'], 'assetFactory.ts');
requireTokens('apps/studio/app/api/health/route.ts', ['ApiHealthResponse', "dynamic = 'force-dynamic'", "'Cache-Control': 'no-store, max-age=0'"], 'api health route');
requireTokens('apps/studio/app/healthz/route.ts', ['LivenessResponse', "dynamic = 'force-dynamic'", "'Cache-Control': 'no-store, max-age=0'"], 'healthz route');
requireTokens('apps/studio/app/readyz/route.ts', ['ReadinessResponse', "dynamic = 'force-dynamic'", 'status: readiness.ok ? 200 : 503', "'Cache-Control': 'no-store, max-age=0'"], 'readyz route');
requireTokens('apps/studio/app/api/integrations/asset-factory/health/route.ts', ['getAssetFactoryHealth', "dynamic = 'force-dynamic'", 'status: health.ok ? 200 : 503', "'Cache-Control': 'no-store, max-age=0'"], 'asset factory health route');
requireTokens('apps/studio/app/api/system/health/route.ts', ['SystemHealthResponse', "dynamic = 'force-dynamic'", "'Cache-Control': 'no-store, max-age=0'", 'status: readiness.ok ? 200 : 503'], 'system health route');
requireTokens('apps/studio/app/api/system/manifest/route.ts', ['SystemManifestResponse', "dynamic = 'force-dynamic'", "'Cache-Control': 'no-store, max-age=0'", 'firebaseDiagnostics'], 'system manifest route');
requireTokens('apps/studio/app/api/system/capabilities/route.ts', ['SystemCapabilitiesResponse', "dynamic = 'force-dynamic'", "'Cache-Control': 'no-store, max-age=0'", 'systemCapabilities'], 'system capabilities route');
requireTokens('apps/studio/app/api/system/openapi/route.ts', ['OpenApiDocument', "dynamic = 'force-dynamic'", "'Cache-Control': 'no-store, max-age=0'"], 'system openapi route');
requireTokens('apps/studio/app/api/system/integrations/route.ts', ['SystemIntegrationsResponse', "dynamic = 'force-dynamic'", 'missingRequired', 'status: body.ok ? 200 : 503'], 'system integrations route');

requireTokens('apps/studio/lib/studio/modules.ts', ['studioModules', 'moduleByRoute', 'CreativePipelineId', "route: '/studio'", "route: '/asset-factory'"], 'modules.ts');
requireTokens('apps/studio/lib/studio/status.ts', ['ReadinessCheck', 'ReadinessSummary', 'ModuleStatusSummary', 'readinessSummary', 'moduleStatuses'], 'status.ts');
requireTokens('apps/studio/lib/studio/systems.ts', ['SystemVisibility', 'systemBySlug', 'systemByRoute', 'publicSystems', "route: '/studio'"], 'systems.ts');
requireTokens('apps/studio/components/studio/ModuleOverviewPage.tsx', ['moduleByRoute', 'systemBySlug', 'systemByRoute', 'routeAliases', 'slugAliases'], 'ModuleOverviewPage');

const functionSource = requireTokens('functions/src/studio-system.ts', ['firebase-functions/v2/https', 'onCall', 'HttpsError'], 'studio-system.ts');
if (functionSource.includes('functions.https.onCall') || functionSource.includes('functions.https.HttpsError')) {
  console.error('[urai-studio:smoke] studio-system.ts still contains v1 callable API usage.');
  process.exit(1);
}

const requiredExports = [
  'ping',
  'createStudioProject',
  'seedStudioDemo',
  'generateStudioScript',
  'generateSceneNarration',
  'generateSrtForProject',
  'generateCompanionIntro',
  'createAssetJob',
  'markAssetReady',
  'createExportJob',
  'processExportJob',
  'getExportJobStatus',
  'getStudioDashboard',
  'logStudioEvent',
];

const missingExports = requiredExports.filter((name) => !functionSource.includes(`export const ${name}`));
if (missingExports.length > 0) {
  console.error('[urai-studio:smoke] Missing callable exports:');
  for (const name of missingExports) console.error(`- ${name}`);
  process.exit(1);
}

requireTokens('functions/src/index.ts', ['studio-system'], 'functions index');
requireTokens('apps/studio/components/studio/StudioActionPanel.tsx', ['studioApi.ping', 'studioApi.seedStudioDemo', 'studioApi.createStudioProject', 'studioApi.createExportJob'], 'StudioActionPanel');

const firestoreRules = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');
for (const collection of ['studioProjects', 'studioAssets', 'studioScenes', 'studioScrolls', 'narratorScripts', 'exportJobs']) {
  if (!firestoreRules.includes(`match /${collection}/`)) {
    console.error(`[urai-studio:smoke] firestore.rules missing ${collection}`);
    process.exit(1);
  }
}

const storageRules = fs.readFileSync(path.join(root, 'storage.rules'), 'utf8');
for (const storagePath of ['user-uploads', 'generated', 'public/studio-assets']) {
  if (!storageRules.includes(storagePath)) {
    console.error(`[urai-studio:smoke] storage.rules missing ${storagePath}`);
    process.exit(1);
  }
}

const workflow = fs.readFileSync(path.join(root, '.github/workflows/studio-audit.yml'), 'utf8');
for (const command of ['pnpm lint', 'pnpm typecheck', 'pnpm test', 'pnpm build', 'pnpm --dir functions build', 'pnpm studio:smoke']) {
  if (!workflow.includes(command)) {
    console.error(`[urai-studio:smoke] CI workflow missing command: ${command}`);
    process.exit(1);
  }
}

console.log('[urai-studio:smoke] Static smoke checks passed.');

if (process.env.STUDIO_SMOKE_CALLABLES !== 'true') {
  console.log('[urai-studio:smoke] Callable checks skipped. Set STUDIO_SMOKE_CALLABLES=true with Firebase env/emulators to run them.');
  process.exit(0);
}

console.error('[urai-studio:smoke] Callable mode requested but is not implemented in this static Node script yet. Use Firebase Emulator UI or add firebase/app + firebase/functions client bootstrap here.');
process.exit(2);
