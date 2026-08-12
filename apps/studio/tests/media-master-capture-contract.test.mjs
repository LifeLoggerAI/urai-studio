import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');
const capture = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, 'productions/media-master/product-capture.production.json'),
    'utf8',
  ),
);
const planner = fs.readFileSync(
  path.join(repoRoot, 'scripts/media-master-capture-plan.mjs'),
  'utf8',
);

assert.equal(capture.projectId, 'urai-v1-v5-product-capture');
assert.equal(capture.authority.githubIssue, 'LifeLoggerAI/urai-studio#70');
assert.equal(capture.truthBoundary.exactRuntimeShaRequired, true);
assert.equal(capture.truthBoundary.runtimeBaseUrlRequired, true);
assert.equal(capture.truthBoundary.providerSpendAuthorized, false);
assert.equal(capture.truthBoundary.publicReleaseAuthorized, false);
assert.equal(capture.execution.finalPromotionAuthorized, false);

const expected = [
  'home',
  'orb',
  'ground',
  'life-map',
  'focus',
  'replay',
  'council',
  'mirror',
  'shadow',
  'legacy',
  'passport',
  'ar',
  'vr',
  'xr',
];
assert.deepEqual(
  capture.surfaces.map((surface) => surface.id),
  expected,
);
assert.equal(new Set(capture.surfaces.map((surface) => surface.id)).size, 14);

for (const surface of capture.surfaces) {
  assert.ok(surface.captureStates.length > 0, `${surface.id} needs capture states`);
  if (['ar', 'vr', 'xr'].includes(surface.id)) {
    assert.equal(surface.route, null);
    assert.equal(surface.requiresDeviceSpecificAuthority, true);
  } else {
    assert.match(surface.route, /^\//, `${surface.id} must have a governed route`);
  }
}

assert.equal(capture.derivatives.length, 4);
assert.deepEqual(
  capture.derivatives.map((profile) => profile.aspectRatio),
  ['16:9', '16:9', '9:16', '1:1'],
);
for (const field of [
  'captureId',
  'world',
  'repository',
  'exactSha',
  'baseUrl',
  'route',
  'viewport',
  'capturedAt',
  'artifactPath',
  'sha256',
  'technicalQa',
  'visualQa',
  'founderApproval',
  'releaseAuthorization',
]) {
  assert.ok(capture.requiredReceiptFields.includes(field), `missing receipt field ${field}`);
}

for (const token of [
  'URAI_CAPTURE_BASE_URL',
  'URAI_CAPTURE_EXACT_SHA',
  "^[0-9a-f]{40}$",
  'publicReleaseAuthorized: false',
  'providerSpendAuthorized: false',
  "technicalQa: 'PENDING'",
  "visualQa: 'PENDING'",
  "founderApproval: 'PENDING'",
]) {
  assert.ok(planner.includes(token), `planner missing fail-closed token: ${token}`);
}

assert.doesNotMatch(planner, /publicReleaseAuthorized:\s*true/);
assert.doesNotMatch(planner, /providerSpendAuthorized:\s*true/);

console.log('media master capture contract passed: 14 governed surfaces + exact-SHA fail-closed planner');
