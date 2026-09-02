import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  buildMigrationPlan,
  sha256,
  validateAuthorityManifest,
  validateReceipt,
} from './studio-membership-migration-lib.mjs';

const inventory = {
  projectId: 'urai-studio-prod',
  studios: [
    {id: 'studio_a', data: {name: 'A'}},
    {id: 'studio_b', data: {name: 'B'}},
    {id: 'forged_studio', data: {name: 'Untrusted'}},
  ],
  legacyMemberships: [
    {id: 'legacy_owner_a', data: {uid: 'owner_a', studioId: 'studio_a', role: 'owner'}},
    {id: 'legacy_editor_a', data: {uid: 'editor_a', studioId: 'studio_a', role: 'owner'}},
    {id: 'legacy_owner_b', data: {uid: 'owner_b', studioId: 'studio_b', role: 'owner'}},
    {id: 'forged_membership', data: {uid: 'attacker', studioId: 'studio_a', role: 'owner'}},
  ],
};

const manifest = {
  schemaVersion: 1,
  projectId: 'urai-studio-prod',
  approvedBy: 'real-release-owner',
  approvedAt: '2026-09-01T00:00:00.000Z',
  approvalEvidenceRef: 'private-approval-record-001',
  entries: [
    {uid: 'owner_a', studioId: 'studio_a', role: 'owner', status: 'active', authorityEvidenceRef: 'authority-owner-a', legacyDocumentIds: ['legacy_owner_a']},
    {uid: 'editor_a', studioId: 'studio_a', role: 'editor', status: 'active', authorityEvidenceRef: 'authority-editor-a', legacyDocumentIds: ['legacy_editor_a']},
    {uid: 'owner_b', studioId: 'studio_b', role: 'owner', status: 'active', authorityEvidenceRef: 'authority-owner-b', legacyDocumentIds: ['legacy_owner_b']},
  ],
  rejectedLegacyMemberships: [
    {documentId: 'forged_membership', reason: 'No trusted ownership evidence exists.', authorityEvidenceRef: 'rejection-record-001'},
  ],
  rejectedStudios: [
    {studioId: 'forged_studio', reason: 'No trusted Studio authority exists.', authorityEvidenceRef: 'rejection-record-002'},
  ],
};

test('verified manifest closes every legacy membership and Studio without trusting legacy roles', () => {
  const result = validateAuthorityManifest(manifest, inventory, 'urai-studio-prod');
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(manifest.entries[1].role, 'editor');
  assert.equal(inventory.legacyMemberships[1].data.role, 'owner');
});

test('canonical nested paths cannot collide when uid and Studio ids contain underscores', () => {
  const customInventory = {
    projectId: 'urai-studio-prod',
    studios: [{id: 'c', data: {}}, {id: 'b_c', data: {}}],
    legacyMemberships: [],
  };
  const customManifest = {
    ...manifest,
    entries: [
      {uid: 'a_b', studioId: 'c', role: 'owner', status: 'active', authorityEvidenceRef: 'authority-record-one', legacyDocumentIds: []},
      {uid: 'a', studioId: 'b_c', role: 'owner', status: 'active', authorityEvidenceRef: 'authority-record-two', legacyDocumentIds: []},
    ],
    rejectedLegacyMemberships: [],
    rejectedStudios: [],
  };
  const validation = validateAuthorityManifest(customManifest, customInventory, 'urai-studio-prod');
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  const receipt = buildMigrationPlan({manifest: customManifest, inventory: customInventory, canonicalBefore: [], generatedAt: '2026-09-01T01:00:00.000Z'});
  assert.deepEqual(receipt.operations.map((item) => item.path), ['studios/b_c/members/a', 'studios/c/members/a_b']);
});

test('manifest rejects unaccounted legacy records, identity mismatch, and missing sole owner', () => {
  const unaccounted = structuredClone(manifest);
  unaccounted.rejectedLegacyMemberships = [];
  assert.match(validateAuthorityManifest(unaccounted, inventory, 'urai-studio-prod').errors.join('\n'), /not explicitly accepted or rejected/);

  const mismatch = structuredClone(manifest);
  mismatch.entries[0].uid = 'different_uid';
  assert.match(validateAuthorityManifest(mismatch, inventory, 'urai-studio-prod').errors.join('\n'), /identity\/Studio fields do not match/);

  const noOwner = structuredClone(manifest);
  noOwner.entries[0].role = 'admin';
  assert.match(validateAuthorityManifest(noOwner, inventory, 'urai-studio-prod').errors.join('\n'), /exactly one active owner/);
});

test('receipt hashes bind before and after states and reject tampering', () => {
  const receipt = buildMigrationPlan({manifest, inventory, canonicalBefore: [], generatedAt: '2026-09-01T01:00:00.000Z'});
  assert.equal(validateReceipt(receipt).ok, true, validateReceipt(receipt).errors.join('\n'));
  assert.equal(receipt.operations[0].beforeHash, sha256(null));
  const tampered = structuredClone(receipt);
  tampered.operations[0].after.role = 'owner';
  assert.equal(validateReceipt(tampered).ok, false);
});

test('CLI remains dry-run by default and requires exact project confirmations', () => {
  const source = fs.readFileSync(new URL('./studio-membership-migration.mjs', import.meta.url), 'utf8');
  for (const token of ["const handlers = {plan, apply, verify, rollback}", "requireProject(options, 'confirm-project')", 'refusing to overwrite an existing receipt', 'rollback blocked by post-migration change', 'loadInventoryInTransaction', 'inventory changed after planning', 'fs.fchmodSync(handle, 0o600)']) {
    assert.ok(source.includes(token), `migration CLI missing safety token: ${token}`);
  }
  assert.doesNotMatch(source, /serviceAccount|private_key|client_email/i);
});
