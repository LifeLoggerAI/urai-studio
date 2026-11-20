import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { test } from 'node:test';

const ts = createRequire(new URL('../package.json', import.meta.url))('typescript');
const authSource = readFileSync(new URL('../lib/studio-auth.ts', import.meta.url), 'utf8');
const jobsSource = readFileSync(new URL('../lib/studio-runtime-store.ts', import.meta.url), 'utf8');
const routeSource = readFileSync(new URL('../app/api/studio/jobs/route.ts', import.meta.url), 'utf8');
const indexes = JSON.parse(readFileSync(new URL('../../../firestore.indexes.json', import.meta.url), 'utf8'));
const compiled = ts.transpileModule(authSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

async function authenticate({ production = true, claims = { uid: 'user-a', tenantId: 'tenant-a' },
  token = 'synthetic', failure = false, headers = {}, withAdmin = true } = {}) {
  const exports = {};
  const adminAuth = withAdmin ? {
    async verifyIdToken(value, checkRevoked) {
      assert.equal(checkRevoked, true, 'must check revoked tokens');
      assert.equal(value, 'synthetic');
      if (failure) throw Error('synthetic revoked');
      return claims;
    },
  } : null;
  const context = {
    module: { exports }, exports,
    require() { return { adminAuth, firebaseAdminStatus: { mode: 'synthetic' } }; },
    process: { env: { NODE_ENV: production ? 'production' : 'development' } },
    Request, console,
  };
  vm.runInNewContext(compiled, context, { timeout: 1000 });
  const requestHeaders = new Headers(headers);
  if (token !== null) requestHeaders.set('authorization', 'Bearer ' + token);
  const request = new Request('https://studio.invalid/api/studio/jobs', { headers: requestHeaders });
  return context.module.exports.requireStudioAuth(request);
}
function denied(result, code) {
  assert.equal(result.ok, false);
  assert.equal(result.error?.code, code);
}

test('valid signed tenant accepted', async () => {
  const r = await authenticate();
  assert.equal(r.ok, true);
  assert.equal(r.tenantId, 'tenant-a');
  assert.equal(r.uid, 'user-a');
});
test('caller header cannot override token tenant', async () => {
  const r = await authenticate({ headers: { 'x-urai-tenant-id': 'foreign' } });
  assert.equal(r.tenantId, 'tenant-a');
});
test('missing signed tenant denied even with forged header', async () => {
  denied(await authenticate({ claims: { uid: 'user-a' }, headers: { 'x-urai-tenant-id': 'foreign' } }),
    'studio_verified_tenant_required');
});
test('conflicting signed tenant claims denied', async () => {
  denied(await authenticate({ claims: { uid: 'user-a', tenantId: 'tenant-a', studioId: 'tenant-b' } }),
    'studio_verified_tenant_required');
});
test('malformed signed tenant denied', async () => {
  denied(await authenticate({ claims: { uid: 'user-a', tenantId: '../foreign' } }),
    'studio_verified_tenant_required');
});
test('revoked bearer denied', async () => {
  denied(await authenticate({ failure: true }), 'invalid_bearer_token');
});
test('missing production token denied', async () => {
  denied(await authenticate({ token: null }), 'missing_bearer_token');
});
test('local no-token development fallback preserved', async () => {
  const r = await authenticate({ production: false, token: null,
    headers: { 'x-urai-user-id': 'dev-user', 'x-urai-tenant-id': 'dev-tenant' } });
  assert.equal(r.ok, true);
  assert.equal(r.authMode, 'local_fallback');
  assert.equal(r.tenantId, 'dev-tenant');
});
test('signed studioId-only claim accepted', async () => {
  const r = await authenticate({ claims: { uid: 'user-a', studioId: 'tenant-a' } });
  assert.equal(r.ok, true);
  assert.equal(r.tenantId, 'tenant-a');
});
test('unavailable Firebase Auth fails closed', async () => {
  denied(await authenticate({ withAdmin: false }), 'firebase_admin_auth_unavailable');
});
test('job listing requires both tenant and user', () => {
  assert.match(jobsSource, /listTenantJobs\(tenantId: UraiId, userId: UraiId\)/);
  assert.match(jobsSource, /\.where\('tenantId', '==', tenantId\)\s*\.where\('userId', '==', userId\)/);
  assert.match(routeSource, /listTenantJobs\(auth\.tenantId, auth\.uid\)/);
  const expected = indexes.indexes.some(index => index.collectionGroup === 'studioJobs' &&
    index.fields.map(field => field.fieldPath).join(',') === 'tenantId,userId,createdAt');
  assert.equal(expected, true, 'owner-scoped Firestore index must exist');
});
