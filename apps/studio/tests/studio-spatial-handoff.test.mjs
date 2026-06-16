import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../lib/studio-spatial-handoff.ts', import.meta.url), 'utf8');

const requiredTokens = [
  'STUDIO_SPATIAL_HANDOFF_VERSION',
  'StudioSpatialExportManifest',
  'DEFAULT_STUDIO_SPATIAL_RUNTIME_MATRIX',
  'createFallbackStudioSpatialManifest',
  'isStudioSpatialManifestReleaseSafe',
  "web_2d_fallback: 'verified'",
  "three_scene: 'requires_release_evidence'",
  "webxr_manifest: 'requires_release_evidence'",
  "quest_vr: 'unsupported'",
  "visionos: 'unsupported'",
  "handheld_ar: 'unsupported'",
];

for (const token of requiredTokens) {
  assert.ok(src.includes(token), `missing Studio-Spatial handoff token: ${token}`);
}

const forbiddenVerifiedTargets = [
  "quest_vr: 'verified'",
  "visionos: 'verified'",
  "handheld_ar: 'verified'",
];

for (const token of forbiddenVerifiedTargets) {
  assert.ok(!src.includes(token), `unsafe verified runtime default: ${token}`);
}

console.log('Studio-Spatial handoff contract coverage passed');
