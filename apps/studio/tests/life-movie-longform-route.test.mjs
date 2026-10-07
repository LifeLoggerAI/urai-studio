import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as nodeModule from 'node:module';
import { createHash } from 'node:crypto';

// Compile the actual checked-in handlers. Next/Firebase/network boundaries are
// mocked; authorization, validation, bounded body reading and dispatch are real.
const require = nodeModule.createRequire(import.meta.url);
function compile(source) {
  if (typeof nodeModule.stripTypeScriptTypes === 'function') return nodeModule.stripTypeScriptTypes(source);
  const ts = require('typescript');
  return ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
}
const data = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const source = (relative) => fs.readFileSync(new URL(relative, import.meta.url), 'utf8');
const key = Symbol.for('urai.studio.longform.route-test');
const previousState = globalThis[key];
const previousFetch = globalThis.fetch;
const envKeys = ['NODE_ENV', 'URAI_STUDIO_LONGFORM_DISPATCH_ENABLED', 'URAI_JOBS_LONGFORM_BRIDGE_URL', 'URAI_STUDIO_JOBS_BRIDGE_TOKEN', 'URAI_JOBS_BRIDGE_URL', 'URAI_STUDIO_JOBS_DISPATCH_ENABLED'];
const previousEnv = Object.fromEntries(envKeys.map((name) => [name, process.env[name]]));
const state = {
  decoded: { uid: 'user-test', tenantId: 'studio-test' },
  user: { uid: 'user-test', role: 'owner', disabled: false },
  authFailure: false, revoked: false, lookupFailure: false, exists: true, fenceExists: false, fence: null,
  checks: [], paths: [], calls: [], response: { ok: true, planId: `lmp_${'a'.repeat(20)}` }, status: 200,
};
globalThis[key] = state;
const admin = data(`
const state = globalThis[Symbol.for('urai.studio.longform.route-test')];
export const firebaseAdminStatus = { mode: 'synthetic-test-only' };
export const adminAuth = { async verifyIdToken(token, revokedCheck) {
  state.checks.push({ token, revokedCheck });
  if(state.authFailure || (state.revoked && revokedCheck)) throw new Error('test-token-denied');
  return { ...state.decoded };
} };
export const adminDb = { doc(path) { state.paths.push(path); return { async get() {
  if(state.lookupFailure) throw new Error('test-lookup-failed');
  if(path.startsWith('studioDataRightsOwnerFences/'))return {exists:state.fenceExists,data:()=>state.fence};
  return { exists: state.exists, data: () => state.user };
} }; } };
`);
const serverOnly = data('export {};');
const auth = data(compile(source('../lib/studio-auth.ts')).replaceAll('@/lib/firebase-admin', admin));
const longAuth = data(compile(source('../lib/studio-life-movie-longform-auth.ts')).replaceAll('server-only', serverOnly).replaceAll('@/lib/firebase-admin', admin).replaceAll('@/lib/studio-auth', auth));
const contractUrl = data(compile(source('../lib/studio-life-movie-longform-contract.ts')));
const client = data(compile(source('../lib/studio-life-movie-longform-client.ts')).replaceAll('server-only', serverOnly).replaceAll('./studio-life-movie-longform-contract', contractUrl));
const next = data('export const NextResponse = { json(body, init) { return new Response(JSON.stringify(body), { ...init, headers: { ...init.headers, "content-type": "application/json" } }); } };');
const routeUrl = data(compile(source('../app/api/studio/video-factory/longform/route.ts'))
  .replaceAll('next/server', next)
  .replaceAll('@/lib/studio-life-movie-longform-auth', longAuth)
  .replaceAll('@/lib/studio-life-movie-longform-client', client)
  .replaceAll('@/lib/studio-life-movie-longform-contract', contractUrl));

