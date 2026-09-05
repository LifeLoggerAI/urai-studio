import assert from 'node:assert/strict';
import fs from 'node:fs';

const contractUrl = new URL('../../../productions/private-memory-film/render-contract.json', import.meta.url);
const readmeUrl = new URL('../../../productions/private-memory-film/README.md', import.meta.url);

const contract = JSON.parse(fs.readFileSync(contractUrl, 'utf8'));
const readme = fs.readFileSync(readmeUrl, 'utf8');

assert.equal(contract.version, 1);
assert.equal(contract.id, 'private-memory-film-v1');
assert.equal(contract.visibility, 'private-delivery-only');

assert.deepEqual(contract.targetRuntimeSeconds, { minimum: 360, maximum: 420 });
assert.ok(contract.targetRuntimeSeconds.minimum < contract.targetRuntimeSeconds.maximum);

assert.deepEqual(contract.picture, {
  masterAspectRatio: '2.39:1',
  counselAspectRatio: '16:9',
  frameRate: 24,
  masterResolution: '4K',
  reviewResolution: '1080p',
  motionRequired: true,
  stillPanSubstituteAllowed: false,
});

assert.deepEqual(contract.audio.requiredMixes, ['stereo', '5.1']);
assert.deepEqual(contract.audio.requiredStems, ['dialogue', 'music', 'effects', 'ambience']);
assert.equal(contract.audio.syntheticThirdPartyVoiceAllowed, false);
assert.equal(contract.audio.directToCameraRevealMustBeRealRecording, true);

assert.deepEqual(contract.privacy, {
  publicRepositoryMayContainPrivateSceneData: false,
  publicRepositoryMayContainIdentityMedia: false,
  publicRepositoryMayContainLegalFacts: false,
  publishTargets: [],
});

assert.equal(contract.truthGates.requireEvidenceLedger, true);
for (const [key, value] of Object.entries(contract.truthGates)) {
  if (key === 'requireEvidenceLedger') continue;
  assert.equal(value, false, `truth gate must fail closed: ${key}`);
}

for (const [key, value] of Object.entries(contract.identityQc)) {
  assert.equal(value, true, `identity QC gate must be required: ${key}`);
}

for (const [key, value] of Object.entries(contract.scenePackage)) {
  assert.equal(value, true, `scene package field must be required: ${key}`);
}

const expectedArtifacts = [
  'cinematic-master-4k',
  'counsel-master-4k-16x9',
  'private-review-1080p',
  'stereo-mix',
  'surround-5.1-mix',
  'dialogue-stem',
  'music-stem',
  'effects-stem',
  'ambience-stem',
  'captions-srt',
  'transcript-txt',
  'shot-manifest-json',
  'evidence-ledger-json',
  'rights-consent-ledger-json',
  'qc-report-json',
  'sha256sums',
];

assert.deepEqual(contract.requiredArtifacts, expectedArtifacts);
assert.equal(new Set(contract.requiredArtifacts).size, expectedArtifacts.length);

assert.deepEqual(contract.finalAcceptance, {
  humanReviewRequired: true,
  counselReviewBeforeAnyOtherUse: true,
  failedQcMayNotBeLabeledFinal: true,
});

for (const requiredText of [
  'No client names, legal facts, service records, addresses, likeness media, private dialogue, analytics exports, or source evidence belong in this public repository.',
  'No slideshow or still-image pan substitute for motion.',
  'No fabricated reaction, testimony, endorsement, legal statement, or disputed-event reenactment.',
  'Never publish private counsel material from this pipeline.',
  'Require human acceptance before delivery.',
]) {
  assert.ok(readme.includes(requiredText), `private memory film README missing boundary: ${requiredText}`);
}

for (const forbidden of [
  'public-delivery',
  'public release approved',
  'provider ready',
  'counsel approved',
  'identity verified',
  'final delivered',
]) {
  assert.equal(readme.toLowerCase().includes(forbidden), false, `README contains unsupported completion claim: ${forbidden}`);
}

console.log('private memory film contract coverage passed');
