import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { after, before, test } from 'node:test';
import vm from 'node:vm';

// Uses the unchanged checked-in Studio dispatch functions. Only the Jobs
// endpoint and its bounded JSON response parser are substituted; this is a
// Studio-transport regression, not Jobs/Privacy authorization acceptance.
const ts = createRequire(new URL('../package.json', import.meta.url))('typescript');
const source = readFileSync(new URL('../lib/studio-life-movie-jobs-client.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('studio-life-movie-jobs-client.ts', source, ts.ScriptTarget.Latest, true);
const fnNames = ['requireStudioJobsRenderConsent', 'productionRuntime', 'dispatchEnabled', 'bridgeUrl', 'bridgeToken',
  'validateBridgeUrl', 'studioJobsBridgeStatus', 'callStudioJobsBridge'];
const staticNames = ['DEFAULT_TIMEOUT_MS', 'JOBS_BRIDGE_MAX_BODY_BYTES'];
const declarations = staticNames.map((name) => {
  const statement = ast.statements.find((node) => ts.isVariableStatement(node) &&
    node.declarationList.declarations.some((d) => d.name.getText(ast) === name));
  assert.ok(statement, 'missing Studio runtime constant ' + name);
  return statement.getText(ast);
});
const functions = fnNames.map((name) => {
  const statement = ast.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === name);
  assert.ok(statement?.body, 'missing Studio runtime function ' + name);
  return statement.getText(ast);
});
const compiled = ts.transpileModule([...declarations, ...functions,
  'module.exports={requireStudioJobsRenderConsent,studioJobsBridgeStatus,callStudioJobsBridge};'].join('\n'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const runtime = { env: { NODE_ENV: 'development', URAI_STUDIO_JOBS_DISPATCH_ENABLED: 'true',
  URAI_STUDIO_JOBS_BRIDGE_TOKEN: 'synthetic-test-only-token' } };
const module = { exports: {} };
async function parseStub(response, maxBytes) {
  // The actual production longform parser is separately tested in Studio.
  const raw = await response.text();
  if (Buffer.byteLength(raw, 'utf8') > maxBytes) throw Error('body_too_large');
  return JSON.parse(raw);
}
vm.runInNewContext(compiled, { module, exports: module.exports, process: runtime, URL, Error, Array,
  Object, Reflect, Buffer, AbortController, setTimeout, clearTimeout, fetch,
  readStudioLongformJson: parseStub });
const { callStudioJobsBridge: call, studioJobsBridgeStatus: status } = module.exports;
const consent = () => ({purpose: 'life-movie.render', policyVersion: '1.1.0', decisionReceiptId: 'a'.repeat(64)});
const request = () => ({action: 'create', tenantId: 'synthetic-tenant', userId: 'synthetic-owner',
  idempotencyKey: 'synthetic-key', consent: consent(), payload: {renderPlanDigest: 'b'.repeat(64)}});
let server;
let sent = 0;
let handler = (_req, res) => {res.writeHead(200, {'content-type':'application/json'}); res.end('{"ok":true}');};
let port;
before(async () => {
  server = createServer(async (req, res) => {
    sent++;
    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    handler(req, res, Buffer.concat(buffers).toString('utf8'));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = server.address().port;
  runtime.env.URAI_JOBS_BRIDGE_URL = `http://127.0.0.1:${port}/bridge`;
});
after(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

test('Studio dispatch status stays closed without explicit enable flag and secret', async () => {
  const originalFlag = runtime.env.URAI_STUDIO_JOBS_DISPATCH_ENABLED;
  runtime.env.URAI_STUDIO_JOBS_DISPATCH_ENABLED = 'false';
  try {
    assert.equal(status().dispatchAvailable, false);
    assert.equal(status().reason, 'dispatch_disabled');
    await assert.rejects(call(request()), /dispatch_disabled/);
  } finally {runtime.env.URAI_STUDIO_JOBS_DISPATCH_ENABLED = originalFlag;}
  const token = runtime.env.URAI_STUDIO_JOBS_BRIDGE_TOKEN;
  runtime.env.URAI_STUDIO_JOBS_BRIDGE_TOKEN = '';
  try {
    assert.equal(status().reason, 'bridge_token_missing');
    await assert.rejects(call(request()), /bridge_token_missing/);
  } finally {runtime.env.URAI_STUDIO_JOBS_BRIDGE_TOKEN = token;}
  assert.equal(sent, 0);
});

test('Studio sends exact synthetic consent with dedicated token to local Jobs double', async () => {
  handler = (req, res, body) => {
    assert.equal(req.method, 'POST');
    assert.equal(req.headers.authorization, 'Bearer synthetic-test-only-token');
    assert.equal(req.headers.accept, 'application/json');
    assert.equal(req.headers['content-type'], 'application/json');
    const parsed = JSON.parse(body);
    assert.deepEqual(parsed.consent, consent());
    assert.equal(parsed.tenantId, 'synthetic-tenant');
    assert.equal(parsed.userId, 'synthetic-owner');
    res.writeHead(200, {'content-type':'application/json'});
    res.end('{"ok":true,"jobId":"synthetic-job"}');
  };
  const result = await call(request());
  assert.equal(result.jobId, 'synthetic-job');
  assert.equal(sent, 1);
});

test('forged or accessor-backed render consent is rejected before any HTTP transmit', async () => {
  const previous = sent;
  const forged = request();
  forged.consent.decisionReceiptId = 'forged';
  await assert.rejects(call(forged), /life_movie_invalid_render_consent/);
  const accessor = request();
  let getterInvoked = false;
  Object.defineProperty(accessor.consent, 'purpose', {get() { getterInvoked=true; return 'life-movie.render'; }});
  await assert.rejects(call(accessor), /life_movie_invalid_render_consent/);
  assert.equal(getterInvoked, false);
  assert.equal(sent, previous);
});

test('oversized private JSON envelope denied before bridge bearer token goes on the wire', async () => {
  const previous = sent;
  const huge = request();
  huge.payload = {raw: 'x'.repeat(33 * 1024)};
  await assert.rejects(call(huge), /life_movie_request_too_large/);
  assert.equal(sent, previous);
});

test('a redirect cannot forward the Studio bridge credential to another endpoint', async () => {
  const previous = sent;
  let victimRequests = 0;
  const victim = createServer((_req, res) => {
    victimRequests++; res.writeHead(200); res.end('{"ok":true}');
  });
  await new Promise((resolve) => victim.listen(0, '127.0.0.1', resolve));
  try {
    handler = (_req, res) => {
      res.writeHead(307, {Location: `http://127.0.0.1:${victim.address().port}/exfiltrate`});
      res.end();
    };
    await assert.rejects(call(request()));
    assert.equal(sent, previous + 1);
    assert.equal(victimRequests, 0);
  } finally {
    victim.closeAllConnections();
    await new Promise((resolve) => victim.close(resolve));
  }
});

test('malformed bridge success and forged error string fail closed', async () => {
  handler = (_req, res) => {res.writeHead(200, {'content-type':'application/json'});res.end('{"ok":"true"}');};
  await assert.rejects(call(request()), /jobs_bridge_http_200/);
  handler = (_req, res) => {res.writeHead(403, {'content-type':'application/json'});res.end('{"ok":false,"error":"Secret: anything"}');};
  await assert.rejects(call(request()), /jobs_bridge_http_403/);
  handler = (_req, res) => {res.writeHead(403, {'content-type':'application/json'});res.end('{"ok":false,"error":"invalid_job_consent"}');};
  await assert.rejects(call(request()), /invalid_job_consent/);
});
