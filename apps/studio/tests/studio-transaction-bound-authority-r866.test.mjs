import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { test } from 'node:test';

const ts = createRequire(new URL('../package.json', import.meta.url))('typescript');
const src = fs.readFileSync(new URL('../lib/studio-member-auth.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(src, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

const uid = 'synthetic-owner', tenant = 'synthetic-studio';
const userPath = 'studioUsers/' + uid;
const memberPath = 'memberships/' + uid + '_' + tenant;
const fencePath = 'studioDataRightsOwnerFences/' + createHash('sha256')
  .update('urai-studio-data-rights:' + uid).digest('hex');
const tombstonePath = 'privacyDeletionTombstones/' + uid;
const seed = () => ({
  [userPath]: { uid, role: 'owner' },
  [memberPath]: { uid, studioId: tenant, role: 'owner', active: true },
});
function runtime(changes = {}, offline = false) {
  const records = { ...seed(), ...changes };
  const reads = [];
  const adminDb = { doc: path => ({ path }) };
  const module = { exports: {} };
  vm.runInNewContext(js, {
    module, exports: module.exports, String, Object, Promise, Set,
    require(name) {
      if (name === 'server-only') return {};
      if (name === 'node:crypto') return { createHash };
      if (name === '@/lib/firebase-admin') return { adminDb };
      if (name === '@/lib/studio-auth') return { requireStudioAuth: async () => ({
        ok: true, uid, tenantId: tenant, production: true, authMode: 'firebase_id_token',
      }) };
      throw Error('unexpected import: ' + name);
    },
  }, { timeout: 1000 });
  const transaction = {
    async get(reference) {
      reads.push(reference.path);
      if (offline) throw Error('synthetic-firebase-offline');
      const exists = Object.hasOwn(records, reference.path);
      return { exists, data: () => records[reference.path] };
    },
  };
  return { authorize: () => module.exports.assertStudioDraftAuthorityInTransaction(transaction, uid, tenant), reads };
}

test('owner draft authority reads all four canonical documents inside one transaction', async () => {
  const r = runtime();
  await r.authorize();
  assert.deepEqual(r.reads.slice(0, 2), [userPath, memberPath]);
  assert.ok(r.reads.includes(fencePath));
  assert.ok(r.reads.includes(tombstonePath));
});
test('missing membership fails closed', async () => {
  const r = runtime({ [memberPath]: undefined });
  await assert.rejects(r.authorize(), /studio_current_membership_required/);
});
test('viewer cannot write', async () => {
  const r = runtime({
    [userPath]: { uid, role: 'viewer' },
    [memberPath]: { uid, studioId: tenant, role: 'viewer' },
  });
  await assert.rejects(r.authorize(), /studio_edit_role_required/);
});
test('revoked member fails closed', async () => {
  const r = runtime({ [memberPath]: { uid, studioId: tenant, role: 'owner', revoked: true } });
  await assert.rejects(r.authorize(), /studio_current_membership_required/);
});
test('active owner fence fails closed', async () => {
  const r = runtime({ [fencePath]: { uid, requestId: 'r', active: true, permanent: false } });
  await assert.rejects(r.authorize(), /studio_owner_deletion_fence/);
});
test('privacy tombstone fails closed', async () => {
  const r = runtime({ [tombstonePath]: { uid, active: true } });
  await assert.rejects(r.authorize(), /studio_owner_deletion_fence/);
});
test('active deletion-planning lease fails closed', async () => {
  const r = runtime({ [tombstonePath]: { uid, active: false, deletionPlanningLeaseToken: 'pending' } });
  await assert.rejects(r.authorize(), /studio_owner_deletion_fence/);
});
test('transaction read failure fails closed', async () => {
  const r = runtime({}, true);
  await assert.rejects(r.authorize(), /studio_member_authority_unavailable/);
});
test('all draft persistence transactions reference the commit-bound checker', () => {
  const store = fs.readFileSync(new URL('../lib/studio-runtime-store.ts', import.meta.url), 'utf8');
  const matches = store.match(/await assertStudioDraftAuthorityInTransaction\(transaction, userId, tenantId\)/g) ?? [];
  assert.equal(matches.length, 3, 'job, brief, export transaction checks required');
  assert.match(store, /status: 'draft'/);
  assert.match(store, /privateRenderConsentAuthorized: false/);
});
