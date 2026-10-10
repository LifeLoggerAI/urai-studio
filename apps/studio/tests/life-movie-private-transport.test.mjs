import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import * as nodeModule from 'node:module';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

// Actual source with synthetic account boundaries and native loopback HTTP.
// No provider, private source, deployed endpoint or credential is used.
const require = nodeModule.createRequire(import.meta.url);
const sourceArg = process.argv.indexOf('--source-dir');
const root = sourceArg < 0 ? fileURLToPath(new URL('../', import.meta.url)) : path.resolve(process.argv[sourceArg + 1]);
const baseline = process.argv.includes('--prove-baseline');
function compile(value) {
  if (typeof nodeModule.stripTypeScriptTypes === 'function') return nodeModule.stripTypeScriptTypes(value);
  const ts = require('typescript');
  return ts.transpileModule(value, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
}
const source = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const data = (value) => `data:text/javascript;base64,${Buffer.from(value).toString('base64')}`;
const serverOnly = data('export {};');
const contract = data(compile(source('lib/studio-life-movie-longform-contract.ts')));
const shortClient = data(compile(source('lib/studio-life-movie-jobs-client.ts')).replaceAll('server-only', serverOnly).replaceAll('./studio-life-movie-longform-contract', contract));
const longClient = data(compile(source('lib/studio-life-movie-longform-client.ts')).replaceAll('server-only', serverOnly).replaceAll('./studio-life-movie-longform-contract', contract));
const { callStudioJobsBridge } = await import(shortClient);
const { callStudioLongformBridge } = await import(longClient);
const key = Symbol.for('urai.studio.private-transport-test');
const previousState = globalThis[key], previousFetch = globalThis.fetch;
const envKeys = ['NODE_ENV', 'URAI_STUDIO_JOBS_DISPATCH_ENABLED', 'URAI_STUDIO_LONGFORM_DISPATCH_ENABLED', 'URAI_JOBS_BRIDGE_URL', 'URAI_JOBS_LONGFORM_BRIDGE_URL', 'URAI_STUDIO_JOBS_BRIDGE_TOKEN'];
const previousEnv = Object.fromEntries(envKeys.map((name) => [name, process.env[name]]));
const state = globalThis[key] = { calls: [], checks: [], paths: [], decoded: {}, user: {}, revoked: false, exists: true, lookupFailure: false, fenceExists: false, fence: null };
const admin = data(`
const state = globalThis[Symbol.for('urai.studio.private-transport-test')];
export const firebaseAdminStatus = { mode: 'synthetic-test-only' };
export const adminAuth = { async verifyIdToken(token, revokedCheck) {
  state.checks.push({ token, revokedCheck });
  if (state.revoked && revokedCheck) throw new Error('synthetic revoked token');
  return structuredClone(state.decoded);
} };
export const adminDb = { doc(path) { state.paths.push(path); return { async get() {
  if (state.lookupFailure) throw new Error('synthetic unavailable authority');
  if(path.startsWith('studioDataRightsOwnerFences/'))return {exists:state.fenceExists,data:()=>state.fence};
  return { exists: state.exists, data: () => structuredClone(state.user) };
} }; } };
`);
const auth = data(compile(source('lib/studio-auth.ts')).replaceAll('@/lib/firebase-admin', admin));
const editAuth = data(compile(source('lib/studio-life-movie-longform-auth.ts')).replaceAll('server-only', serverOnly).replaceAll('@/lib/firebase-admin', admin).replaceAll('@/lib/studio-auth', auth));
const bridge = data(compile(source('lib/studio-life-movie-jobs-bridge.ts')));
const next = data('export const NextResponse = { json(body, init) { return new Response(JSON.stringify(body), { ...init, headers: { ...init.headers, "content-type": "application/json" } }); } };');
const routeUrl = data(compile(source('app/api/studio/video-factory/jobs-dispatch/route.ts'))
  .replaceAll('next/server', next).replaceAll('@/lib/studio-auth', auth)
  .replaceAll('@/lib/studio-life-movie-longform-auth', editAuth)
  .replaceAll('@/lib/studio-life-movie-longform-contract', contract)
  .replaceAll('@/lib/studio-life-movie-jobs-bridge', bridge)
  .replaceAll('@/lib/studio-life-movie-jobs-client', shortClient));
const consent = { purpose: 'life-movie.render', policyVersion: 'synthetic-policy-v1', decisionReceiptId: 'synthetic-receipt' };
function body() {
  return { projectId: 'synthetic-project', consent: structuredClone(consent), width: 320, height: 320, fps: 30,
    sceneTruthReceiptRef: `str_${'a'.repeat(20)}_${'b'.repeat(8)}_${'c'.repeat(43)}`, sceneTruthDigest: 'd'.repeat(64),
    sources: [{ id: 'synthetic-clip', bucket: 'synthetic-bucket', objectPath: 'tenants/synthetic-tenant/clips/source.mp4',
      mimeType: 'video/mp4', provenance: 'user-recorded-memory', sourceRefs: ['synthetic-source'], consentRef: 'synthetic-consent', ownerOrRightsRef: 'synthetic-rights' }],
    timeline: [{ sourceId: 'synthetic-clip', startMs: 0, endMs: 1000 }], subtitleText: '1\n00:00:00,000 --> 00:00:00,900\nSynthetic private caption' };
}
function reset() {
  state.calls = []; state.checks = []; state.paths = [];
  state.decoded = { uid: 'synthetic-owner', tenantId: 'synthetic-tenant' };
  state.user = { uid: 'synthetic-owner', role: 'owner', disabled: false };
  state.revoked = false; state.exists = true; state.lookupFailure = false;
  state.fenceExists=false;state.fence={uid:'synthetic-owner',active:false,permanent:false};
  process.env.NODE_ENV = 'production';
  process.env.URAI_STUDIO_JOBS_DISPATCH_ENABLED = 'true';
  process.env.URAI_STUDIO_LONGFORM_DISPATCH_ENABLED = 'true';
  process.env.URAI_JOBS_BRIDGE_URL = 'https://jobs.example.test/studioLifeMovieBridge';
  process.env.URAI_JOBS_LONGFORM_BRIDGE_URL = 'https://jobs.example.test/studioLifeMovieLongformBridge';
  process.env.URAI_STUDIO_JOBS_BRIDGE_TOKEN = 'synthetic-server-secret';
  globalThis.fetch = async (url, options) => {
    state.calls.push({ url: String(url), options, input: JSON.parse(options.body) });
    return new Response(JSON.stringify({ ok: true, jobId: 'synthetic-job-001' }), { status: 200 });
  };
}
function request(value, { token = true, headers = {}, raw } = {}) {
  return new Request('https://studio.example.test/api/studio/video-factory/jobs-dispatch', {
    method: 'POST', headers: { ...(token ? { authorization: 'Bearer synthetic-user-token' } : {}), 'content-type': 'application/json', ...headers },
    body: raw ?? JSON.stringify(value),
  });
}
let cases = 0, reproduced = 0;
const servers = [];
async function server(handler) {
  const value = http.createServer(handler); servers.push(value);
  await new Promise((resolve) => value.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${value.address().port}`;
}

try {
  const route = await import(routeUrl);
  reset();
  const result = await route.POST(request(body(), { headers: { 'x-urai-user-id': 'foreign-user', 'x-urai-tenant-id': 'foreign-tenant' } }));
  assert.equal(result.status, 202); assert.equal(state.calls.length, 1);
  assert.equal(result.headers.get('cache-control'), 'no-store, max-age=0');
  assert.equal(state.calls[0].input.userId, 'synthetic-owner');
  assert.equal(state.calls[0].input.tenantId, 'synthetic-tenant');
  assert.equal(state.calls[0].input.payload.publicReleaseAuthorized, false);
  assert.equal(state.calls[0].input.payload.providerGenerationAuthorized, false);
  if (baseline) { assert.equal(state.calls[0].input.consent, undefined); reproduced++; }
  else {
    assert.deepEqual(state.calls[0].input.consent, consent);
    assert.ok(state.checks.some((check) => check.revokedCheck === true));
    assert.deepEqual(state.paths, ['studioUsers/synthetic-owner',
      `studioDataRightsOwnerFences/${createHash('sha256').update('urai-studio-data-rights:synthetic-owner').digest('hex')}`]);
  }
  cases++;

  if (baseline) {
    reset(); process.env.NODE_ENV = 'development';
    const local = await route.POST(request(body(), { token: false, headers: { 'x-urai-user-id': 'synthetic-owner', 'x-urai-tenant-id': 'synthetic-tenant' } }));
    assert.equal(local.status, 202); assert.equal(state.calls.length, 1); reproduced++; cases++;
  } else {
    for (const [setup, status, options] of [
      [() => {}, 401, { token: false }],
      [() => { process.env.NODE_ENV = 'development'; }, 401, { token: false, headers: { 'x-urai-user-id': 'synthetic-owner', 'x-urai-tenant-id': 'synthetic-tenant' } }],
      [() => { state.revoked = true; }, 401],
      [() => { state.decoded = { uid: 'synthetic-owner' }; }, 403, { headers: { 'x-urai-tenant-id': 'synthetic-tenant' } }],
      [() => { state.user.role = 'viewer'; }, 403],
      [() => { state.user.disabled = true; }, 403],
      [() => { state.user.uid = 'foreign-owner'; }, 403],
      [() => { state.exists = false; }, 403],
      [() => { state.lookupFailure = true; }, 503],
      [() => { state.fenceExists=true;state.fence.active=true; }, 403],
      [() => { state.fenceExists=true;state.fence.permanent=true; }, 403],
      [() => { state.fenceExists=true;state.fence.uid='foreign-owner'; }, 403],
    ]) {
      reset(); setup(); const denied = await route.POST(request(body(), options));
      assert.equal(denied.status, status); assert.equal(state.calls.length, 0); cases++;
    }
    for (const change of [
      (value) => { delete value.consent; }, (value) => { value.consent.purpose = 'memory.storage'; },
      (value) => { value.consent.policyVersion = ''; }, (value) => { value.consent.policyVersion = 'x'.repeat(81); },
      (value) => { value.consent.decisionReceiptId = 'x'.repeat(161); }, (value) => { value.consent.granted = true; },
      (value) => { value.userId = 'foreign-owner'; }, (value) => { value.tenantId = 'foreign-tenant'; },
      (value) => { value.publicReleaseAuthorized = true; }, (value) => { value.providerGenerationAuthorized = true; },
      (value) => { value.subtitleText = 'Synthetic plain caption'; },
      (value) => { value.subtitleText = '1\n00:00:00,900 --> 00:00:01,001\nSynthetic caption'; },
    ]) {
      reset(); const value = body(); change(value); const denied = await route.POST(request(value));
      assert.equal(denied.status, 400); assert.equal(state.calls.length, 0); cases++;
    }
    for (const [raw, status, headers] of [['[', 400], ['x'.repeat(512 * 1024 + 1), 413], [JSON.stringify(body()), 413, { 'content-length': String(512 * 1024 + 1) }]]) {
      reset(); const denied = await route.POST(request(null, { raw, headers }));
      assert.equal(denied.status, status); assert.equal(state.calls.length, 0); cases++;
    }
  }

  // Real fetch follows 307/308 by replaying POST bytes. Exercise the checked-in
  // clients against two loopback servers to prove zero redispatch when fixed.
  globalThis.fetch = previousFetch;
  process.env.NODE_ENV = 'development';
  const initial = [], replayed = [];
  const destination = await server(async (req, res) => {
    let bytes = ''; for await (const chunk of req) bytes += chunk;
    replayed.push({ bytes, authorization: req.headers.authorization });
    res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"ok":true}');
  });
  const endpoint = await server(async (req, res) => {
    let bytes = ''; for await (const chunk of req) bytes += chunk;
    if (req.url === '/replayed') {
      replayed.push({ bytes, authorization: req.headers.authorization });
      res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"ok":true}'); return;
    }
    initial.push({ bytes, authorization: req.headers.authorization });
    const [_, mode, code] = req.url.split('/');
    if (mode === 'direct') { res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"ok":true}'); }
    else if (mode === 'oversized') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ok: true, text: 'x'.repeat(2 * 1024 * 1024) })); }
    else { res.writeHead(Number(code), { location: mode === 'same' ? '/replayed' : `${destination}/replayed` }); res.end(); }
  });
  const input = { action: 'create', tenantId: 'synthetic-tenant', userId: 'synthetic-owner', idempotencyKey: 'synthetic-key-001', consent, payload: { subtitleText: 'SYNTHETIC_PRIVATE_PLAN' } };
  for (const [name, call] of [['short', callStudioJobsBridge], ['long', callStudioLongformBridge]]) {
    const envName = name === 'short' ? 'URAI_JOBS_BRIDGE_URL' : 'URAI_JOBS_LONGFORM_BRIDGE_URL';
    process.env[envName] = `${endpoint}/direct`;
    assert.deepEqual(await call(input), { ok: true }); cases++;
    for (const mode of ['same', 'cross']) for (const code of [307, 308]) {
      replayed.length = 0; process.env[envName] = `${endpoint}/${mode}/${code}`;
      if (baseline) {
        await call(input); assert.equal(replayed.length, 1);
        assert.ok(replayed[0].bytes.includes('SYNTHETIC_PRIVATE_PLAN'));
        if (mode === 'same') assert.equal(replayed[0].authorization, 'Bearer synthetic-server-secret');
        reproduced++;
      } else { await assert.rejects(call(input)); assert.equal(replayed.length, 0); }
      cases++;
    }
    if (!baseline) {
      process.env[envName] = `${endpoint}/oversized`; await assert.rejects(call(input)); cases++;
      const before = initial.length;
      await assert.rejects(call({ ...input, payload: { subtitleText: 'x'.repeat(512 * 1024 + 1) } }));
      assert.equal(initial.length, before); cases++;
    }
  }
  if (baseline) assert.equal(reproduced, 10, 'missing consent, local fallback and eight redirect replays must reproduce');
  console.log(baseline ? `Reproduced ${reproduced} current-owner consent/identity/redirect failures using actual source and loopback HTTP.`
    : `Studio private Life Movie transport: ${cases} behavioral cases passed; actual route and native HTTP, no provider/runtime activation.`);
} finally {
  globalThis.fetch = previousFetch;
  if (previousState === undefined) delete globalThis[key]; else globalThis[key] = previousState;
  for (const [name, value] of Object.entries(previousEnv)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
  for (const value of servers) { value.closeAllConnections(); await new Promise((resolve) => value.close(resolve)); }
}