function reset() {
  state.decoded = { uid: 'user-test', tenantId: 'studio-test' };
  state.user = { uid: 'user-test', role: 'owner', disabled: false };
  state.authFailure = false; state.revoked = false; state.lookupFailure = false; state.exists = true;
  state.fenceExists = false; state.fence = {uid:'user-test',active:false,permanent:false};
  state.checks = []; state.paths = []; state.calls = [];
  state.status = 200; state.response = { ok: true, planId: `lmp_${'a'.repeat(20)}` };
  process.env.NODE_ENV = 'production';
  process.env.URAI_STUDIO_LONGFORM_DISPATCH_ENABLED = 'true';
  process.env.URAI_JOBS_LONGFORM_BRIDGE_URL = 'https://jobs.example.test/studioLifeMovieLongformBridge';
  process.env.URAI_STUDIO_JOBS_BRIDGE_TOKEN = 'synthetic-server-secret';
  process.env.URAI_JOBS_BRIDGE_URL = 'https://jobs.example.test/studioLifeMovieBridge';
  process.env.URAI_STUDIO_JOBS_DISPATCH_ENABLED = 'true';
  globalThis.fetch = async (url, options) => {
    state.calls.push({ url: String(url), options, input: JSON.parse(options.body) });
    return new Response(JSON.stringify(state.response), { status: state.status, headers: { 'content-type': 'application/json' } });
  };
}
function createBody(clips = 3) {
  return {
    action: 'create', projectId: 'project-test',
    sceneTruthReceiptRef: `str_${'a'.repeat(16)}_${'b'.repeat(8)}_${'c'.repeat(40)}`,
    sceneTruthDigest: 'd'.repeat(64),
    sources: [{ id: 'clip-test', bucket: 'urai-synthetic-test', objectPath: 'tenants/studio-test/clips/synthetic.mp4', mimeType: 'video/mp4', provenance: 'generated', sourceRefs: ['synthetic-fixture-only'], consentRef: 'synthetic-consent', ownerOrRightsRef: 'synthetic-rights' }],
    timeline: Array.from({ length: clips }, (_, i) => ({ sourceId: 'clip-test', startMs: i * 15_000, endMs: (i + 1) * 15_000 })),
    consent: { purpose: 'life-movie.render', policyVersion: 'synthetic-v1', decisionReceiptId: 'synthetic-decision' },
  };
}
function unalignedAudioBody(cueCount, distinctSources = false) {
  const body = createBody(1);
  body.timeline = [{ sourceId: 'clip-test', startMs: 5000, endMs: 15000 }, { sourceId: 'clip-test', startMs: 15000, endMs: 20000 }];
  const sourceCount = distinctSources ? cueCount : 1;
  for (let index = 0; index < sourceCount; index += 1) {
    body.sources.push({ ...body.sources[0], id: `audio-${index}`, objectPath: `tenants/studio-test/audio/synthetic-${index}.wav`, mimeType: 'audio/wav' });
  }
  body.audioCues = Array.from({ length: cueCount }, (_, index) => ({
    sourceId: `audio-${distinctSources ? index : 0}`, role: 'ambience',
    startMs: index < Math.ceil(cueCount / 2) ? 5000 : 15000,
    endMs: index < Math.ceil(cueCount / 2) ? 15000 : 20000,
  }));
  return body;
}
function request(body, { token = true, headers = {}, raw } = {}) {
  return new Request('https://studio.example.test/api/studio/video-factory/longform', {
    method: 'POST', headers: { ...(token ? { authorization: 'Bearer synthetic-user-token' } : {}), 'content-type': 'application/json', ...headers },
    body: raw ?? JSON.stringify(body),
  });
}
let assertions = 0;
async function expectStatus(route, body, status, options) {
  const result = await route.POST(request(body, options));
  assert.equal(result.status, status);
  assert.equal(result.headers.get('cache-control'), 'no-store, max-age=0');
  assertions += 1;
  return result.json();
}

