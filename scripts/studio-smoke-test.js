#!/usr/bin/env node

/**
 * URAI Studio smoke test.
 *
 * Static mode validates required repo files, frontend route files, callables,
 * Firebase rules, Functions v2 callable usage, Studio registry helpers, system API helpers,
 * and CI workflow presence.
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
  'apps/studio/app/api/system/health/route.ts',
  'apps/studio/lib/studio/config.ts',
  'apps/studio/lib/studio/firebase.ts',
  'apps/studio/lib/studio/integrations.ts',
  'apps/studio/lib/studio/modules.ts',
  'apps/studio/lib/studio/status.ts',
  'apps/studio/lib/studio/systems.ts',
  'apps/studio/lib/studio/types.ts',
  'apps/studio/lib/studio/firebase-client.ts',
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

const configSource = fs.readFileSync(path.join(root, 'apps/studio/lib/studio/config.ts'), 'utf8');
for (const token of ['StudioConfig', 'studioConfig', 'siteUrl', 'firebaseProjectId']) {
  if (!configSource.includes(token)) {
    console.error(`[urai-studio:smoke] config.ts missing config token: ${token}`);
    process.exit(1);
  }
}

const firebaseSource = fs.readFileSync(path.join(root, 'apps/studio/lib/studio/firebase.ts'), 'utf8');
for (const token of ['FirebaseDiagnostics', 'firebaseDiagnostics', 'emulator', 'adminAvailable']) {
  if (!firebaseSource.includes(token)) {
    console.error(`[urai-studio:smoke] firebase.ts missing diagnostics token: ${token}`);
    process.exit(1);
  }
}

const integrationsSource = fs.readFileSync(path.join(root, 'apps/studio/lib/studio/integrations.ts'), 'utf8');
for (const token of ['StudioIntegrationDiagnostic', 'StudioIntegrationStatus', 'studioIntegrations', 'required']) {
  if (!integrationsSource.includes(token)) {
    console.error(`[urai-studio:smoke] integrations.ts missing integration token: ${token}`);
    process.exit(1);
  }
}

const healthRouteSource = fs.readFileSync(path.join(root, 'apps/studio/app/api/system/health/route.ts'), 'utf8');
for (const token of ['SystemHealthResponse', "dynamic = 'force-dynamic'", "'Cache-Control': 'no-store, max-age=0'", 'status: readiness.ok ? 200 : 503']) {
  if (!healthRouteSource.includes(token)) {
    console.error(`[urai-studio:smoke] system health route missing token: ${token}`);
    process.exit(1);
  }
}

const modulesSource = fs.readFileSync(path.join(root, 'apps/studio/lib/studio/modules.ts'), 'utf8');
for (const token of ['studioModules', 'moduleByRoute', 'CreativePipelineId', "route: '/studio'", "route: '/asset-factory'"]) {
  if (!modulesSource.includes(token)) {
    console.error(`[urai-studio:smoke] modules.ts missing registry token: ${token}`);
    process.exit(1);
  }
}

const statusSource = fs.readFileSync(path.join(root, 'apps/studio/lib/studio/status.ts'), 'utf8');
for (const token of ['ReadinessCheck', 'ReadinessSummary', 'ModuleStatusSummary', 'readinessSummary', 'moduleStatuses']) {
  if (!statusSource.includes(token)) {
    console.error(`[urai-studio:smoke] status.ts missing typed status token: ${token}`);
    process.exit(1);
  }
}

const systemsSource = fs.readFileSync(path.join(root, 'apps/studio/lib/studio/systems.ts'), 'utf8');
for (const token of ['SystemVisibility', 'systemBySlug', 'systemByRoute', 'publicSystems', "route: '/studio'"]) {
  if (!systemsSource.includes(token)) {
    console.error(`[urai-studio:smoke] systems.ts missing system registry token: ${token}`);
    process.exit(1);
  }
}

const functionSource = fs.readFileSync(path.join(root, 'functions/src/studio-system.ts'), 'utf8');
if (!functionSource.includes('firebase-functions/v2/https')) {
  console.error('[urai-studio:smoke] studio-system.ts must import Firebase Functions v2 https APIs.');
  process.exit(1);
}
if (!functionSource.includes('onCall') || !functionSource.includes('HttpsError')) {
  console.error('[urai-studio:smoke] studio-system.ts must use onCall and HttpsError.');
  process.exit(1);
}
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

const indexSource = fs.readFileSync(path.join(root, 'functions/src/index.ts'), 'utf8');
if (!indexSource.includes('studio-system')) {
  console.error('[urai-studio:smoke] functions/src/index.ts does not export studio-system.');
  process.exit(1);
}

const actionPanel = fs.readFileSync(path.join(root, 'apps/studio/components/studio/StudioActionPanel.tsx'), 'utf8');
for (const token of ['studioApi.ping', 'studioApi.seedStudioDemo', 'studioApi.createStudioProject', 'studioApi.createExportJob']) {
  if (!actionPanel.includes(token)) {
    console.error(`[urai-studio:smoke] StudioActionPanel missing ${token}`);
    process.exit(1);
  }
}

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
