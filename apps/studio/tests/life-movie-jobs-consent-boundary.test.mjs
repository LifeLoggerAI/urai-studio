import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { test } from 'node:test';

const ts = createRequire(new URL('../package.json', import.meta.url))('typescript');
const source = readFileSync(new URL('../lib/studio-life-movie-jobs-client.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('studio-life-movie-jobs-client.ts', source, ts.ScriptTarget.Latest, true);
const names = ['requireStudioJobsRenderConsent', 'productionRuntime', 'validateBridgeUrl'];
const clauses = names.map((name) => {
  const node = ast.statements.find((entry) => ts.isFunctionDeclaration(entry) && entry.name?.text === name);
  assert.ok(node?.body, 'missing checked-in Studio function: ' + name);
  return node.getText(ast);
});
const compiled = ts.transpileModule(clauses.join('\n') + '\nmodule.exports={requireStudioJobsRenderConsent,validateBridgeUrl};', {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const runtime = { env: { NODE_ENV: 'development' } };
const module = { exports: {} };
vm.runInNewContext(compiled, { module, exports: module.exports, process: runtime, URL, Error, Array, Object, Reflect });
const { requireStudioJobsRenderConsent: parse, validateBridgeUrl: allowedUrl } = module.exports;
const good = () => ({ purpose: 'life-movie.render', policyVersion: '1.1.0', decisionReceiptId: 'a'.repeat(64) });

test('plain and null-prototype consent records accept only the exact policy', () => {
  for (const input of [good(), Object.assign(Object.create(null), good())]) {
    const result = parse(input);
    assert.equal(result.purpose, 'life-movie.render');
    assert.equal(result.policyVersion, '1.1.0');
    assert.equal(result.decisionReceiptId, 'a'.repeat(64));
  }
});
test('wrong version, hash, nonenumerable or symbol extras are rejected', () => {
  for (const candidate of [
    { ...good(), policyVersion: '1.0.0' },
    { ...good(), decisionReceiptId: 'x'.repeat(64) },
    Object.defineProperty(good(), 'hidden', { value: 1 }),
    Object.assign(good(), { [Symbol('private')]: true }),
  ]) assert.throws(() => parse(candidate), /life_movie_invalid_render_consent/);
});
test('inherited consent authority is rejected', () => {
  assert.throws(() => parse(Object.assign(Object.create({ role: 'admin' }), good())), /life_movie_invalid_render_consent/);
});
test('accessor-backed consent fields are rejected without executing getters', () => {
  for (const field of ['purpose', 'policyVersion', 'decisionReceiptId']) {
    const candidate = good();
    let called = 0;
    Object.defineProperty(candidate, field, { enumerable: true, get() { called++; return good()[field]; } });
    assert.throws(() => parse(candidate), /life_movie_invalid_render_consent/);
    assert.equal(called, 0, 'accessor executed for ' + field);
  }
});
test('throwing proxy authority is denied with a generic error', () => {
  const candidate = new Proxy(good(), { ownKeys() { throw Error('private source trap'); } });
  assert.throws(() => parse(candidate), /life_movie_invalid_render_consent/);
});
test('development loopback URLs include IPv6 but never remote HTTP', () => {
  for (const host of ['localhost', '127.0.0.1', '[::1]']) {
    assert.equal(allowedUrl('http://' + host + ':5001/').protocol, 'http:');
  }
  assert.throws(() => allowedUrl('http://example.com/'), /jobs_bridge_url_not_approved/);
});
test('production rejects HTTP and URL credentials/query/fragment', () => {
  runtime.env.NODE_ENV = 'production';
  for (const host of ['localhost', '127.0.0.1', '[::1]']) {
    assert.throws(() => allowedUrl('http://' + host + ':5001/'), /jobs_bridge_url_not_approved/);
  }
  for (const invalid of ['https://example.com/?secret=1', 'https://example.com/#fragment', 'https://user:pass@example.com']) {
    assert.throws(() => allowedUrl(invalid), /jobs_bridge_url_invalid/);
  }
  assert.equal(allowedUrl('https://example.com/').protocol, 'https:');
});
