import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { createHash } from 'node:crypto';

// These tests execute the checked-in production TypeScript helper and job
// function, using a disposable serializable Admin transaction double.
// This is not Firebase emulator or private media acceptance.
const require = createRequire(new URL('../package.json', import.meta.url));
const ts = require('typescript');
function loadTs(text, bindings = {}) {
  const compiled = ts.transpileModule(text, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports, require(name) {
      if (name === 'node:crypto') return { createHash };
      throw Error('unexpected module ' + name);
    }, ...bindings,
  }, { timeout: 1000 });
  return module.exports;
}
const helper = loadTs(fs.readFileSync(new URL('../lib/studio-draft-idempotency.ts', import.meta.url), 'utf8'));
const source = fs.readFileSync(new URL('../lib/studio-runtime-store.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('studio-runtime-store.ts', source, ts.ScriptTarget.Latest, true);
const fn = ast.statements.find(node =>
  ts.isFunctionDeclaration(node) && node.name?.text === 'createStudioJob');
assert.ok(fn?.body, 'canonical draft store function must exist');
const jobSource = fn.getText(ast);

function createRuntime({ authorized = true, commitFailure = false, seed = {} } = {}) {
  const rows = new Map(Object.entries(seed));
  let seq = 0;
  let commits = 0;
  let authAllowed = authorized;
  let failCommit = commitFailure;
  let chain = Promise.resolve();
  const db = {
    collection(name) {
      return { doc(id) { return { path: name + '/' + id }; } };
    },
    // Serial transaction double used for deterministic race coverage only.
    runTransaction(work) {
      const execute = async () => {
        let wrote = false;
        const pending = [];
        const transaction = {
          async get(ref) {
            assert.equal(wrote, false, 'transaction reads must precede writes');
            return { exists: rows.has(ref.path), data: () => structuredClone(rows.get(ref.path)) };
          },
          create(ref, data) {
            wrote = true;
            pending.push([ref.path, structuredClone(data)]);
          },
        };
        const result = await work(transaction);
        if (failCommit) throw Error('synthetic_commit_failure');
        for (const [path] of pending) {
          if (rows.has(path)) throw Error('already_exists');
        }
        for (const [path, data] of pending) rows.set(path, data);
        commits++;
        return result;
      };
      const result = chain.then(execute);
      chain = result.then(() => {}, () => {});
      return result;
    },
  };
  const bindings = {
    adminDb: db,
    nowIso: () => '2026-11-07T14:24:00-06:00',
    newId: prefix => prefix + '_synthetic_' + (++seq),
    cleanString: (v, fallback) => typeof v === 'string' && v.trim() ? v.trim() : fallback,
    DEFAULT_TENANT_ID: 'local-test', DEFAULT_USER_ID: 'local-test-user',
    COLLECTIONS: { projects: 'studioProjects', briefs: 'studioBriefs', jobs: 'studioJobs' },
    defaultConsentRequirements: () => [{ purpose: 'generated_assets' }],
    deriveStudioDraftReceipt: helper.deriveStudioDraftReceipt,
    async assertStudioDraftAuthorityInTransaction(transaction) {
      if (!authAllowed) throw Error('studio_current_membership_required');
      // Simulated auth dependency; not a substitute for actual R866 test.
      await transaction.get({ path: 'studioUsers/authorized-fixture' });
    },
  };
  const job = loadTs(jobSource, bindings).createStudioJob;
  return {
    create: job, rows, get commits() { return commits; },
    revoke() { authAllowed = false; },
    restore() { authAllowed = true; },
    setCommitFailure(value) { failCommit = value; },
  };
}
const key = 'synthetic-key-retry-0001';
const base = { tenantId: 'tenant-a', userId: 'user-a', prompt: 'Synthetic movie draft',
  kind: 'clip_render', requestedExports: ['mp4', 'srt'], idempotencyKey: key };

test('valid key accepted; malformed, short, header-smuggling keys denied', () => {
  assert.equal(helper.validStudioDraftKey(key), true);
  for (const invalid of ['', 'tiny', '../danger', 'abc\nx', 'a'.repeat(129), 'a b', null, 123]) {
    assert.equal(helper.validStudioDraftKey(invalid), false);
  }
});
test('same actor, key and payload creates one job, project, brief even after lost response', async () => {
  const r = createRuntime();
  const first = await r.create(base);
  const retry = await r.create(base);
  assert.equal(first.ok, true);
  assert.equal(first.replayed, false);
  assert.equal(retry.ok, true);
  assert.equal(retry.replayed, true);
  assert.equal(retry.data.id, first.data.id);
  assert.equal(retry.data.projectId, first.data.projectId);
  assert.equal(retry.data.briefId, first.data.briefId);
  assert.equal(r.commits, 2);
  assert.equal(r.rows.size, 3);
  assert.equal(first.data.status, 'draft');
  assert.deepEqual(Array.from(first.data.outputAssetIds), []);
});
test('same key with changed prompt rejects without writes', async () => {
  const r = createRuntime(); await r.create(base);
  const result = await r.create({ ...base, prompt: 'Changed synthetic movie' });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'studio_idempotency_conflict');
  assert.equal(r.rows.size, 3);
});
test('same key with changed requested exports or source project rejects', async () => {
  const r = createRuntime(); await r.create(base);
  for (const input of [
    { ...base, requestedExports: ['json'] },
    { ...base, projectId: 'project-different' },
    { ...base, kind: 'different_kind' },
  ]) {
    const result = await r.create(input);
    assert.equal(result.ok, false);
    assert.equal(result.error, 'studio_idempotency_conflict');
  }
  assert.equal(r.rows.size, 3);
});
test('same key cannot collapse different tenants or owners', async () => {
  const r = createRuntime();
  const a = await r.create(base);
  const b = await r.create({ ...base, userId: 'other-user' });
  const c = await r.create({ ...base, tenantId: 'other-tenant' });
  assert.notEqual(a.data.id, b.data.id);
  assert.notEqual(a.data.id, c.data.id);
  assert.notEqual(b.data.id, c.data.id);
  assert.equal(r.rows.size, 9);
});
test('concurrent identical requests use one committed job', async () => {
  const r = createRuntime();
  const [a, b, c] = await Promise.all([r.create(base), r.create(base), r.create(base)]);
  assert.equal(a.data.id, b.data.id);
  assert.equal(b.data.id, c.data.id);
  assert.deepEqual([a.replayed, b.replayed, c.replayed], [false, true, true]);
  assert.equal(r.rows.size, 3);
});
test('failed original transaction leaves nothing; retry succeeds', async () => {
  const r = createRuntime({ commitFailure: true });
  await assert.rejects(r.create(base), /synthetic_commit_failure/);
  assert.equal(r.rows.size, 0);
  r.setCommitFailure(false);
  const retried = await r.create(base);
  assert.equal(retried.replayed, false);
  assert.equal(r.rows.size, 3);
});
test('replay is forbidden after current member revocation', async () => {
  const r = createRuntime(); await r.create(base); r.revoke();
  await assert.rejects(r.create(base), /studio_current_membership_required/);
  assert.equal(r.rows.size, 3);
});
test('existing digest-less job under deterministic key is rejected, not silently replayed', async () => {
  const identity = helper.deriveStudioDraftReceipt({ ...base, key });
  const r = createRuntime({ seed: {
    ['studioJobs/' + identity.jobId]: { id: identity.jobId, tenantId: base.tenantId,
      userId: base.userId, status: 'draft', provider: 'feature-gated', model: 'contract-only' },
  } });
  const result = await r.create(base);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'studio_idempotency_conflict');
  assert.equal(r.rows.size, 1);
});
test('replay fails after the linked project is removed', async () => {
  const r = createRuntime();
  const first = await r.create(base);
  r.rows.delete('studioProjects/' + first.data.projectId);
  const result = await r.create(base);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'studio_idempotency_conflict');
  assert.equal(r.rows.size, 2);
});
test('replay fails when the original brief changes owner', async () => {
  const r = createRuntime();
  const first = await r.create(base);
  const path = 'studioBriefs/' + first.data.briefId;
  r.rows.set(path, { ...r.rows.get(path), userId: 'other-owner' });
  const result = await r.create(base);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'studio_idempotency_conflict');
  assert.equal(r.rows.size, 3);
});

