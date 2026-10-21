import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { before, after, test } from 'node:test';

// Emulator-only REST, using the official SDK's unsecured mock-token and Rules
// loading protocols. This fixture needs no client SDK or external endpoint.
const projectId = 'demo-urai-studio-deletion-fence-proof';
const host = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:18080';
assert.match(host, /^(?:127\.0\.0\.1|localhost):[0-9]{4,5}$/);
const port = Number(host.split(':')[1]);
assert.ok(port >= 1024 && port <= 65535);
const origin = `http://${host}`;
const database = `${origin}/v1/projects/${projectId}/databases/(default)/documents`;
const rulesPath = process.env.STUDIO_DELETION_FENCE_RULES || new URL('../../firestore.rules', import.meta.url);
let loaded = false, registered = 0, requests = 0;
const hash = uid => createHash('sha256').update(`urai-studio-data-rights:${uid}`).digest('hex');
function token(uid) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = { iss: `https://securetoken.google.com/${projectId}`, aud: projectId,
    sub: uid, user_id: uid, iat: issuedAt, exp: issuedAt + 3600, auth_time: issuedAt,
    firebase: { sign_in_provider: 'custom', identities: {} } };
  return `${Buffer.from(JSON.stringify({ alg: 'none', type: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.`;
}
function fields(value) {
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key,
    entry instanceof Date ? { timestampValue: entry.toISOString() } : typeof entry === 'boolean' ? { booleanValue: entry } : entry === null ? { nullValue: null }
      : typeof entry === 'number' ? { integerValue: String(entry) } : { stringValue: entry }]));
}
async function request(url, method, credential, body) {
  assert.equal(new URL(url).origin, origin);
  requests++;
  const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json',
    ...(credential ? { Authorization: `Bearer ${credential}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), redirect: 'error', signal: AbortSignal.timeout(10_000) });
  const text = await response.text();
  return { status: response.status, value: text ? JSON.parse(text) : null };
}
const url = path => `${database}/${path.split('/').map(encodeURIComponent).join('/')}`;
const put = (path, value, credential) => request(url(path), 'PATCH', credential, { fields: fields(value) });
const get = (path, credential) => request(url(path), 'GET', credential);
const remove = (path, credential) => request(url(path), 'DELETE', credential);
const allow = result => { assert.ok(result.status >= 200 && result.status < 300, JSON.stringify(result)); return result; };
const deny = result => { assert.equal(result.status, 403, JSON.stringify(result)); assert.equal(result.value?.error?.status, 'PERMISSION_DENIED'); };
const seed = async (path, value) => allow(await put(path, value, 'owner'));
const fence = (uid, values) => seed(`studioDataRightsOwnerFences/${hash(uid)}`, { uid, requestId: 'synthetic-original-deletion-request', active: false, permanent: false, ...values });
const check = (name, callback) => { registered++; test(name, callback); };
const collections = ['studioProjects', 'studioScenes', 'studioAssets', 'assetJobs', 'assetCollections', 'studioScrolls',
  'narratorScripts', 'subtitles', 'voiceoverJobs', 'exportJobs', 'studioEvents', 'xrSessions', 'vrSessions'];

before(async () => {
  assert.ok(projectId.startsWith('demo-'));
  const response = await request(`${origin}/emulator/v1/projects/${projectId}:securityRules`, 'PUT', null,
    { rules: { files: [{ content: await readFile(rulesPath, 'utf8') }] } });
  allow(response); assert.equal((response.value?.issues ?? []).some(issue => issue.severity === 'ERROR'), false, JSON.stringify(response)); loaded = true;
});
after(async () => {
  if (loaded) allow(await request(`${origin}/emulator/v1/projects/${projectId}/databases/(default)/documents`, 'DELETE', null));
  console.log(JSON.stringify({ kind: 'actual-Studio-Firestore-Rules-emulator', projectId, loopbackHost: host,
    sourceSha: process.env.URAI_EXACT_HEAD || null, rulesLoaded: loaded, rulesSource: String(rulesPath), registeredCases: registered,
    requests, syntheticMockCredentialsOnly: true, loadedFunctions: false, productionWrites: 0, providerCalls: 0, spendAuthorized: false }));
});

for (const collection of collections) check(`${collection}: unfenced current owner remains compatible`, async () => {
  const uid = `synthetic-free-${collection}`, path = `${collection}/free-owner`, credential = token(uid);
  allow(await put(path, { uid, isPublic: false, value: 'Synthetic original' }, credential));
  allow(await get(path, credential));
  if (collection !== 'studioEvents') {
    allow(await put(path, { uid, isPublic: false, value: 'Synthetic corrected' }, credential));
    allow(await remove(path, credential));
  } else deny(await remove(path, credential));
});

for (const state of ['active', 'permanent']) for (const collection of collections) check(`${collection}: exact ${state} fence blocks create, replacement and delete`, async () => {
  const uid = `synthetic-${state}-${collection}`, credential = token(uid), old = `${collection}/${state}-original`, created = `${collection}/${state}-new`;
  await seed(old, { uid, isPublic: false, value: 'Synthetic original retained' });
  await fence(uid, state === 'active' ? { active: true } : { active: false, permanent: true });
  deny(await put(created, { uid, value: 'Synthetic forbidden new source' }, credential));
  deny(await put(old, { uid, value: 'Synthetic forbidden replacement' }, credential));
  deny(await remove(old, credential));
  assert.equal((await get(old, 'owner')).value.fields.value.stringValue, 'Synthetic original retained');
});

for (const state of ['active', 'permanent']) check(`profile: exact ${state} fence blocks recreation and replacement`, async () => {
  const uid = `synthetic-${state}-profile`, credential = token(uid), path = `users/${uid}`;
  await fence(uid, state === 'active' ? { active: true } : { permanent: true });
  deny(await put(path, { uid, value: 'Synthetic forbidden recreated profile' }, credential));
  await seed(path, { uid, value: 'Synthetic original retained profile' });
  deny(await put(path, { uid, value: 'Synthetic forbidden replacement' }, credential));
  assert.equal((await get(path, 'owner')).value.fields.value.stringValue, 'Synthetic original retained profile');
});

check('cancelled nonpermanent fence preserves current-owner scene and profile writes', async () => {
  const uid = 'synthetic-cancelled-owner', credential = token(uid); await fence(uid, { active: false, permanent: false });
  for (const path of [`studioScenes/${uid}`, `users/${uid}`]) {
    allow(await put(path, { uid, value: 'Synthetic resumed owner edit' }, credential));
    allow(await get(path, credential));
  }
});

for (const [reason, values] of Object.entries({ 'foreign-uid': { uid: 'synthetic-other-owner' }, 'null-active': { active: null },
  'string-active': { active: 'false' }, 'null-permanent': { permanent: null }, 'missing-request-id': { requestId: '' } })) {
  check(`existing malformed ${reason} fence cannot grant writes`, async () => {
    const uid = `synthetic-malformed-${reason}`; await fence(uid, values);
    deny(await put(`studioScenes/${uid}`, { uid, value: 'Synthetic denied malformed authority' }, token(uid)));
  });
}
check('unhashed compatibility row cannot override the exact permanent authority', async () => {
  const uid = 'synthetic-hash-key-authority'; await fence(uid, { permanent: true });
  await seed(`studioDataRightsOwnerFences/${uid}`, { uid, requestId: 'synthetic-stale-compatibility', active: false, permanent: false });
  deny(await put(`studioScenes/${uid}`, { uid }, token(uid)));
});

for (const [reason, values] of Object.entries({ active: { active: true }, 'foreign-uid': { uid: 'synthetic-other-owner', active: false },
  'null-active': { active: null }, 'string-active': { active: 'false' }, 'missing-active': {} })) {
  check(`canonical ${reason} privacy tombstone beats a stale inactive Studio fence`, async () => {
    const uid = `synthetic-canonical-${reason}`; await fence(uid, { active: false, permanent: false });
    await seed(`privacyDeletionTombstones/${uid}`, { uid, ...values });
    deny(await put(`studioScenes/${uid}`, { uid }, token(uid)));
  });
}
check('canonical explicitly inactive owner marker preserves compatible writes', async () => {
  const uid = 'synthetic-canonical-cleared'; await seed(`privacyDeletionTombstones/${uid}`, { uid, active: false });
  allow(await put(`studioScenes/${uid}`, { uid }, token(uid)));
});

for (const collection of collections.filter(name => name !== 'studioEvents')) check(`${collection}: existing owner cannot reassign uid to another subject`, async () => {
  const uid = `synthetic-owner-stability-${collection}`, path = `${collection}/owner-stability`;
  await seed(path, { uid, value: 'Synthetic original owner' });
  deny(await put(path, { uid: 'synthetic-foreign-owner', value: 'Synthetic forbidden subject transfer' }, token(uid)));
  assert.equal((await get(path, 'owner')).value.fields.uid.stringValue, uid);
});
for (const collection of ['studioProjects', 'studioAssets']) check(`${collection}: compatibility userId cannot name a foreign owner`, async () => {
  const uid = `synthetic-compatibility-${collection}`;
  deny(await put(`${collection}/${uid}`, { uid, userId: 'synthetic-foreign-owner' }, token(uid)));
});
check('profile payload cannot inject a foreign uid or compatibility owner', async () => {
  const uid = 'synthetic-stable-profile', credential = token(uid);
  deny(await put(`users/${uid}`, { uid: 'synthetic-foreign-owner' }, credential));
  deny(await put(`users/${uid}`, { userId: 'synthetic-foreign-owner' }, credential));
  allow(await put(`users/${uid}`, { name: 'Synthetic compatible path-owned profile' }, credential));
});

check('credential issued before admission cannot commit later new owned source', async () => {
  const uid = 'synthetic-reused-current-credential', credential = token(uid);
  allow(await put(`studioScenes/${uid}-before`, { uid }, credential));
  await fence(uid, { active: true, permanent: true });
  deny(await put(`studioScenes/${uid}-after`, { uid }, credential));
});
check('fenced multi-write commit remains atomically absent', async () => {
  const uid = 'synthetic-fenced-atomic-batch'; await fence(uid, { active: true });
  const paths = [0, 1, 2].map(index => `studioScenes/${uid}-${index}`);
  deny(await request(`${database}:commit`, 'POST', token(uid), { writes: paths.map(path => ({ update: {
    name: `projects/${projectId}/databases/(default)/documents/${path}`, fields: fields({ uid }) } })) }));
  for (const path of paths) assert.equal((await get(path, 'owner')).status, 404);
});
check('canonical exact released planning marker preserves compatible owner writes', async () => {
  const uid = 'synthetic-released-planning'; await seed(`privacyDeletionTombstones/${uid}`, { uid, updatedAt: new Date() });
  allow(await put(`studioScenes/${uid}`, { uid }, token(uid)));
});
for (const [reason, values] of Object.entries({ 'string-time': { updatedAt: 'synthetic-unverified-time' },
  'unknown-field': { updatedAt: new Date(), requestId: 'synthetic-ambiguous-state' },
  'live-planning': { updatedAt: new Date(), deletionPlanningLeaseToken: 'synthetic-current-lease' },
  'live-planning-explicit-inactive': { updatedAt: new Date(), active: false, deletionPlanningLeaseOperation: 'plan' } })) {
  check(`canonical ${reason} planning marker cannot grant writes`, async () => {
    const uid = `synthetic-planning-${reason}`; await seed(`privacyDeletionTombstones/${uid}`, { uid, ...values });
    deny(await put(`studioScenes/${uid}`, { uid }, token(uid)));
  });
}

check('client cannot read or rewrite its server-owned fence and canonical marker', async () => {
  const uid = 'synthetic-control-plane-denied', credential = token(uid); await fence(uid, { active: true });
  await seed(`privacyDeletionTombstones/${uid}`, { uid, active: true });
  for (const path of [`studioDataRightsOwnerFences/${hash(uid)}`, `privacyDeletionTombstones/${uid}`]) {
    deny(await get(path, credential)); deny(await put(path, { uid, active: false, permanent: false }, credential));
  }
});
