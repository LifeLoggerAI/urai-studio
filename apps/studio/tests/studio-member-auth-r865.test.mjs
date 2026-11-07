import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { test } from 'node:test';

// Executes the exact checked-in membership gate against disposable Admin
// document snapshots. This is NOT a Firebase emulator or private-media test.
const ts = createRequire(new URL('../package.json', import.meta.url))('typescript');
const src = fs.readFileSync(new URL('../lib/studio-member-auth.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(src, { compilerOptions: {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
} }).outputText;
const uid = 'owner-a', tenant = 'tenant-a';
const fence = 'studioDataRightsOwnerFences/' + createHash('sha256')
  .update('urai-studio-data-rights:' + uid).digest('hex');
const tombstone = 'privacyDeletionTombstones/' + uid;
const principal = { ok: true, production: true, uid, tenantId: tenant, authMode: 'firebase_id_token' };
const seed = () => ({
  ['studioUsers/' + uid]: { uid, role: 'owner' },
  ['memberships/' + uid + '_' + tenant]: { uid, studioId: tenant, role: 'owner', active: true },
});
function harness({ records = seed(), auth = principal, dbFail = false, dbPresent = true } = {}) {
  let actor = auth;
  const db = dbPresent ? { doc(path) {
    return { async get() {
      if (dbFail) throw Error('synthetic unavailable');
      return { exists: Object.hasOwn(records, path), data: () => records[path] };
    } };
  } } : null;
  const module = { exports: {} };
  vm.runInNewContext(js, {
    module, exports: module.exports, Set, String, Object, Promise,
    require(name) {
      if (name === 'server-only') return {};
      if (name === 'node:crypto') return { createHash };
      if (name === '@/lib/firebase-admin') return { adminDb: db };
      if (name === '@/lib/studio-auth') return { requireStudioAuth: async () => actor };
      throw Error('unexpected import');
    },
  }, { timeout: 1000 });
  return {
    ...module.exports,
    changeActor(value) { actor = value; },
  };
}
const request = new Request('https://studio.invalid/api/studio/jobs');
async function expectDenied(input, intent, code) {
  const result = await harness(input).requireStudioMemberAuth(request, intent);
  assert.equal(result.ok, false);
  assert.equal(result.error?.code, code);
}
test('active owner can read and create draft', async () => {
  const rt = harness();
  assert.equal((await rt.requireStudioMemberAuth(request, 'read')).ok, true);
  assert.equal((await rt.requireStudioMemberAuth(request, 'draft')).ok, true);
});
test('viewer can read but not write a draft', async () => {
  const docs = seed(); docs['studioUsers/' + uid].role = 'viewer';
  docs['memberships/' + uid + '_' + tenant].role = 'viewer';
  assert.equal((await harness({ records: docs }).requireStudioMemberAuth(request, 'read')).ok, true);
  await expectDenied({ records: docs }, 'draft', 'studio_edit_role_required');
});
test('creator with global editor role can save a draft', async () => {
  const docs = seed(); docs['studioUsers/' + uid].role = 'editor';
  docs['memberships/' + uid + '_' + tenant].role = 'creator';
  assert.equal((await harness({ records: docs }).requireStudioMemberAuth(request, 'draft')).ok, true);
});
test('signed tenant alone without membership is denied', async () => {
  const docs = seed(); delete docs['memberships/' + uid + '_' + tenant];
  await expectDenied({ records: docs }, 'read', 'studio_current_membership_required');
});
test('foreign studio membership denied', async () => {
  const docs = seed(); docs['memberships/' + uid + '_' + tenant].studioId = 'other';
  await expectDenied({ records: docs }, 'draft', 'studio_current_membership_required');
});
for (const flag of ['disabled', 'revoked']) {
  test('member ' + flag + ' is denied', async () => {
    const docs = seed(); docs['memberships/' + uid + '_' + tenant][flag] = true;
    await expectDenied({ records: docs }, 'draft', 'studio_current_membership_required');
  });
}
test('disabled global user is denied', async () => {
  const docs = seed(); docs['studioUsers/' + uid].disabled = true;
  await expectDenied({ records: docs }, 'read', 'studio_current_membership_required');
});
test('active deletion fence is denied', async () => {
  await expectDenied({ records: { ...seed(), [fence]: {
    uid, requestId: 'r1', active: true, permanent: false,
  } } }, 'draft', 'studio_owner_deletion_fence');
});
test('permanent deletion fence is denied', async () => {
  await expectDenied({ records: { ...seed(), [fence]: {
    uid, requestId: 'r1', active: false, permanent: true,
  } } }, 'read', 'studio_owner_deletion_fence');
});
test('cancelled fence with stable authority is accepted', async () => {
  const docs = { ...seed(), [fence]: {
    uid, requestId: 'r1', active: false, permanent: false,
  } };
  assert.equal((await harness({ records: docs }).requireStudioMemberAuth(request, 'draft')).ok, true);
});
test('active canonical deletion tombstone is denied', async () => {
  await expectDenied({ records: { ...seed(), [tombstone]: { uid, active: true } } },
    'draft', 'studio_owner_deletion_fence');
});
test('inactive tombstone with planning lease is denied', async () => {
  await expectDenied({ records: { ...seed(), [tombstone]: {
    uid, active: false, deletionPlanningLeaseToken: 'pending',
  } } }, 'draft', 'studio_owner_deletion_fence');
});
test('backend outage denies rather than reusing cached authority', async () => {
  await expectDenied({ dbFail: true }, 'draft', 'studio_member_authority_unavailable');
});
test('signed identity without Admin database is denied', async () => {
  await expectDenied({ dbPresent: false }, 'read', 'studio_member_authority_unavailable');
});
test('header-only local identity is limited to unconfigured development', async () => {
  const local = { ...principal, production: false, authMode: 'local_fallback' };
  assert.equal((await harness({ auth: local, dbPresent: false })
    .requireStudioMemberAuth(request, 'draft')).ok, true);
  await expectDenied({ auth: local }, 'draft', 'studio_verified_identity_required');
});
test('recheck pins original signed owner after awaited work', async () => {
  const rt = harness(); rt.changeActor({ ...principal, uid: 'other' });
  const result = await rt.refreshStudioMemberAuth(request, principal, 'draft');
  assert.equal(result.ok, false);
});
