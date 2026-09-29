import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../lib/studio/life-media-acceptance.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);

const accepted = {
  schemaVersion: 1,
  productionId: 'film-001',
  filmType: 'documentary',
  candidateSha: 'a'.repeat(40),
  renderArtifactRefs: ['gs://private/master.mp4'],
  sourceManifestRef: 'manifest:film-001',
  visualQuality: 'accepted',
  audioQuality: 'accepted',
  editorialQuality: 'accepted',
  identityContinuity: 'accepted',
  provenanceTruth: 'accepted',
  privacySecurity: 'accepted',
  accessibility: 'accepted',
  devicePlayback: 'accepted',
  exportPlayback: 'accepted',
  userControls: 'accepted',
  performance: 'accepted',
  failureRecovery: 'accepted',
  visualEvidenceRefs: ['evidence:visual'],
  audioEvidenceRefs: ['evidence:audio'],
  accessibilityEvidenceRefs: ['evidence:a11y'],
  privacyEvidenceRefs: ['evidence:privacy'],
  deviceEvidenceRefs: ['evidence:device'],
  exportEvidenceRefs: ['evidence:export'],
  reviewRefs: ['review:internal'],
  independentAcceptanceRef: 'review:independent',
  blockerRefs: [],
  providerSpendAuthorized: false,
  publicReleaseAuthorized: false,
};

assert.equal(mod.lifeMediaCanClaimAaaPlusPlusPlus(accepted), true);
assert.equal(mod.acceptanceSummary(accepted).status, 'AAA+++ VERIFIED');

for (const dimension of mod.LIFE_MEDIA_AAA_ACCEPTANCE_DIMENSIONS) {
  const candidate = { ...accepted, [dimension]: 'incomplete' };
  assert.equal(mod.lifeMediaCanClaimAaaPlusPlusPlus(candidate), false, `${dimension} must block AAA+++ acceptance`);
}

assert.equal(mod.lifeMediaCanClaimAaaPlusPlusPlus({ ...accepted, visualEvidenceRefs: [] }), false);
assert.equal(mod.lifeMediaCanClaimAaaPlusPlusPlus({ ...accepted, audioEvidenceRefs: [] }), false);
assert.equal(mod.lifeMediaCanClaimAaaPlusPlusPlus({ ...accepted, deviceEvidenceRefs: [] }), false);
assert.equal(mod.lifeMediaCanClaimAaaPlusPlusPlus({ ...accepted, exportEvidenceRefs: [] }), false);
assert.equal(mod.lifeMediaCanClaimAaaPlusPlusPlus({ ...accepted, independentAcceptanceRef: undefined }), false);
assert.equal(mod.lifeMediaCanClaimAaaPlusPlusPlus({ ...accepted, candidateSha: 'stale' }), false);
assert.equal(mod.lifeMediaCanClaimAaaPlusPlusPlus({ ...accepted, blockerRefs: ['quality:defect'] }), false);

for (const filmType of [
  'life-movie',
  'documentary',
  'memory-film',
  'life-chapter-film',
  'people-film',
  'place-film',
  'pet-companion-film',
  'legacy-film',
  'storytime-film',
  'replay-cinematic',
  'life-map-memory-star-media',
  'short-form-recap',
  'feature-length-assembly',
]) assert.ok(mod.LIFE_MEDIA_FILM_TYPES.includes(filmType), `missing film type ${filmType}`);

for (const token of [
  'metadataAloneIsNotQualityEvidence: true',
  'passingCiAloneIsNotQualityEvidence: true',
  'generatedButUnusedIsNotIntegrated: true',
  'literalVisualInspectionRequired: true',
  'literalAudioInspectionRequired: true',
  'independentAcceptanceRequired: true',
]) assert.ok(source.includes(token), `AAA acceptance authority missing ${token}`);

console.log('Life media AAA+++ acceptance contract passed');
