import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const audio = JSON.parse(await readFile(new URL('../../../productions/media-master/audio-reconciliation.production.json', import.meta.url), 'utf8'));
const launch = JSON.parse(await readFile(new URL('../../../productions/media-master/launch-output-templates.production.json', import.meta.url), 'utf8'));
const beforeRest = JSON.parse(await readFile(new URL('../../../productions/before-the-rest-of-the-world/cinema-factory-bindings.production.json', import.meta.url), 'utf8'));

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

test('launch templates are reusable and fail closed pending capture and human approval', () => {
  assert.equal(launch.policy.publicReleaseAuthorized, false);
  assert.equal(launch.policy.paidGenerationAuthorized, false);
  assert.equal(launch.policy.founderVisualApprovalRequired, true);
  assert.equal(launch.policy.syntheticProductUiForbidden, true);
  assert.equal(launch.templates.length, 6);
  assert.ok(launch.templates.some((item) => item.id === 'launch-walkthrough-30s'));
  assert.ok(launch.templates.some((item) => item.id === 'investor-showcase'));
  assert.ok(launch.receiptFields.includes('sourceExactSha'));
  assert.ok(launch.receiptFields.includes('contentSha256'));
  assert.ok(launch.receiptFields.includes('founderApproval'));
  assert.ok(launch.receiptFields.includes('releaseAuthorization'));
});

test('Before the Rest binds real capture slots without weakening film gates', () => {
  assert.equal(beforeRest.truthBoundary.exactSpatialShaRequired, true);
  assert.equal(beforeRest.truthBoundary.matchingRuntimeUrlRequired, true);
  assert.equal(beforeRest.truthBoundary.syntheticProductUiForbidden, true);
  assert.equal(beforeRest.truthBoundary.founderVisualApprovalRequired, true);
  assert.equal(beforeRest.truthBoundary.publicReleaseAuthorized, false);
  assert.ok(beforeRest.sequenceBindings.some((item) => item.sequenceId === 'S04' && item.captureSlots.includes('home.default')));
  assert.ok(beforeRest.sequenceBindings.some((item) => item.sequenceId === 'S05' && item.captureSlots.includes('life-map.memory-open')));
  assert.ok(beforeRest.sequenceBindings.some((item) => item.sequenceId === 'S06' && item.runtimeAudioCandidateIds.includes('ground-ambient-v1')));
  assert.ok(beforeRest.sequenceBindings.some((item) => item.sequenceId === 'S09' && item.state === 'REPO_EVIDENCE_CAPTURE_REQUIRED'));
  assert.match(beforeRest.cinematicAudioBoundary, /do not satisfy score, narration, music-license, or cinematic sound-design/i);
});