try {
  const route = await import(routeUrl);
  const contract = await import(contractUrl);
  reset();
  await expectStatus(route, createBody(), 401, { token: false });
  assert.equal(state.calls.length, 0);
  reset(); state.authFailure = true;
  await expectStatus(route, createBody(), 401); assert.equal(state.calls.length, 0);
  reset(); state.revoked = true;
  await expectStatus(route, createBody(), 401); assert.ok(state.checks.some((check) => check.revokedCheck === true));
  reset(); process.env.NODE_ENV = 'development';
  await expectStatus(route, createBody(), 401, { token: false, headers: { 'x-urai-user-id': 'user-test', 'x-urai-tenant-id': 'studio-test' } });
  reset(); state.decoded = { uid: 'user-test' };
  await expectStatus(route, createBody(), 403, { headers: { 'x-urai-tenant-id': 'studio-test' } });
  reset(); state.user.role = 'viewer';
  await expectStatus(route, createBody(), 403); assert.equal(state.calls.length, 0);
  reset(); state.user.disabled = true;
  await expectStatus(route, createBody(), 403);
  reset(); state.user.uid = 'other-user';
  await expectStatus(route, createBody(), 403);
  reset(); state.exists = false;
  await expectStatus(route, createBody(), 403);
  reset(); state.lookupFailure = true;
  await expectStatus(route, createBody(), 503);
  for(const change of [()=>{state.fence.active=true;},()=>{state.fence.permanent=true;},()=>{state.fence.uid='foreign-owner';}]) {
    reset();state.fenceExists=true;change();await expectStatus(route,createBody(),403);assert.equal(state.calls.length,0);
  }
  reset();state.fenceExists=true;await expectStatus(route,createBody(),202);assert.equal(state.calls.length,1);
  reset(); delete process.env.URAI_STUDIO_LONGFORM_DISPATCH_ENABLED;
  const disabled = await expectStatus(route, createBody(), 503);
  assert.equal(disabled.error.code, 'longform_dispatch_disabled'); assert.equal(state.calls.length, 0);
  reset(); delete process.env.URAI_JOBS_LONGFORM_BRIDGE_URL;
  await expectStatus(route, createBody(), 503); assert.equal(state.calls.length, 0);
  reset(); delete process.env.URAI_STUDIO_JOBS_BRIDGE_TOKEN;
  await expectStatus(route, createBody(), 503); assert.equal(state.calls.length, 0);
  reset(); process.env.URAI_JOBS_LONGFORM_BRIDGE_URL = 'http://127.0.0.1:9000/longform';
  await expectStatus(route, createBody(), 503);
  reset(); process.env.URAI_JOBS_LONGFORM_BRIDGE_URL = 'https://jobs.example.test/longform?token=invalid';
  await expectStatus(route, createBody(), 503);

  reset();
  const status = await route.GET(new Request('https://studio.example.test/longform', { headers: { authorization: 'Bearer synthetic-user-token' } }));
  assert.equal(status.status, 200);
  assert.equal(JSON.stringify(await status.json()).includes('synthetic-server-secret'), false);
  assert.equal(state.calls.length, 0); assertions += 1;

  reset();
  const success = await expectStatus(route, createBody(), 202, { headers: { 'x-urai-user-id': 'other-user', 'x-urai-tenant-id': 'other-tenant' } });
  assert.equal(success.providerGenerationAuthorized, false); assert.equal(success.publicReleaseAuthorized, false);
  assert.equal(state.calls.length, 1);
  const call = state.calls[0];
  assert.equal(call.url, 'https://jobs.example.test/studioLifeMovieLongformBridge');
  assert.equal(call.input.userId, 'user-test'); assert.equal(call.input.tenantId, 'studio-test');
  assert.equal(call.options.headers.authorization, 'Bearer synthetic-server-secret');
  assert.equal(call.options.cache, 'no-store');
  assert.equal(call.input.payload.schemaVersion, 'urai-life-movie-longform-v1');
  assert.equal(call.input.payload.timeline.at(-1).endMs, 45_000);
  assert.equal(call.input.payload.outputPrefix, 'tenants/studio-test/life-movies/project-test/');
  assert.match(call.input.payload.renderPlanDigest, /^[a-f0-9]{64}$/);
  assert.deepEqual([...new Set(state.paths)].sort(), ['studioUsers/user-test',
    `studioDataRightsOwnerFences/${createHash('sha256').update('urai-studio-data-rights:user-test').digest('hex')}`].sort());
  const repeated = contract.buildStudioLongformRequest(createBody(), { tenantId: 'studio-test', userId: 'user-test' });
  assert.equal(repeated.idempotencyKey, call.input.idempotencyKey);
  assert.equal(contract.buildStudioLongformRequest(createBody(180), { tenantId: 'studio-test', userId: 'user-test' }).payload.timeline.at(-1).endMs, 2_700_000);
  assert.throws(() => contract.buildStudioLongformRequest(createBody(181), { tenantId: 'studio-test', userId: 'user-test' }));

  // Jobs starts this child at 5s, so both halves belong to one 5s–20s
  // segment. Fixed 0s/15s preflight windows would wrongly admit both plans.
  for (const body of [unalignedAudioBody(12, true), unalignedAudioBody(14)]) {
    reset();
    const rejected = await expectStatus(route, body, 400);
    assert.equal(rejected.error.code, 'longform_child_budget_exceeded');
    assert.equal(state.calls.length, 0);
  }
  for (const body of [unalignedAudioBody(11, true), unalignedAudioBody(12)]) {
    reset(); await expectStatus(route, body, 202); assert.equal(state.calls.length, 1);
  }
  reset();
  const dense = createBody(1);
  dense.timeline = Array.from({ length: 13 }, (_, index) => ({ sourceId: 'clip-test', startMs: index * 100, endMs: (index + 1) * 100 }));
  // Jobs splits at the 12-item child ceiling; the parent is admissible.
  await expectStatus(route, dense, 202); assert.equal(state.calls.length, 1);
  reset();
  const excessiveSegments = structuredClone(dense);
  excessiveSegments.timeline.push(...Array.from({ length: 179 }, (_, index) => ({ sourceId: 'clip-test', startMs: 1300 + index * 15_000, endMs: 1300 + (index + 1) * 15_000 })));
  assert.ok(excessiveSegments.timeline.at(-1).endMs < 45 * 60 * 1000);
  const countRejected = await expectStatus(route, excessiveSegments, 400);
  assert.equal(countRejected.error.code, 'longform_segment_count_exceeded'); assert.equal(state.calls.length, 0);

  for (const change of [
    (body) => { body.userId = 'other-user'; },
    (body) => { body.tenantId = 'other-tenant'; },
    (body) => { body.outputPrefix = 'tenants/other-tenant/'; },
    (body) => { body.publicReleaseAuthorized = true; },
    (body) => { body.sources[0].objectPath = 'tenants/other-tenant/clips/test.mp4'; },
    (body) => { body.sources[0].objectPath += '/../escape'; },
    (body) => { body.sources[0].url = 'https://public.example.test/media.mp4'; },
    (body) => { body.sources[0].mimeType = 'application/octet-stream'; },
    (body) => { body.sources[0].provenance = 'archival-from-generated'; },
    (body) => { body.sources[0].consentRef = 'x'.repeat(129); },
    (body) => { body.sceneTruthReceiptRef = 'missing-signature'; },
    (body) => { body.sceneTruthDigest = 'X'.repeat(64); },
    (body) => { delete body.consent; },
    (body) => { body.consent.purpose = 'memory.storage'; },
    (body) => { body.width = 3840; },
    (body) => { body.height = 1081; },
    (body) => { body.fps = 60; },
    (body) => { body.timeline[0].endMs = 15_001; },
    (body) => { body.timeline[1].startMs = 1; },
    (body) => { body.timeline[0].sourceId = 'unknown-source'; },
  ]) {
    reset(); const body = createBody(); change(body);
    await expectStatus(route, body, 400); assert.equal(state.calls.length, 0);
  }
  reset(); await expectStatus(route, createBody(), 400, { raw: '[' }); assert.equal(state.calls.length, 0);
  reset(); await expectStatus(route, createBody(), 413, { raw: 'x'.repeat(512 * 1024 + 1) }); assert.equal(state.calls.length, 0);
  reset(); await expectStatus(route, createBody(), 413, { headers: { 'content-length': String(512 * 1024 + 1) } });
  reset();
  const nearLimit = createBody(1);
  nearLimit.subtitleText = '';
  const callerBytes = Buffer.byteLength(JSON.stringify(nearLimit), 'utf8');
  nearLimit.subtitleText = 'x'.repeat(512 * 1024 - 1 - callerBytes);
  assert.equal(Buffer.byteLength(JSON.stringify(nearLimit), 'utf8'), 512 * 1024 - 1);
  const encodedRejection = await expectStatus(route, nearLimit, 413);
  assert.equal(encodedRejection.error.code, 'longform_request_too_large'); assert.equal(state.calls.length, 0);

  for (const action of ['status', 'cancel', 'playback', 'download', 'resume', 'assemble', 'delete-output']) {
    reset(); const planId = `lmp_${'b'.repeat(20)}`;
    await expectStatus(route, { action, planId }, action === 'assemble' ? 202 : 200);
    assert.deepEqual(state.calls[0].input, { action, tenantId: 'studio-test', userId: 'user-test', planId });
  }
  reset(); await expectStatus(route, { action: 'delete-output', planId: `lmp_${'b'.repeat(20)}`, userId: 'other-user' }, 400); assert.equal(state.calls.length, 0);
  reset(); await expectStatus(route, { action: 'cancel', planId: 'short-job-id' }, 400);
  reset(); await expectStatus(route, { action: 'activate', planId: `lmp_${'b'.repeat(20)}` }, 400);
  reset(); state.status = 403; state.response = { ok: false, error: 'longform_plan_boundary_mismatch' };
  const denial = await expectStatus(route, { action: 'delete-output', planId: `lmp_${'b'.repeat(20)}` }, 403);
  assert.equal(denial.error.code, 'longform_plan_boundary_mismatch');
  reset(); state.status = 409; state.response = { ok: false, error: 'life_movie_longform_consent_revoked' };
  await expectStatus(route, { action: 'playback', planId: `lmp_${'b'.repeat(20)}` }, 409);
  reset(); state.response = [];
  await expectStatus(route, createBody(), 502);
  reset(); globalThis.fetch = async () => { throw Object.assign(new Error('synthetic abort'), { name: 'AbortError' }); };
  await expectStatus(route, createBody(), 504);

  const parity = JSON.parse(source('./fixtures/life-movie-longform-jobs-contract.v1.json'));
  assert.equal(contract.STUDIO_LONGFORM_JOBS_CONTRACT.jobsSourceSha, parity.jobsSourceSha);
  assert.deepEqual([...contract.STUDIO_LONGFORM_JOBS_CONTRACT.actions], parity.actions);
  for (const [name, value] of Object.entries(parity.budget)) assert.equal(contract.STUDIO_LONGFORM_JOBS_CONTRACT[name], value);
  assert.deepEqual(Object.keys(call.input.payload).sort(), parity.payloadKeys.sort());
  assert.deepEqual(Object.keys(call.input.consent).sort(), parity.consentKeys.sort());
  assert.equal(call.input.payload.spatialRequired, false);
  assert.equal(call.input.payload.providerGenerationAuthorized, false);
  assert.equal(call.input.payload.publicReleaseAuthorized, false);
  assertions += 1;
  console.log(`Studio actual long-form route: ${assertions} cases passed; synthetic auth/network only, no runtime activation.`);
} finally {
  globalThis.fetch = previousFetch;
  if (previousState === undefined) delete globalThis[key]; else globalThis[key] = previousState;
  for (const [name, value] of Object.entries(previousEnv)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
}
