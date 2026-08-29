import fs from 'node:fs';
import path from 'node:path';

const productionPath = path.resolve('productions/built-from-survival/built-from-survival.production.json');
const contractPath = path.resolve('apps/studio/lib/life-film-canon.ts');

const productionText = fs.readFileSync(productionPath, 'utf8');
const contractText = fs.readFileSync(contractPath, 'utf8');
const production = JSON.parse(productionText);

// Detect concrete private source pointers, not harmless prose that names a provider.
// Public production policy is allowed to say that Gmail/Drive pointers are forbidden.
const forbidden = [
  /drive\.google\.com/i,
  /docs\.google\.com/i,
  /mail\.google\.com/i,
  /gmailMessageId/i,
  /driveFileId/i,
  /driveFolderId/i,
  /driveContactSheetId/i,
  /13OiHavP9MSFgObm9GRANza9eCHAiWo0e/,
  /1luj263eAfUo4wzAhQDakBzRdaUJm6AMn/,
  /1D-ISJKQkSa9__ASzRUvUyOnXAVnAc77Y/,
];

const combinedPublicText = `${productionText}\n${contractText}`;
for (const pattern of forbidden) {
  if (pattern.test(combinedPublicText)) {
    throw new Error(`private_life_film_pointer_leaked:${pattern}`);
  }
}

if (production?.sourceResolution?.mode !== 'private-canon-broker') {
  throw new Error('life_film_private_canon_broker_not_enabled');
}
if (production?.sourceResolution?.automatic !== true) {
  throw new Error('life_film_canon_resolution_not_automatic');
}
if (production?.sourceResolution?.manualUserUploadRequired !== false) {
  throw new Error('life_film_still_requires_manual_user_upload');
}
if (production?.sourceResolution?.unresolvedSourcesFailClosed !== true) {
  throw new Error('life_film_unresolved_sources_do_not_fail_closed');
}

const requiredKeys = [
  'ADAM-CURRENT-LIKENESS-001',
  'ADAM-AGE19-001',
  'ADAM-JACOB-MOTION-001',
];
for (const key of requiredKeys) {
  if (!production.sourceKeys.includes(key)) {
    throw new Error(`missing_canonical_life_film_source_key:${key}`);
  }
}

const requiredRuntimeCaptureKeys = [
  'URAI-HOME-RUNTIME-CAPTURE',
  'URAI-GROUND-RUNTIME-CAPTURE',
  'URAI-ORB-RUNTIME-CAPTURE',
  'URAI-LIFE-MAP-RUNTIME-CAPTURE',
  'URAI-FOCUS-RUNTIME-CAPTURE',
  'URAI-REPLAY-RUNTIME-CAPTURE',
  'URAI-PASSPORT-RUNTIME-CAPTURE',
  'URAI-STUDIO-RUNTIME-CAPTURE',
  'URAI-ASSET-FACTORY-RUNTIME-CAPTURE',
];
for (const key of requiredRuntimeCaptureKeys) {
  if (!production.sourceKeys.includes(key)) {
    throw new Error(`missing_life_film_runtime_capture_key:${key}`);
  }
}

console.log('Life Film canon guard: PASS');
