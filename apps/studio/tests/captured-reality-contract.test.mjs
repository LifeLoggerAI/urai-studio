import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lib/studio/captured-reality.ts', import.meta.url), 'utf8');

for (const token of [
  "schemaVersion: 'urai-studio-captured-reality-v1'",
  "requiredConsentPurposes: ['memory.storage', 'location.context']",
  'privateByDefault: true',
  'providerSpendAuthorized: false',
  'publicReleaseAuthorized: false',
  'xrReleaseAuthorized: false',
  'camera_solve_receipt_required',
  'training_receipt_required',
  'source_vs_reconstruction_receipt_required',
  'archival_artifact_required',
  'runtime_artifact_required',
  'collision_artifact_required',
  'asset_factory_promotion_receipt_required',
  'spatial_replay_binding_required',
  'review_receipt_required',
  'approval_receipt_required',
]) assert.ok(source.includes(token), `Captured Reality Studio contract missing ${token}`);

assert.ok(source.includes("reconstructionExecution: 'URAI Jobs / authorized private reconstruction worker'"));
assert.ok(source.includes("assetGovernance: 'URAI Asset Factory'"));
assert.ok(source.includes("runtimePresentation: 'URAI Spatial'"));
assert.ok(!source.includes('providerSpendAuthorized: true'));
assert.ok(!source.includes('publicReleaseAuthorized: true'));
assert.ok(!source.includes('xrReleaseAuthorized: true'));

console.log('Captured Reality Studio orchestration contract guard passed');
