import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { test } from 'node:test';

const require = createRequire(new URL('../package.json', import.meta.url));
const ts = require('typescript');
const source = readFileSync(new URL('../lib/studio-runtime-store.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('studio-runtime-store.ts', source, ts.ScriptTarget.Latest, true);
const fn = ast.statements.find(s => ts.isFunctionDeclaration(s) && s.name?.text === 'createStudioExport');
assert.ok(fn?.body, 'real source createStudioExport must be present');
const compiled = ts.transpileModule(fn.getText(ast), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const helperSource = readFileSync(new URL('../lib/studio-draft-idempotency.ts', import.meta.url), 'utf8');
const helperCompiled = ts.transpileModule(helperSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function execute(js, globals) {
  const module = { exports: {} };
  vm.runInNewContext(js, {
    module, exports: module.exports, ...globals,
    require(name) {
      if (name === 'node:crypto') return { createHash };
      throw Error('unexpected module ' + name);
    },
  }, { timeout: 1000 });
  return module.exports;
}
const helper = execute(helperCompiled, {});
const tenantId = 'tenant-a', userId = 'owner-a', projectId = 'project-a';
const key = 'R868_export_retry_123456';
const base = { tenantId, userId, projectId, kind: 'json', idempotencyKey: key };
const project = { tenantId, userId, projectId };
const seeded = () => ({ ['studioProjects/' + projectId]: project });

function runtime({ seed = seeded(), failCommit = false, allowed = true } = {}) {
  const rows = new Map(Object.entries(seed));
  let writes = 0;
  let seq = 0;
  let blocked = !allowed;
  let fail = failCommit;
  let pendingChain = Promise.resolve();
  const db = {
    collection(name) { return { doc(id) { return { path: name + '/' + id }; } }; },
    runTransaction(work) {
      const next = pendingChain.then(async () => {
        const pending = [];
        let writing = false;
        const transaction = {
          async get(ref) {
            assert.equal(writing, false, 'all reads must precede writes');
            return { exists: rows.has(ref.path), data: () => structuredClone(rows.get(ref.path)) };
          },
          create(ref, value) {
            writing = true;
            pending.push([ref.path, structuredClone(value)]);
          },
        };
        const receipt = await work(transaction);
        if (fail) throw Error('synthetic_commit_failure');
        for (const [path] of pending) if (rows.has(path)) throw Error('already_exists');
        for (const [path, value] of pending) { rows.set(path, value); writes++; }
        return receipt;
      });
      pendingChain = next.then(() => {}, () => {});
      return next;
    },
  };
  const fn = execute(compiled, {
    adminDb: db, newId: prefix => prefix + '_synthetic_' + (++seq),
    nowIso: () => '2026-11-07T12:00:00Z',
    cleanString: (v, fallback) => typeof v === 'string' && v.trim() ? v.trim() : fallback,
    DEFAULT_TENANT_ID: 'public-studio', DEFAULT_USER_ID: 'anonymous-studio-user',
    COLLECTIONS: { projects: 'studioProjects', briefs: 'studioBriefs',
      jobs: 'studioJobs', assets: 'studioAssets', exports: 'studioExports' },
    deriveStudioExportReceipt: helper.deriveStudioExportReceipt,
    async assertStudioDraftAuthorityInTransaction(transaction) {
      if (blocked) throw Error('studio_current_membership_required');
      await transaction.get({ path: 'studioUsers/synthetic' });
    },
  }).createStudioExport;
  return {
    create: fn, rows, get writes() { return writes; },
    revoke() { blocked = true; }, fail(value) { fail = value; },
  };
}
test('same export request returns same persisted draft after lost acknowledgement', async () => {
  const rt = runtime();
  const first = await rt.create(base);
  const again = await rt.create(base);
  assert.equal(first.ok, true);
  assert.equal(first.replayed, false);
  assert.equal(again.ok, true);
  assert.equal(again.replayed, true);
  assert.equal(again.data.id, first.data.id);
  assert.equal(rt.writes, 1);
  assert.equal(rt.rows.size, 2);
  assert.equal(again.data.status, 'draft');
  assert.equal(again.data.downloadUrl, undefined);
});
test('concurrent identical exports yield one stored draft', async () => {
  const rt = runtime();
  const results = await Promise.all([rt.create(base), rt.create(base), rt.create(base)]);
  assert.equal(new Set(results.map(x => x.data.id)).size, 1);
  assert.equal(results.filter(x => x.replayed).length, 2);
  assert.equal(rt.writes, 1);
});
test('key collision with changed output kind is denied', async () => {
  const rt = runtime(); await rt.create(base);
  const result = await rt.create({ ...base, kind: 'mp4' });
  assert.equal(result.error, 'studio_idempotency_conflict');
  assert.equal(rt.writes, 1);
});
test('key collision with changed job or assets is denied', async () => {
  const rt = runtime(); await rt.create(base);
  for (const changed of [
    { ...base, jobId: 'other-job' },
    { ...base, assetIds: ['other-asset'] },
    { ...base, projectId: 'other-project' },
  ]) {
    const result = await rt.create(changed);
    assert.equal(result.error, 'studio_idempotency_conflict');
  }
  assert.equal(rt.writes, 1);
});
test('other tenant or owner cannot reuse same deterministic ID', async () => {
  const rt = runtime({ seed: {
    ...seeded(), ['studioProjects/other-project']: { tenantId: 'other', userId, projectId: 'other-project' },
  } });
  const first = helper.deriveStudioExportReceipt({ ...base });
  const other = helper.deriveStudioExportReceipt({ ...base, userId: 'different' });
  const otherTenant = helper.deriveStudioExportReceipt({ ...base, tenantId: 'other' });
  assert.notEqual(first.exportId, other.exportId);
  assert.notEqual(first.exportId, otherTenant.exportId);
  assert.notEqual(other.exportId, otherTenant.exportId);
  await rt.create(base);
  assert.equal(rt.writes, 1);
});
test('replay refuses ownership change of project', async () => {
  const rt = runtime(); await rt.create(base);
  rt.rows.set('studioProjects/' + projectId, { ...project, userId: 'foreign' });
  const result = await rt.create(base);
  assert.equal(result.error, 'studio_reference_unavailable');
  assert.equal(rt.writes, 1);
});
test('replay refuses deleted or foreign referenced job', async () => {
  const j = { tenantId, userId, projectId };
  const rt = runtime({ seed: { ...seeded(), ['studioJobs/j1']: j } });
  await rt.create({ ...base, jobId: 'j1' });
  rt.rows.delete('studioJobs/j1');
  const result = await rt.create({ ...base, jobId: 'j1' });
  assert.equal(result.error, 'studio_reference_unavailable');
  assert.equal(rt.writes, 1);
});
test('replay refuses altered referenced asset', async () => {
  const rt = runtime({ seed: {
    ...seeded(), ['studioAssets/a1']: { tenantId, userId, projectId },
  } });
  await rt.create({ ...base, assetIds: ['a1'] });
  rt.rows.set('studioAssets/a1', { tenantId, userId: 'other', projectId });
  const result = await rt.create({ ...base, assetIds: ['a1'] });
  assert.equal(result.error, 'studio_reference_unavailable');
  assert.equal(rt.writes, 1);
});
test('failed commit leaves no export; same-key retry creates one', async () => {
  const rt = runtime({ failCommit: true });
  await assert.rejects(rt.create(base), /synthetic_commit_failure/);
  assert.equal(rt.writes, 0);
  rt.fail(false);
  const result = await rt.create(base);
  assert.equal(result.replayed, false);
  assert.equal(rt.writes, 1);
});
test('revoked membership denies existing receipt replay', async () => {
  const rt = runtime(); await rt.create(base); rt.revoke();
  await assert.rejects(rt.create(base), /studio_current_membership_required/);
  assert.equal(rt.writes, 1);
});
test('no raw idempotency key stored, no generated media', async () => {
  const rt = runtime(); const r = await rt.create(base);
  const stored = rt.rows.get('studioExports/' + r.data.id);
  assert.ok(/^[a-f0-9]{64}$/.test(stored.idempotencyKeyDigest));
  assert.ok(/^[a-f0-9]{64}$/.test(stored.idempotencyRequestDigest));
  assert.equal(JSON.stringify(stored).includes(key), false);
  assert.equal(stored.downloadUrl, undefined);
  assert.equal(stored.storagePath, undefined);
});
test('export receipt namespace does not overlap job draft keys', () => {
  const input = { tenantId, userId, key, projectId, kind: 'json', assetIds: [] };
  assert.notEqual(helper.deriveStudioExportReceipt(input).exportId,
    helper.deriveStudioDraftReceipt({
      ...input, prompt: 'Synthetic', requestedExports: ['json'],
    }).jobId);
});
test('public export route requires key, rechecks authority and returns replay/409', () => {
  const route = readFileSync(new URL('../app/api/studio/exports/route.ts', import.meta.url), 'utf8');
  assert.match(route, /validStudioDraftKey\(idempotencyKey\)/);
  assert.match(route, /refreshStudioMemberAuth\(req, auth, 'draft'\)/);
  assert.match(route, /idempotencyKey,/);
  assert.match(route, /studio_idempotency_conflict/);
  assert.match(route, /replayed: result\.replayed === true/);
  assert.match(route, /status: 'draft'/);
});