test('raw key is not stored in draft document', async () => {
  const r = createRuntime(); const result = await r.create(base);
  const stored = r.rows.get('studioJobs/' + result.data.id);
  assert.ok(/^[a-f0-9]{64}$/.test(stored.idempotencyKeyDigest));
  assert.ok(/^[a-f0-9]{64}$/.test(stored.idempotencyRequestDigest));
  assert.ok(!JSON.stringify(stored).includes(key));
});
test('legacy internal no-key caller remains explicitly non-idempotent', async () => {
  const r = createRuntime();
  const input = { ...base }; delete input.idempotencyKey;
  const first = await r.create(input);
  const second = await r.create(input);
  assert.notEqual(first.data.id, second.data.id);
  assert.equal(second.replayed, false);
});
test('routes and Replay Teaser UI preserve key, conflict, and no-render semantics', () => {
  const jobs = fs.readFileSync(new URL('../app/api/studio/jobs/route.ts', import.meta.url), 'utf8');
  const video = fs.readFileSync(new URL('../app/api/studio/video-factory/route.ts', import.meta.url), 'utf8');
  const ui = fs.readFileSync(new URL('../app/studio/video-factory/QueueReplayTeaserButton.tsx', import.meta.url), 'utf8');
  for (const route of [jobs, video]) {
    assert.match(route, /validStudioDraftKey\(idempotencyKey\)/);
    assert.match(route, /idempotencyKey,/);
    assert.match(route, /studio_idempotency_conflict/);
    assert.match(route, /replayed: result\.replayed === true/);
    assert.match(route, /status: 'draft'/);
  }
  assert.match(ui, /pendingDraft\.current/);
  assert.match(ui, /x-urai-studio-idempotency-key/);
  assert.match(ui, /crypto\.randomUUID\(\)/);
});
