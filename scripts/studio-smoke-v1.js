#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function exists(file) {
  if (!fs.existsSync(path.join(root, file))) {
    throw new Error(`Missing required file: ${file}`);
  }
}

function has(file, tokens) {
  const src = read(file);
  for (const token of tokens) {
    if (!src.includes(token)) {
      throw new Error(`${file} missing ${token}`);
    }
  }
}

function walk(dir) {
  const absolute = path.join(root, dir);
  if (!fs.existsSync(absolute)) return [];

  const found = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...walk(relative));
    } else {
      found.push(relative);
    }
  }
  return found;
}

function archivedBackupsAreNeutralized(dir) {
  for (const file of walk(dir)) {
    if (!file.includes('.bak')) continue;
    const src = read(file);
    if (!src.includes('Archived placeholder') || !src.includes('export {};')) {
      throw new Error(`${file} is an active backup artifact; neutralize or remove it`);
    }
  }
}

for (const file of [
  'package.json',
  'pnpm-workspace.yaml',
  'apphosting.yaml',
  'firebase.json',
  'firestore.rules',
  'storage.rules',
  'firestore.indexes.json',
  'docs/URAI_STUDIO_DONE_DONE_LOCK.md',
  'docs/contracts/URAI_SYSTEM_CONTRACT.md',
  'docs/URAI_STUDIO_SYSTEM_PIPELINES_AUDIT_2026-06-16.md',
  'docs/URAI_STUDIO_ECOSYSTEM_URL_KEYS.md',
  'docs/URAI_STUDIO_RELEASE_EVIDENCE.schema.json',
  'functions/src/studio-system.ts',
  'functions/src/create-job.ts',
  'functions/src/job-runner.ts',
  'apps/studio/lib/urai-system-contract.ts',
  'apps/studio/lib/studio-runtime-store.ts',
  'apps/studio/lib/studio-spatial-handoff.ts',
  'apps/studio/lib/studio/integrations.ts',
  'apps/studio/app/page.tsx',
  'apps/studio/app/admin/page.tsx',
  'apps/studio/app/studio/admin/page.tsx',
  'apps/studio/app/api/contact/route.ts',
  'apps/studio/app/api/waitlist/route.ts',
  'apps/studio/app/api/system/urai-contract/route.ts',
  'apps/studio/app/api/system/spatial-handoff/route.ts',
  'apps/studio/app/api/studio/jobs/route.ts',
  'apps/studio/app/api/studio/exports/route.ts',
  'apps/studio/components/site/MagicalHomeExperience.tsx',
  'apps/studio/tests/all.test.mjs',
  'apps/studio/tests/all-runner.test.mjs',
  'apps/studio/tests/legacy-roots.test.mjs',
  'apps/studio/tests/public-submissions.test.mjs',
  'apps/studio/tests/storage-rules.test.mjs',
  'apps/studio/tests/studio-spatial-handoff.test.mjs',
  'apps/studio/tests/integrations.test.mjs',
  'apps/studio/tests/create-job-validation.test.mjs',
  'apps/studio/tests/job-runner-fallback.test.mjs',
  'apps/studio/tests/release-evidence-schema.test.mjs',
]) {
  exists(file);
}

has('apps/studio/tests/all.test.mjs', ['readdirSync', "file.endsWith('.test.mjs')", 'await import', 'all Studio regression tests passed']);
has('apps/studio/tests/all-runner.test.mjs', ['auto-discovers every .test.mjs file', 'forbiddenManualImports', 'await import']);
has('apps/studio/tests/legacy-roots.test.mjs', ['apps/*', 'packages/*', 'forbiddenWorkspaceRoots', 'urai-studio canonical app root']);
has('apps/studio/components/site/MagicalHomeExperience.tsx', [
  'data-urai-v1-home-experience',
  'data-urai-v1-home-shell="ground-orb-chat"',
  'data-urai-home-layer="ground-world"',
  'data-urai-home-layer="orb-chat"',
  'data-urai-home-layer="chat-interface"',
  'data-urai-v1-field-reconstruction',
  'relationship fields',
  'recovery fields',
]);

