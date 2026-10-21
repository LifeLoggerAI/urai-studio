import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const requireFunctions = createRequire(new URL('../../../functions/package.json', import.meta.url));
const ts = requireFunctions('typescript');
const helper = fs.readFileSync(new URL('../../../functions/src/fallback-job-lease.ts', import.meta.url), 'utf8');
const result = ts.transpileModule(helper, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS }, reportDiagnostics: true });
assert.deepEqual((result.diagnostics ?? []).filter(x => x.category === ts.DiagnosticCategory.Error).map(x => x.code), []);
const leaseModule = { exports: {} };
new Function('exports', 'module', result.outputText)(leaseModule.exports, leaseModule);
const { inspectFallbackJobLease: inspect, ownsFallbackJobLease: owns } = leaseModule.exports;
const tsValue = ms => ({ toMillis: () => ms });
const now = 10000;

test('queued work is leased once; exhausted work is marked rather than processed', () => {
  assert.deepEqual(inspect({state: 'queued'}, now, 3), {kind:'claim',attempt:0});
  assert.deepEqual(inspect({state: 'queued',attempt:2}, now, 3), {kind:'claim',attempt:2});
  assert.deepEqual(inspect({state: 'queued',attempt:3}, now, 3), {kind:'exhausted',attempt:3});
});
test('fresh, malformed and unexpired running leases never claim', () => {
  for (const lease of [undefined, null, tsValue(10001), {toMillis:()=>NaN}, 'yesterday'])
    assert.equal(inspect({state: 'running', attempt:1,leaseExpiresAt:lease},now,3).kind,'skip');
  assert.equal(inspect({state: 'running',attempt:1,leaseExpiresAt:tsValue(now)},now,3).kind,'claim');
  assert.equal(inspect({state: 'running',attempt:1,leaseExpiresAt:tsValue(now-10)},now,3).kind,'claim');
});
test('untrusted attempt and state cannot bypass retry cap', () => {
  for (const job of [null, {},{state:'succeeded'}, {state:'queued',attempt:-1}, {state:'queued',attempt:'0'},
    {state:'queued',attempt:1.5},{state:'queued',attempt:Number.MAX_SAFE_INTEGER+1}])
    assert.equal(inspect(job,now,3).kind,'skip');
});
test('only the current unexpired runner/attempt can commit', () => {
  const leased={state:'running',claimedBy:'runner-a',attempt:2,leaseExpiresAt:tsValue(now+1)};
  assert.equal(owns(leased,'runner-a',2,now),true);
  assert.equal(owns({...leased,claimedBy:'runner-b'},'runner-a',2,now),false);
  assert.equal(owns({...leased,attempt:3},'runner-a',2,now),false);
  assert.equal(owns({...leased,state:'succeeded'},'runner-a',2,now),false);
  assert.equal(owns(leased,'',2,now),false);
  assert.equal(owns(leased,'runner-a',2,now+1),false);
  assert.equal(owns({...leased,leaseExpiresAt:null},'runner-a',2,now),false);
  assert.equal(owns(leased,'runner-a',2,Number.NaN),false);
});
test('runtime verifies claim, write, completion, stale cleanup and lease expiry', () => {
  const src=fs.readFileSync(new URL('../../../functions/src/job-runner.ts',import.meta.url),'utf8');
  for(const term of ["import { inspectFallbackJobLease, ownsFallbackJobLease }",'const claim = await db.runTransaction(',
    "if (claim.kind !== 'claimed') continue",'if (!ownsFallbackJobLease(current.data()',
    'const applied = await db.runTransaction(', 'if (!applied) continue',
    'attemptScopedPath(', 'touchedPaths.add(', 'if (!committed)', 'await file.delete({ ignoreNotFound: true })'])
    assert.ok(src.includes(term),'missing exact-claim runtime protection: '+term);
  assert.ok(!src.includes('const claimedJobData = (await jobRef.get()).data()!'));
});
