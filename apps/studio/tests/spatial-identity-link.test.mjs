import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL('../lib/studio-spatial-account-link.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} }).outputText;
const exports = {};
new Function('exports', 'require', compiled)(exports, require);
const { verifyStudioSpatialAccountLink: verify, studioSpatialLinkId: key } = exports;
const now = 1_800_000_000_000, goodToken = 'a'.repeat(60) + '.' + 'b'.repeat(60) + '.' + 'c'.repeat(60);
const identity = { studioUid: 'studio-user-a', tenantId: 'tenant-a', spatialUid: 'spatial-user-a' };
const goodClaims = () => ({ uid: identity.spatialUid, sub: identity.spatialUid,
  aud: 'urai-4dc1d', iss: 'https://securetoken.google.com/urai-4dc1d' });
const goodLink = () => ({ schemaVersion: 'urai-studio-spatial-account-link-v1',
  status: 'active', provisionedBy: 'trusted-server',
  studioUid: identity.studioUid, tenantId: identity.tenantId,
  spatialUid: identity.spatialUid, spatialProjectId: 'urai-4dc1d',
  purpose: 'life-movie.replay', revision: 2, expiresAtMs: now + 60000 });
function args(overrides = {}) {
  return { studioUid: identity.studioUid, tenantId: identity.tenantId,
    spatialIdToken: goodToken, now, verifySpatialToken: async () => goodClaims(),
    readServerLink: async id => {
      assert.match(id, /^[a-f0-9]{64}$/);
      return goodLink();
    }, ...overrides };
}
let passed = 0;
const ok = await verify(args()); assert.equal(ok.spatialUid, identity.spatialUid); passed++;
assert.equal(ok.revision, 2); assert.equal(Object.isFrozen(ok), true); passed++;
const denied = async (name, modify) => {
  await assert.rejects(() => verify(modify(args())),
    /spatial_account_link_unavailable/, name); passed++;
};
await denied('missing spatial token', v => ({ ...v, spatialIdToken: '' }));
await denied('malformed spatial token', v => ({ ...v, spatialIdToken: 'unverified-uid' }));
await denied('wrong studio user', v => ({ ...v, studioUid: 'studio-user-b' }));
await denied('wrong tenant', v => ({ ...v, tenantId: 'tenant-b' }));
await denied('spatial token revoked', v => ({ ...v, verifySpatialToken: async () => {
  throw new Error('revoked-token');
} }));
await denied('forged spatial UID', v => ({ ...v, verifySpatialToken: async () =>
  ({ ...goodClaims(), sub: 'spatial-user-b' }) }));
await denied('wrong Firebase audience', v => ({ ...v, verifySpatialToken: async () =>
  ({ ...goodClaims(), aud: 'urai-studio' }) }));
await denied('wrong Firebase issuer', v => ({ ...v, verifySpatialToken: async () =>
  ({ ...goodClaims(), iss: 'https://securetoken.google.com/other' }) }));
await denied('missing provisioned link', v => ({ ...v, readServerLink: async () => null }));
for (const [name, change] of [
  ['withdrawn', l => l.status = 'revoked'],
  ['wrong link Studio user', l => l.studioUid = 'studio-user-b'],
  ['wrong link Studio tenant', l => l.tenantId = 'tenant-b'],
  ['wrong link Spatial user', l => l.spatialUid = 'spatial-user-b'],
  ['wrong link project', l => l.spatialProjectId = 'urai-studio'],
  ['wrong purpose', l => l.purpose = 'marketing'],
  ['not trusted provisioner', l => l.provisionedBy = 'client'],
  ['stale link expiry', l => l.expiresAtMs = now - 1],
  ['excessive link expiry', l => l.expiresAtMs = now + 31*86400000],
  ['invalid revision', l => l.revision = 0],
  ['invalid schema', l => l.schemaVersion = 'unsupported'],
]) {
  await denied(name, v => ({ ...v, readServerLink: async id => {
    assert.equal(id, key(identity.studioUid, identity.tenantId, identity.spatialUid));
    const link=goodLink(); change(link); return link;
  } }));
}
const route = fs.readFileSync(new URL('../app/api/studio/spatial-identity/route.ts', import.meta.url), 'utf8');
for (const required of [
  "requireStudioLongformAuth(request)", "refreshStudioLongformAuth(request, actor)",
  "verifyIdToken(token, true)", "studioSpatialAccountLinks/", "getApp()",
  "getApps()", "SPATIAL_IDENTITY_PROJECT", "STUDIO_IDENTITY_PROJECT",
  "verifyStudioSpatialAccountLink(args)", "privateMediaAuthorized: false",
  "jobsPlanBound: false", "j9Accepted: false",
]) assert.ok(route.includes(required), 'Missing read-only route boundary ' + required);
for (const forbidden of ['createSignedUrl', 'firebase deploy', 'storage().bucket().file(', 'setDoc(']) {
  assert.equal(route.includes(forbidden), false);
}
const rules = fs.readFileSync(new URL('../../../firestore.rules', import.meta.url),'utf8');
assert.equal(rules.includes('match /studioSpatialAccountLinks/'), false,
  'new server-provisioned link collection must remain client-denied absent a deliberate rules review');
console.log('[PASS] ' + passed + ' real module synthetic dual-project identity/link checks; source-only, no IAM, provider or private-media acceptance');
