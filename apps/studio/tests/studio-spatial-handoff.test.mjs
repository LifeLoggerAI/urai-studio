import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../lib/studio-spatial-handoff.ts', import.meta.url), 'utf8');

const requiredTokens = [
  'STUDIO_SPATIAL_HANDOFF_VERSION',
  'StudioSpatialExportManifest',
  'StudioSpatialValidationResult',
  'DEFAULT_STUDIO_SPATIAL_RUNTIME_MATRIX',
  'STUDIO_SPATIAL_UNSUPPORTED_RUNTIME_TARGETS',
  'STUDIO_SPATIAL_EVIDENCE_REQUIRED_TARGETS',
  'createFallbackStudioSpatialManifest',
  'listBlockedStudioSpatialClaims',
  'validateStudioSpatialManifest',
  'isStudioSpatialManifestReleaseSafe',
  "web_2d_fallback: 'verified'",
  "three_scene: 'requires_release_evidence'",
  "webxr_manifest: 'requires_release_evidence'",
  "quest_vr: 'unsupported'",
  "visionos: 'unsupported'",
  "handheld_ar: 'unsupported'",
  'missing-release-evidence:',
  'asset-not-tenant-scoped:',
  'unsafe-raw-data-flag',
  'fallback-status-with-advanced-renderer',
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

const advancedVerifiedPattern = /targetRuntimes\[[^\]]+\] === 'verified'[\s\S]+?releaseEvidence\.(studioBuildSha|spatialBuildSha|validatorName|validatedAt)/;
assert.ok(
  advancedVerifiedPattern.test(src),
  'advanced runtime verification must require release evidence checks',
);

const releaseSafeDelegatesToValidator = /isStudioSpatialManifestReleaseSafe[\s\S]+validateStudioSpatialManifest\(manifest\)\.ok/;
assert.ok(
  releaseSafeDelegatesToValidator.test(src),
  'release-safe helper must delegate to the full manifest validator',
);

console.log('Studio-Spatial handoff contract coverage passed');
