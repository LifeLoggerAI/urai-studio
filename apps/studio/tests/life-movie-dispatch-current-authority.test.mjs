import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as nodeModule from 'node:module';

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
const key = Symbol.for('urai.studio.dispatch-current-authority-test');
const previousState = globalThis[key];
const previousFetch = globalThis.fetch;
const envKeys = ['NODE_ENV', 'URAI_STUDIO_LONGFORM_DISPATCH_ENABLED', 'URAI_JOBS_LONGFORM_BRIDGE_URL', 'URAI_STUDIO_JOBS_BRIDGE_TOKEN', 'URAI_JOBS_BRIDGE_URL', 'URAI_STUDIO_JOBS_DISPATCH_ENABLED'];
const previousEnv = Object.fromEntries(envKeys.map((name) => [name, process.env[name]]));
const state = {
  decoded: { uid: 'user-test', tenantId: 'studio-test' },
  user: { uid: 'user-test', role: 'owner', disabled: false },
  authFailure: false, revoked: false, lookupFailure: false, exists: true, memberExists:true, member:{uid:'user-test',studioId:'studio-test',role:'owner'}, fenceExists: false, fence: null,
  checks: [], paths: [], calls: [], response: { ok: true, planId: `lmp_${'a'.repeat(20)}` }, status: 200,
};
globalThis[key] = state;
const admin = data(`
const state = globalThis[Symbol.for('urai.studio.dispatch-current-authority-test')];
export const firebaseAdminStatus = { mode: 'synthetic-test-only' };
export const adminAuth = { async verifyIdToken(token, revokedCheck) {
  state.checks.push({ token, revokedCheck });
  if(state.authFailure || (state.revoked && revokedCheck)) throw new Error('test-token-denied');
  return { ...state.decoded };
} };
export const adminDb = { doc(path) { state.paths.push(path); return { async get() {
  if(state.lookupFailure) throw new Error('test-lookup-failed');
  if(path.startsWith('memberships/'))return {exists:state.memberExists,data:()=>state.member};
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
  state.memberExists=true;state.member={uid:'user-test',studioId:'studio-test',role:'owner'};
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
function request(body, { token = true, headers = {}, raw } = {}) {
  return new Request('https://studio.example.test/api/studio/video-factory/longform', {
    method: 'POST', headers: { ...(token ? { authorization: 'Bearer synthetic-user-token' } : {}), 'content-type': 'application/json', ...headers },
    body: raw ?? JSON.stringify(body),
  });
}
const bridge = data(compile(source('../lib/studio-life-movie-jobs-bridge.ts')));
const shortClient = data(compile(source('../lib/studio-life-movie-jobs-client.ts')).replaceAll('server-only', serverOnly).replaceAll('./studio-life-movie-longform-contract', contractUrl));
const shortRouteUrl = data(compile(source('../app/api/studio/video-factory/jobs-dispatch/route.ts'))
  .replaceAll('next/server', next).replaceAll('@/lib/studio-life-movie-longform-auth', longAuth)
  .replaceAll('@/lib/studio-life-movie-longform-contract', contractUrl)
  .replaceAll('@/lib/studio-life-movie-jobs-bridge', bridge).replaceAll('@/lib/studio-life-movie-jobs-client', shortClient));
function streamedRequest(body, change) {
  return new Request('https://studio.example.test/private-dispatch', {
    method: 'POST', headers: { authorization: 'Bearer synthetic-user-token', 'content-type': 'application/json' }, duplex: 'half',
    body: new ReadableStream({ pull(controller) {
      change(); controller.enqueue(new TextEncoder().encode(JSON.stringify(body))); controller.close();
    } }, { highWaterMark: 0 }),
  });
}
const mutations = [
  ['revoked token', () => { state.revoked = true; }, 401],
  ['offboarded edit role', () => { state.user.role = 'viewer'; }, 403],
  ['removed tenant membership', () => { state.memberExists=false; }, 403],
  ['foreign studio membership', () => { state.member.studioId='foreign'; }, 403],
  ['viewer tenant membership', () => { state.member.role='viewer'; }, 403],
  ['disabled current member', () => { state.user.disabled = true; }, 403],
  ['removed current member', () => { state.exists = false; }, 403],
  ['reassigned tenant', () => { state.decoded.tenantId = 'other-tenant'; }, 403],
  ['active deletion fence', () => { state.fenceExists = true; state.fence.active = true; }, 403],
  ['unavailable current authority', () => { state.lookupFailure = true; }, 503],
];
let passed = 0, failed = 0;
try {
  for (const [name, url] of [['shortform', shortRouteUrl], ['longform', routeUrl]]) {
    const route = await import(url);
    const body = createBody(1); if (name === 'shortform') delete body.action;
    for (const [mutation, change, status] of mutations) {
      for (const phase of ['body-read', 'response-read']) {
        reset(); let req;
        if (phase === 'body-read') req = streamedRequest(body, change);
        else { req = request(body); globalThis.fetch = async (url, options) => {
          state.calls.push({ url: String(url), options, input: JSON.parse(options.body) });
          change(); return new Response(JSON.stringify({ ok: true, privateFixtureOnly: 'synthetic-private-result' }), { status: 200 });
        }; }
        try {
          const response = await route.POST(req);
          assert.equal(response.status, status);
          assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
          const result = await response.text();
          assert.equal(result.includes('synthetic-private-result'), false);
          assert.equal(state.calls.length, phase === 'body-read' ? 0 : 1);
          passed++; console.log(`[PASS] ${name} ${mutation} during ${phase}`);
        } catch (error) { failed++; console.log(`[FAIL] ${name} ${mutation} during ${phase}: ${error.message}`); }
      }
    }
    reset();
    const response = await route.POST(request(body));
    assert.equal(response.status, 202); assert.equal(state.calls.length, 1); passed++;
    console.log(`[PASS] ${name} unchanged owner still dispatches`);
  }
} finally {
  globalThis.fetch = previousFetch;
  if (previousState === undefined) delete globalThis[key]; else globalThis[key] = previousState;
  for (const [name, value] of Object.entries(previousEnv)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
}
console.log(JSON.stringify({ kind: 'actual-Studio-routes-and-auth-source-with-synthetic-Firebase-HTTP-boundaries', passed, failed,
  privateMedia: false, loadedFunctions: false, deployedRuntime: false, providerCalls: 0 }));
if (failed) process.exitCode = 1;
