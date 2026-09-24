import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  STUDIO_DATA_MODEL_VERSION,
  classifyLegacyRecord,
  convertLegacyRecord,
  createDryRunPlan,
  createRollbackReceipt,
} from '../../../scripts/studio-data-model-v3.mjs';

const fixture = JSON.parse(fs.readFileSync(new URL('./fixtures/studio-data-model-v3.json', import.meta.url), 'utf8'));

assert.equal(STUDIO_DATA_MODEL_VERSION, 3);
assert.deepEqual(classifyLegacyRecord('studioProjects', 'p', { uid: 'u' }), { state: 'convertible', targetCollection: 'studioProjects' });
assert.deepEqual(classifyLegacyRecord('studioScenes', 's', { uid: 'u' }), { state: 'compatibility-only', targetCollection: null });
assert.deepEqual(classifyLegacyRecord('studioJobs', 'j', { schemaVersion: 3, tenantId: 't', userId: 'u' }), { state: 'canonical-v3', targetCollection: 'studioJobs' });

const plan = createDryRunPlan(fixture.records, fixture.tenantByUid, '2026-09-23T00:00:00.000Z');
assert.equal(plan.dryRun, true);
assert.equal(plan.productionMutationAuthorized, false);
assert.equal(plan.writes.length, 5);
assert.equal(plan.blocked.length, 1);
assert.equal(plan.blocked[0].reason, 'explicit_mapping_required');

const ambiguousJob = convertLegacyRecord({
  collection: 'assetJobs',
  id: 'job-ambiguous',
  data: { uid: 'user-a', type: 'audio' },
  tenantId: 'studio-alpha',
  migratedAt: '2026-09-23T00:00:00.000Z',
});
assert.equal(ambiguousJob.ok, false);
assert.equal(ambiguousJob.reason, 'explicit_job_kind_mapping_required');

const ambiguousAsset = convertLegacyRecord({
  collection: 'studioAssets',
  id: 'asset-ambiguous',
  data: { uid: 'user-a', type: 'other', storagePath: 'legacy/a.bin' },
  tenantId: 'studio-alpha',
  migratedAt: '2026-09-23T00:00:00.000Z',
});
assert.equal(ambiguousAsset.ok, false);
assert.equal(ambiguousAsset.reason, 'explicit_asset_kind_mapping_required');

for (const write of plan.writes) {
  assert.equal(write.record.schemaVersion, 3);
  assert.ok(write.record.tenantId === 'studio-alpha' || write.record.tenantId === 'studio-beta');
  assert.ok(write.record.userId === 'user-a' || write.record.userId === 'user-b');
}

const project = plan.writes.find((write) => write.targetCollection === 'studioProjects');
assert.equal(project.record.name, 'Legacy Project A');
assert.equal(project.record.migration.migratedFrom.id, 'project-a');

const asset = plan.writes.find((write) => write.targetCollection === 'studioAssets');
assert.equal(asset.record.safetyBoundaries[0].humanReviewRequired, true);

const exportRecord = plan.writes.find((write) => write.targetCollection === 'studioExports');
assert.equal(exportRecord.record.publicReleaseAuthorized, false);
assert.equal(exportRecord.record.status, 'succeeded');

const direct = convertLegacyRecord({
  collection: 'studioEvents',
  id: 'event-direct',
  data: { uid: 'user-a', type: 'review' },
  tenantId: 'studio-alpha',
  migratedAt: '2026-09-23T00:00:00.000Z',
});
assert.equal(direct.ok, true);
assert.equal(direct.targetCollection, 'studioEvidence');

assert.throws(
  () => convertLegacyRecord({ collection: 'studioProjects', id: 'p', data: { uid: 'user-a' }, tenantId: '../bad', migratedAt: '2026-09-23T00:00:00.000Z' }),
  /invalid_tenant_id/,
);

const rollback = createRollbackReceipt(plan);
assert.equal(rollback.productionMutationAuthorized, false);
assert.equal(rollback.rollbackRequired, true);
assert.equal(rollback.targetRecords.length, plan.writes.length);

console.log('Studio V3 migration dry-run and rollback fixtures passed');
