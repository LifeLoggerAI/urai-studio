import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as nodeModule from 'node:module';

// The route, envelope builder and protected client are actual checked-in source.
// Firebase auth and Jobs HTTP are synthetic boundaries; no render is submitted.
const require = nodeModule.createRequire(import.meta.url);
const sourceArg = process.argv.indexOf('--source-dir');
const sourceDir = sourceArg < 0 ? fileURLToPath(new URL('../../../', import.meta.url)) : path.resolve(process.argv[sourceArg + 1]);
const baseline = process.argv.includes('--prove-baseline');
function compile(source) {
  if (typeof nodeModule.stripTypeScriptTypes === 'function') return nodeModule.stripTypeScriptTypes(source);
  return require('typescript').transpileModule(source, { compilerOptions: {
    module: require('typescript').ModuleKind.ESNext, target: require('typescript').ScriptTarget.ES2022,
  } }).outputText;
}
const data = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const source = (name) => fs.readFileSync(path.join(sourceDir, 'apps/studio', name), 'utf8');
const state = { calls: [], authOk: true, status: 200, response: { ok: true, jobId: 'synthetic-job-123456' } };
const key = Symbol.for('urai.studio.shortform.consent-route-test');
const previousState = globalThis[key], previousFetch = globalThis.fetch;
const envKeys = ['NODE_ENV', 'URAI_STUDIO_JOBS_DISPATCH_ENABLED', 'URAI_JOBS_BRIDGE_URL', 'URAI_STUDIO_JOBS_BRIDGE_TOKEN'];
const previousEnv = Object.fromEntries(envKeys.map((name) => [name, process.env[name]]));
globalThis[key] = state;
const authUrl = data(`export async function requireStudioAuth() {
  const state = globalThis[Symbol.for('urai.studio.shortform.consent-route-test')];
  return { ok: state.authOk, uid: 'synthetic-owner', tenantId: 'synthetic-tenant', authMode: 'firebase_id_token',
    ...(state.authOk ? {} : { error: { code: 'unauthorized', message: 'synthetic-denial' } }) };
}`);
const bridgeUrl = data(compile(source('lib/studio-life-movie-jobs-bridge.ts')));
const clientUrl = data(compile(source('lib/studio-life-movie-jobs-client.ts')).replaceAll('server-only', data('export {};')));
const nextUrl = data('export const NextResponse = { json(body, init) { return new Response(JSON.stringify(body), { ...init, headers: { ...init.headers, "content-type": "application/json" } }); } };');
const routeUrl = data(compile(source('app/api/studio/video-factory/jobs-dispatch/route.ts'))
  .replaceAll('next/server', nextUrl).replaceAll('@/lib/studio-auth', authUrl)
  .replaceAll('@/lib/studio-life-movie-jobs-bridge', bridgeUrl).replaceAll('@/lib/studio-life-movie-jobs-client', clientUrl));
