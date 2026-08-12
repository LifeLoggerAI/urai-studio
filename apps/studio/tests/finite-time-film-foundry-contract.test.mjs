import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const finiteTime = JSON.parse(await readFile(new URL('../../../productions/finite-time/film-foundry.production.json', import.meta.url), 'utf8'));

test('FINITE TIME remains private, provenance-bound and no-spend by default', () => {
  assert.equal(finiteTime.projectId, 'finite-time');
  assert.equal(finiteTime.truthBoundary.privateSourceRemainsInDrive, true);
  assert.equal(finiteTime.truthBoundary.providerSpendAuthorized, false);
  assert.equal(finiteTime.truthBoundary.publicReleaseAuthorized, false);
  assert.equal(finiteTime.truthBoundary.featureComplete, false);
  assert.equal(finiteTime.truthBoundary.proofChapterApproved, false);
  assert.equal(finiteTime.truthBoundary.fullAnimaticApproved, false);
  assert.equal(finiteTime.truthBoundary.generatedAssetRequiresProvenance, true);
  assert.equal(finiteTime.truthBoundary.finalFeatureProductionBeforeProofChapterAndAnimatic, false);
});

test('FINITE TIME preserves the eight-stage governed production path and proof chapter', () => {
  assert.deepEqual(finiteTime.phases.map((phase) => phase.id), ['P0','P1','P2','P3','P4','P5','P6','P7','P8']);
  assert.equal(finiteTime.proofChapter.id, 'farm-to-lake');
  assert.match(finiteTime.proofChapter.productionAllowed, /DETERMINISTIC_LOCAL_PROOF_ONLY/);
  assert.ok(finiteTime.proofChapter.mustProve.includes('likeness-continuity'));
  assert.ok(finiteTime.proofChapter.mustProve.includes('audio-description'));
  assert.ok(finiteTime.proofChapter.mustProve.includes('haptic-cues'));
  assert.ok(finiteTime.releaseProfiles.includes('full-animatic'));
  assert.ok(finiteTime.releaseProfiles.includes('proof-chapter'));
  assert.ok(finiteTime.releaseProfiles.includes('immersive-derivatives'));
});

test('FINITE TIME receipts and advancement rule stay fail closed', () => {
  for (const field of ['sourceAuthority','rightsState','cost','contentSha256','approvalState','accessibilityState','releaseAuthorization']) {
    assert.ok(finiteTime.receiptFields.includes(field), `missing FINITE TIME receipt field: ${field}`);
  }
  assert.match(finiteTime.advancementRule, /No shot advances/);
  assert.match(finiteTime.advancementRule, /Configured integrations are never treated as healthy until observed/);
});
