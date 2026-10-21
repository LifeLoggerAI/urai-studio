import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import * as nodeModule from 'node:module';
import { fileURLToPath } from 'node:url';

// Exercise the checked-in clients with native loopback HTTP. Synthetic plans
// never reach a deployed endpoint, provider or authenticated account.
const require = nodeModule.createRequire(import.meta.url);
const sourceArg = process.argv.indexOf('--source-dir');
const root = sourceArg < 0 ? fileURLToPath(new URL('../lib/', import.meta.url)) : path.resolve(process.argv[sourceArg + 1]);
const baseline = process.argv.includes('--prove-baseline');
function compile(value) {
  if (typeof nodeModule.stripTypeScriptTypes === 'function') return nodeModule.stripTypeScriptTypes(value);
  const ts = require('typescript');
  return ts.transpileModule(value, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
}
const source = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const data = (value) => `data:text/javascript;base64,${Buffer.from(value).toString('base64')}`;
const serverOnly = data('export {};');
const contract = data(compile(source('studio-life-movie-longform-contract.ts')));
const shortClient = data(compile(source('studio-life-movie-jobs-client.ts')).replaceAll('server-only', serverOnly).replaceAll('./studio-life-movie-longform-contract', contract));
const longClient = data(compile(source('studio-life-movie-longform-client.ts')).replaceAll('server-only', serverOnly).replaceAll('./studio-life-movie-longform-contract', contract));
const { callStudioJobsBridge } = await import(shortClient);
const { callStudioLongformBridge } = await import(longClient);
const envKeys = ['NODE_ENV', 'URAI_STUDIO_JOBS_DISPATCH_ENABLED', 'URAI_STUDIO_LONGFORM_DISPATCH_ENABLED', 'URAI_JOBS_BRIDGE_URL', 'URAI_JOBS_LONGFORM_BRIDGE_URL', 'URAI_STUDIO_JOBS_BRIDGE_TOKEN'];
const previousEnv = Object.fromEntries(envKeys.map((name) => [name, process.env[name]]));
const input = {
  action: 'create', tenantId: 'synthetic-tenant', userId: 'synthetic-owner', idempotencyKey: 'synthetic-timeout-key',
  consent: { purpose: 'life-movie.render', policyVersion: 'synthetic-policy', decisionReceiptId: 'synthetic-decision' },
  payload: { synthetic: true },
};
const received = [];
const server = http.createServer(async (request, response) => {
  let body = ''; for await (const chunk of request) body += chunk;
  received.push({ path: request.url, body });
  if (request.url === '/stall-headers') return;
  response.writeHead(request.url === '/rejected' ? 409 : 200, { 'content-type': 'application/json' });
  if (request.url === '/stall-body' || request.url === '/stall-complete-json') {
    response.flushHeaders(); response.write(request.url === '/stall-body' ? '{"ok":' : '{"ok":true}'); return;
  }
  response.end(request.url === '/invalid' ? '{' : request.url === '/rejected' ? '{"ok":false,"error":"synthetic_conflict"}' : '{"ok":true,"jobId":"synthetic-job"}');
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const endpoint = `http://127.0.0.1:${server.address().port}`;
process.env.NODE_ENV = 'development';
process.env.URAI_STUDIO_JOBS_DISPATCH_ENABLED = 'true';
process.env.URAI_STUDIO_LONGFORM_DISPATCH_ENABLED = 'true';
process.env.URAI_STUDIO_JOBS_BRIDGE_TOKEN = 'synthetic-unused-provider-token';
let cases = 0;
async function boundedCall(call, limitMs) {
  let timer;
  try {
    return await Promise.race([call(), new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('test_response_deadline_exceeded')), limitMs);
    })]);
  } finally { clearTimeout(timer); }
}
try {
  for (const [name, call, envName, timeout, invalid] of [
    ['shortform', () => callStudioJobsBridge(input, { timeoutMs: 1000 }), 'URAI_JOBS_BRIDGE_URL', 'jobs_bridge_timeout', 'jobs_bridge_invalid_response'],
    ['longform', () => callStudioLongformBridge(input), 'URAI_JOBS_LONGFORM_BRIDGE_URL', 'longform_bridge_timeout', 'longform_bridge_invalid_response'],
  ]) {
    process.env[envName] = `${endpoint}/success`;
    assert.deepEqual(await call(), { ok: true, jobId: 'synthetic-job' }); cases++;
    process.env[envName] = `${endpoint}/invalid`;
    await assert.rejects(call(), (error) => error.message === invalid && (name === 'shortform' || error.status === 502)); cases++;
    process.env[envName] = `${endpoint}/rejected`;
    await assert.rejects(call(), (error) => error.message === 'synthetic_conflict' && (name === 'shortform' || error.status === 409)); cases++;
    process.env[envName] = `${endpoint}/stall-body`;
    const started = performance.now();
    await assert.rejects(boundedCall(call, name === 'shortform' ? 5000 : 20000), (error) => error.message === (baseline ? invalid : timeout)
      && (name === 'shortform' || error.status === (baseline ? 502 : 504)));
    assert.ok(performance.now() - started < (name === 'shortform' ? 5000 : 20000), 'the complete response must remain deadline-bounded'); cases++;
    if (name === 'shortform') {
      process.env[envName] = `${endpoint}/stall-headers`;
      await assert.rejects(call(), (error) => error.message === timeout); cases++;
      if (!baseline) {
        process.env[envName] = `${endpoint}/stall-complete-json`;
        await assert.rejects(boundedCall(call, 5000), (error) => error.message === timeout); cases++;
      }
    }
  }
  assert.equal(received.length, baseline ? 9 : 10, 'each action dispatches once without hidden retry');
  assert.ok(received.every((entry) => JSON.parse(entry.body).payload.synthetic === true));
  console.log(baseline
    ? 'Reproduced both response-body timeout misclassifications on actual Studio source; 9 native loopback HTTP cases, no provider calls.'
    : `Studio complete-response timeout recovery: ${cases} native loopback HTTP cases passed; zero redispatch or provider calls.`);
} finally {
  server.closeAllConnections(); await new Promise((resolve) => server.close(resolve));
  for (const [name, value] of Object.entries(previousEnv)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
}