has('apps/studio/app/page.tsx', ['MagicalHomeExperience', '<MagicalHomeExperience />']);
has('apps/studio/app/admin/page.tsx', ['adminQaEnabled', 'NEXT_PUBLIC_STUDIO_ADMIN_QA_ENABLED', 'admin-gated']);
has('apps/studio/app/studio/admin/page.tsx', ['adminQaEnabled', 'NEXT_PUBLIC_STUDIO_ADMIN_QA_ENABLED', 'studio-admin-gated']);
has('apphosting.yaml', ['runtime: nodejs20', 'NEXT_PUBLIC_STUDIO_ADMIN_QA_ENABLED', 'value: "false"']);
has('apps/studio/app/api/contact/route.ts', ["collection('contactRequests')", "collection('projectRequests')", "collection('integrationRequests')", 'bot_rejected', 'invalid_json']);
has('apps/studio/app/api/waitlist/route.ts', ["collection('waitlist')", 'bot_rejected', 'invalid_json']);
has('apps/studio/lib/urai-system-contract.ts', ['URAI_SYSTEM_CONTRACT', 'StudioJob', 'StudioAsset', 'StudioExport', 'UraiPassport', 'V1_GENESIS_HOME', 'V2_COGNITIVE_MIRROR', 'V3_PATTERN_REFLECTION', 'V4_WEBXR_HANDOFF', 'V5_MIRROR_OF_BECOMING']);
has('apps/studio/lib/studio-runtime-store.ts', ['createStudioJob', 'createStudioExport', 'listTenantJobs', 'tenantScoped', 'studioJobs', 'studioExports']);
has('apps/studio/lib/studio-spatial-handoff.ts', ['STUDIO_SPATIAL_HANDOFF_VERSION', 'DEFAULT_STUDIO_SPATIAL_RUNTIME_MATRIX', 'validateStudioSpatialManifest', 'listBlockedStudioSpatialClaims', 'isStudioSpatialManifestReleaseSafe']);
has('apps/studio/lib/studio/integrations.ts', ['asset-factory', 'spatial', 'jobs', 'content', 'analytics', 'marketing', 'admin', 'privacy', 'investors', 'b2b-portal']);
has('apps/studio/app/api/system/urai-contract/route.ts', ['URAI_SYSTEM_CONTRACT', 'URAI_SYSTEM_CONTRACT_VERSION', 'Cache-Control']);
has('apps/studio/app/api/system/spatial-handoff/route.ts', ['STUDIO_SPATIAL_HANDOFF_VERSION', 'DEFAULT_STUDIO_SPATIAL_RUNTIME_MATRIX', 'evidenceRequiredRuntimeTargets', 'fallback_cards']);
has('apps/studio/app/api/studio/jobs/route.ts', ['createStudioJob', 'listTenantJobs', 'runtimeStoreStatus', 'invalid_prompt']);
has('apps/studio/app/api/studio/exports/route.ts', ['createStudioExport', 'runtimeStoreStatus', 'tenantScoped', 'invalid_project']);
has('functions/src/create-job.ts', ['normalizeCreateJobPayload', 'allowedKinds', 'projectId', 'kind', 'priority']);
has('functions/src/job-runner.ts', ['fallbackOutput', 'fallbackOnly: true', 'readyForExternalUse: false', 'fallback-clip.txt', 'fallback-package-manifest.json', 'job_succeeded_fallback']);
has('docs/contracts/URAI_SYSTEM_CONTRACT.md', ['StudioJob', 'StudioAsset', 'StudioExport', 'UraiPassport', 'V1_GENESIS_HOME', 'V5_MIRROR_OF_BECOMING']);
has('docs/URAI_STUDIO_SYSTEM_PIPELINES_AUDIT_2026-06-16.md', ['Jobs Pipeline', 'Content Pipeline', 'Asset Factory Pipeline', 'Spatial Pipeline', 'Analytics Pipeline', 'Marketing Pipeline', 'B2B Portal']);
has('docs/URAI_STUDIO_ECOSYSTEM_URL_KEYS.md', ['NEXT_PUBLIC_ASSET_FACTORY_URL', 'NEXT_PUBLIC_URAI_SPATIAL_URL', 'NEXT_PUBLIC_URAI_JOBS_URL', 'NEXT_PUBLIC_URAI_CONTENT_URL', 'NEXT_PUBLIC_URAI_ANALYTICS_URL', 'NEXT_PUBLIC_B2B_PORTAL_URL']);
has('docs/URAI_STUDIO_RELEASE_EVIDENCE.schema.json', ['URAI Studio release evidence record', 'repo', 'commitSha', 'recordedAt', 'environment', 'gates', 'install', 'lint', 'typecheck', 'tests', 'appBuild', 'functionsBuild', 'doneDoneGuard', 'releaseCheck', 'smoke']);
has('firestore.rules', ['match /waitlist/{id}', 'match /contactRequests/{id}', 'match /projectRequests/{id}', 'match /integrationRequests/{id}', 'match /studioBriefs/{id}', 'match /studioJobs/{id}', 'match /studioExports/{id}', 'allow read, write: if false;']);
has('firestore.indexes.json', ['"collectionGroup": "studioBriefs"', '"collectionGroup": "studioJobs"', '"collectionGroup": "studioExports"', '"fieldPath": "tenantId"']);
has('storage.rules', ['match /generated/{uid}/studio', 'match /public/studio-assets', 'allow write: if false;', 'request.auth.uid == uid', 'isStudioMember(studioId)']);
has('.github/workflows/studio-audit.yml', ['pnpm done-done:guard', 'pnpm lint', 'pnpm typecheck', 'pnpm test', 'pnpm build', 'pnpm --dir functions build', 'pnpm studio:smoke']);
has('functions/src/studio-system.ts', ['export const ping', 'export const seedStudioDemo', 'export const getStudioDashboard', 'firebase-functions/v2/https']);

archivedBackupsAreNeutralized('apps/studio/src');

console.log('[urai-studio:smoke-v1] passed');