const consent = { purpose: 'life-movie.render', policyVersion: 'synthetic-policy-v1', decisionReceiptId: 'synthetic-decision' };
function body() {
  return { projectId: 'synthetic-project', consent: { ...consent },
    sceneTruthReceiptRef: `str_${'a'.repeat(16)}_${'b'.repeat(8)}_${'c'.repeat(40)}`,
    sceneTruthDigest: 'd'.repeat(64),
    sources: [{ id: 'synthetic-source', bucket: 'synthetic-private-bucket', objectPath: 'tenants/synthetic-tenant/source/image.png',
      mimeType: 'image/png', provenance: 'original-source', sourceRefs: ['synthetic-fixture'],
      consentRef: 'synthetic-source-consent', ownerOrRightsRef: 'synthetic-rights' }],
    timeline: [{ sourceId: 'synthetic-source', startMs: 0, endMs: 1000 }] };
}
function reset() {
  state.calls = []; state.authOk = true; state.status = 200; state.response = { ok: true, jobId: 'synthetic-job-123456' };
  process.env.NODE_ENV = 'production'; process.env.URAI_STUDIO_JOBS_DISPATCH_ENABLED = 'true';
  process.env.URAI_JOBS_BRIDGE_URL = 'https://jobs.example.test/studioLifeMovieBridge';
  process.env.URAI_STUDIO_JOBS_BRIDGE_TOKEN = 'synthetic-server-secret';
  globalThis.fetch = async (url, options) => {
    const input = JSON.parse(options.body); state.calls.push({ url: String(url), options, input });
    // The current Jobs create contract requires this exact consent context.
    if (input.action === 'create' && (!input.consent || input.consent.purpose !== 'life-movie.render'
      || typeof input.consent.policyVersion !== 'string' || typeof input.consent.decisionReceiptId !== 'string')) {
      return new Response(JSON.stringify({ ok: false, error: 'invalid_bridge_request' }), { status: 400 });
    }
    return new Response(JSON.stringify(state.response), { status: state.status });
  };
}
function request(value, raw) {
  return new Request('https://studio.example.test/api/studio/video-factory/jobs-dispatch', {
    method: 'POST', headers: { authorization: 'Bearer synthetic-user-token', 'content-type': 'application/json',
      'x-urai-user-id': 'foreign-owner', 'x-urai-tenant-id': 'foreign-tenant' }, body: raw ?? JSON.stringify(value),
  });
}
let cases = 0;
try {
  const route = await import(routeUrl), client = await import(clientUrl);
  reset(); const supplied = body(); supplied.userId = 'foreign-owner'; supplied.tenantId = 'foreign-tenant';
  const accepted = await route.POST(request(supplied)); const acceptedBody = await accepted.json();
  if (baseline) {
    assert.equal(accepted.status, 400); assert.equal(acceptedBody.error.code, 'invalid_bridge_request');
    assert.equal(state.calls.length, 1); assert.equal(state.calls[0].input.consent, undefined);
    console.log('Reproduced: valid short-form Studio input loses consent before Jobs create admission; no real request submitted.');
  } else {
    assert.equal(accepted.status, 202); assert.equal(acceptedBody.ok, true); assert.equal(state.calls.length, 1);
    const sent = state.calls[0];
    assert.deepEqual(sent.input.consent, consent);
    assert.equal(sent.input.userId, 'synthetic-owner'); assert.equal(sent.input.tenantId, 'synthetic-tenant');
    assert.equal(sent.options.headers.authorization, 'Bearer synthetic-server-secret'); assert.equal(sent.options.cache, 'no-store');
    assert.equal(sent.input.payload.outputPrefix, 'tenants/synthetic-tenant/life-movies/synthetic-project/');
    assert.equal(sent.input.payload.providerGenerationAuthorized, false); assert.equal(sent.input.payload.publicReleaseAuthorized, false);
    assert.equal(JSON.stringify(acceptedBody).includes('synthetic-server-secret'), false); cases++;

    for (const mutate of [
      (value) => { delete value.consent; }, (value) => { value.consent = null; }, (value) => { value.consent = []; },
      (value) => { value.consent.purpose = 'memory.storage'; }, (value) => { value.consent.policyVersion = ''; },
      (value) => { value.consent.policyVersion = 'x'.repeat(81); }, (value) => { value.consent.policyVersion = 1; },
      (value) => { delete value.consent.decisionReceiptId; }, (value) => { value.consent.decisionReceiptId = ' '; },
      (value) => { value.consent.decisionReceiptId = 'x'.repeat(161); },
      (value) => { value.consent.granted = true; },
    ]) {
      reset(); const input = body(); mutate(input); const result = await route.POST(request(input));
      assert.equal(result.status, 400); assert.equal((await result.json()).error.code, 'life_movie_invalid_render_consent');
      assert.equal(state.calls.length, 0, 'invalid consent must never reach Jobs'); cases++;
    }
    reset(); const trimmed = body(); trimmed.consent.policyVersion = ' synthetic-policy-v1 '; trimmed.consent.decisionReceiptId = ' synthetic-decision ';
    assert.equal((await route.POST(request(trimmed))).status, 202); assert.deepEqual(state.calls[0].input.consent, consent); cases++;
    reset(); state.authOk = false; assert.equal((await route.POST(request(body()))).status, 401); assert.equal(state.calls.length, 0); cases++;
    reset(); delete process.env.URAI_STUDIO_JOBS_DISPATCH_ENABLED;
    assert.equal((await route.POST(request(body()))).status, 503); assert.equal(state.calls.length, 0); cases++;
    reset(); const malformed = await route.POST(request(null, '[')); assert.equal(malformed.status, 400); assert.equal(state.calls.length, 0); cases++;
    reset(); state.status = 409; state.response = { ok: false, error: 'life_movie_consent_revoked' };
    const revoked = await route.POST(request(body())); assert.equal((await revoked.json()).error.code, 'life_movie_consent_revoked'); cases++;
    reset(); await assert.rejects(client.callStudioJobsBridge({ action: 'create', tenantId: 'synthetic-tenant', userId: 'synthetic-owner',
      idempotencyKey: 'synthetic-idempotency', payload: {} }), /life_movie_invalid_render_consent/);
    assert.equal(state.calls.length, 0); cases++;
    console.log(`Studio actual short-form route/client: ${cases} consent transport, denial and authority cases passed; synthetic auth/Jobs only, no grant or runtime activation.`);
  }
} finally {
  globalThis.fetch = previousFetch;
  if (previousState === undefined) delete globalThis[key]; else globalThis[key] = previousState;
  for (const [name, value] of Object.entries(previousEnv)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
}
