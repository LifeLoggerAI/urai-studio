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
  'functions/src/studio-system.ts',
  'apps/studio/lib/urai-system-contract.ts',
  'apps/studio/app/page.tsx',
  'apps/studio/app/admin/page.tsx',
  'apps/studio/app/studio/admin/page.tsx',
  'apps/studio/app/api/contact/route.ts',
  'apps/studio/app/api/waitlist/route.ts',
  'apps/studio/app/api/system/urai-contract/route.ts',
  'apps/studio/components/site/MagicalHomeExperience.tsx',
  'apps/studio/tests/all.test.mjs',
  'apps/studio/tests/public-submissions.test.mjs',
  'apps/studio/tests/storage-rules.test.mjs',
]) {
  exists(file);
}

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
has('apps/studio/app/api/system/urai-contract/route.ts', ['URAI_SYSTEM_CONTRACT', 'URAI_SYSTEM_CONTRACT_VERSION', 'Cache-Control']);
has('docs/contracts/URAI_SYSTEM_CONTRACT.md', ['StudioJob', 'StudioAsset', 'StudioExport', 'UraiPassport', 'V1_GENESIS_HOME', 'V5_MIRROR_OF_BECOMING']);
has('firestore.rules', ['match /waitlist/{id}', 'match /contactRequests/{id}', 'match /projectRequests/{id}', 'match /integrationRequests/{id}', 'allow read, write: if false;']);
has('storage.rules', ['match /generated/{uid}/studio', 'match /public/studio-assets', 'allow write: if false;', 'request.auth.uid == uid', 'isStudioMember(studioId)']);
has('.github/workflows/studio-audit.yml', ['pnpm lint', 'pnpm typecheck', 'pnpm test', 'pnpm build', 'pnpm --dir functions build', 'pnpm studio:smoke']);
has('functions/src/studio-system.ts', ['export const ping', 'export const seedStudioDemo', 'export const getStudioDashboard', 'firebase-functions/v2/https']);

console.log('[urai-studio:smoke-v1] passed');
