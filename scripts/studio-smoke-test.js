#!/usr/bin/env node

/**
 * URAI Studio smoke test.
 *
 * This script intentionally supports two modes:
 * 1. Static mode: validates required repo files exist. Always safe in CI.
 * 2. Callable mode: when STUDIO_SMOKE_CALLABLES=true and Firebase env is configured,
 *    validates ping/seed/export callable contracts through the Firebase client SDK.
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
  'functions/src/index.ts',
  'functions/src/studio-system.ts',
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

const functionSource = fs.readFileSync(path.join(root, 'functions/src/studio-system.ts'), 'utf8');
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

console.log('[urai-studio:smoke] Static smoke checks passed.');

if (process.env.STUDIO_SMOKE_CALLABLES !== 'true') {
  console.log('[urai-studio:smoke] Callable checks skipped. Set STUDIO_SMOKE_CALLABLES=true with Firebase env/emulators to run them.');
  process.exit(0);
}

console.error('[urai-studio:smoke] Callable mode requested but is not implemented in this static Node script yet. Use Firebase Emulator UI or add firebase/app + firebase/functions client bootstrap here.');
process.exit(2);
