import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const audio = JSON.parse(await readFile(new URL('../../../productions/media-master/audio-reconciliation.production.json', import.meta.url), 'utf8'));
const launch = JSON.parse(await readFile(new URL('../../../productions/media-master/launch-output-templates.production.json', import.meta.url), 'utf8'));
const capture = JSON.parse(await readFile(new URL('../../../productions/media-master/product-capture.production.json', import.meta.url), 'utf8'));
const drivers = JSON.parse(await readFile(new URL('../../../productions/media-master/capture-state-drivers.production.json', import.meta.url), 'utf8'));
const beforeRest = JSON.parse(await readFile(new URL('../../../productions/before-the-rest-of-the-world/cinema-factory-bindings.production.json', import.meta.url), 'utf8'));
const rootPackage = JSON.parse(await readFile(new URL('../../../package.json', import.meta.url), 'utf8'));
const captureExecutor = await readFile(new URL('../../../scripts/media-master-capture-execute.mjs', import.meta.url), 'utf8');

const canonicalSlots = new Set(capture.surfaces.flatMap((surface) => surface.captureStates.map((state) => `${surface.id}.${state}`)));
const canonicalWebSlots = new Set(capture.surfaces.filter((surface) => surface.route).flatMap((surface) => surface.captureStates.map((state) => `${surface.id}.${state}`)));

function assertCanonicalSlots(slots) {
  for (const slot of slots) assert.ok(canonicalSlots.has(slot), `unknown canonical capture slot: ${slot}`);
}

test('audio reconciliation preserves accepted assets and spend gates', () => {
  assert.equal(audio.policy.regenerateAcceptedAssets, false);
  assert.equal(audio.policy.paidGenerationAuthorized, false);
  assert.equal(audio.policy.publicReleaseAuthorized, false);
  assert.equal(audio.policy.finalHumanAudioApprovalRequired, true);
  assert.equal(audio.reconciledCandidates.length, 8);
  const ground = audio.reconciledCandidates.find((asset) => asset.id === 'ground-ambient-v1');
  assert.ok(ground);
  assert.equal(ground.sha256, '71c38c9e852988fe00e1605301996f12029a4aa0ce1e29f4734dc66f96957e16');
  assert.equal(ground.action, 'reuse-do-not-regenerate');
  assert.ok(audio.genuineGapFamilies.includes('mirror-ambient'));
});

test('launch templates are reusable, canonical and fail closed', () => {
  assert.equal(launch.policy.publicReleaseAuthorized, false);
  assert.equal(launch.policy.paidGenerationAuthorized, false);
  assert.equal(launch.policy.founderVisualApprovalRequired, true);
  assert.equal(launch.policy.syntheticProductUiForbidden, true);
  assert.equal(launch.templates.length, 6);
  for (const template of launch.templates) assertCanonicalSlots(template.requiredCaptureSlots);
  assert.ok(launch.templates.some((item) => item.id === 'launch-walkthrough-30s'));
  assert.ok(launch.templates.some((item) => item.id === 'investor-showcase'));
  assert.ok(launch.receiptFields.includes('sourceExactSha'));
  assert.ok(launch.receiptFields.includes('contentSha256'));
  assert.ok(launch.receiptFields.includes('founderApproval'));
  assert.ok(launch.receiptFields.includes('releaseAuthorization'));
});

test('capture executor requires exact preview binding and deterministic canonical state drivers', () => {
  assert.equal(drivers.binding.exactSha, null);
  assert.equal(drivers.binding.baseUrl, null);
  assert.equal(drivers.binding.previewEvidence, null);
  assert.equal(drivers.policy.allowSyntheticState, false);
  assert.equal(drivers.policy.allowDomMutation, false);
  assert.equal(drivers.policy.allowJavaScriptEvaluation, false);
  assert.equal(drivers.policy.allowRouteSubstitution, false);
  assert.equal(drivers.policy.publicReleaseAuthorized, false);
  assert.deepEqual(new Set(drivers.allowedStepTypes), new Set(['click', 'press', 'hover', 'waitForSelector', 'waitForTimeout']));
  assert.equal(Object.keys(drivers.drivers).length, canonicalWebSlots.size);
  for (const slot of canonicalWebSlots) {
    assert.ok(drivers.drivers[slot], `missing state driver registry entry: ${slot}`);
    assert.equal(drivers.drivers[slot].status, 'UNBOUND');
    assert.deepEqual(drivers.drivers[slot].steps, []);
  }
  assert.equal(rootPackage.scripts['media-master:capture-execute'], 'node scripts/media-master-capture-execute.mjs');
  for (const token of [
    'URAI_CAPTURE_ALLOW_PARTIAL',
    'state-driver exact SHA does not match plan',
    'state-driver base URL does not match plan',
    'previewEvidence',
    "technicalQa: 'PASS'",
    "visualQa: 'PENDING'",
    "founderApproval: 'PENDING'",
    'releaseAuthorization: false',
  ]) assert.match(captureExecutor, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(captureExecutor, /page\.evaluate\s*\(/);
  assert.doesNotMatch(captureExecutor, /addInitScript\s*\(/);
});

test('Before the Rest binds canonical capture slots without weakening film gates', () => {
  assert.equal(beforeRest.truthBoundary.exactSpatialShaRequired, true);
  assert.equal(beforeRest.truthBoundary.matchingRuntimeUrlRequired, true);
  assert.equal(beforeRest.truthBoundary.syntheticProductUiForbidden, true);
  assert.equal(beforeRest.truthBoundary.founderVisualApprovalRequired, true);
  assert.equal(beforeRest.truthBoundary.publicReleaseAuthorized, false);
  for (const binding of beforeRest.sequenceBindings) assertCanonicalSlots(binding.captureSlots);
  assert.ok(beforeRest.sequenceBindings.some((item) => item.sequenceId === 'S04' && item.captureSlots.includes('home.arrival')));
  assert.ok(beforeRest.sequenceBindings.some((item) => item.sequenceId === 'S05' && item.captureSlots.includes('life-map.star-selected')));
  assert.ok(beforeRest.sequenceBindings.some((item) => item.sequenceId === 'S06' && item.runtimeAudioCandidateIds.includes('ground-ambient-v1')));
  assert.ok(beforeRest.sequenceBindings.some((item) => item.sequenceId === 'S09' && item.state === 'REPO_EVIDENCE_CAPTURE_REQUIRED'));
  assert.match(beforeRest.cinematicAudioBoundary, /do not satisfy score, narration, music-license, or cinematic sound-design/i);
});
