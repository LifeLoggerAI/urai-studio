import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import vm from 'node:vm';

// Execute exact checked-in function bodies with a synthetic transactional Admin
// double. No provider calls, customer media, cloud writes, or authorization bypass.
const ts = createRequire(new URL('../package.json', import.meta.url))('typescript');
const source = fs.readFileSync(new URL('../lib/studio-runtime-store.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('studio-runtime-store.ts', source, ts.ScriptTarget.Latest, true);
const required = ['createStudioProject', 'createStudioBrief', 'createStudioExport'];
const declarations = required.map(name => {
  const node = ast.statements.find(item => ts.isFunctionDeclaration(item) && item.name?.text === name);
  assert.ok(node?.body, 'canonical source function absent: ' + name);
  return node.getText(ast);
});
const js = ts.transpileModule(declarations.join('\n'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

const tenantId = 'owner-tenant', userId = 'owner-uid', projectId = 'project-1';
const project = { id: projectId, tenantId, userId };
const input = { tenantId, userId };
const key = (collection, id) => collection + '/' + id;

function runtime({ records = {}, failCommit = false } = {}) {
  const rows = new Map(Object.entries(records));
  let sequence = 0;
  let commits = 0;
  const ref = path => ({
    path,
    async create(value) {
      if (rows.has(path)) throw new Error('already-exists');
      rows.set(path, structuredClone(value));
    },
  });
  const db = {
    collection(c) { return { doc(id) { return ref(key(c, id)); } }; },
    async runTransaction(cb) {
      let writing = false;
      const pending = [];
      const tx = {
        async get(r) {
          assert.equal(writing, false, 'all security reads must precede writes');
          return { exists: rows.has(r.path), data: () => rows.get(r.path) };
        },
        create(r, value) {
          writing = true;
          pending.push([r.path, structuredClone(value)]);
        },
      };
      const outcome = await cb(tx);
      commits++;
      if (failCommit) throw new Error('synthetic_commit_failed');
      for (const [path] of pending) if (rows.has(path)) throw new Error('already-exists');
      for (const [path, value] of pending) rows.set(path, value);
      return outcome;
    },
  };
  const module = { exports: {} };
  const context = {
    module,
    exports: module.exports,
    adminDb: db,
    nowIso: () => '2026-11-07T12:00:00Z',
    newId: prefix => prefix + '-synthetic-' + ++sequence,
    cleanString: (v, fallback) => typeof v === 'string' && v.trim() ? v.trim() : fallback,
    defaultConsentRequirements: () => [{ purpose: 'generated_assets' }],
    // The existing focused persistence mock isolates project/brief/export behavior.
    // R866 separately tests the real transaction-bound authority function.
    assertStudioDraftAuthorityInTransaction: async () => {},
    DEFAULT_TENANT_ID: 'public-studio',
    DEFAULT_USER_ID: 'anonymous-studio-user',
    COLLECTIONS: {
      projects: 'studioProjects', briefs: 'studioBriefs',
      jobs: 'studioJobs', assets: 'studioAssets', exports: 'studioExports',
    },
  };
  vm.runInNewContext(js, context, { timeout: 1000 });
  return { ...module.exports, rows, get commits() { return commits; } };
}
const seeded = (more = {}) => ({ [key('studioProjects', projectId)]: project, ...more });

test('new project is create-only and owned', async () => {
  const rt = runtime();
  const result = await rt.createStudioProject({ ...input, id: projectId });
  assert.equal(result.ok, true);
  assert.equal(rt.rows.get(key('studioProjects', projectId)).userId, userId);
});
test('caller-selected project collision does not mutate original owner', async () => {
  const other = { ...project, userId: 'someone-else' };
  const rt = runtime({ records: { [key('studioProjects', projectId)]: other } });
  await assert.rejects(rt.createStudioProject({ ...input, id: projectId }), /already-exists/);
  assert.equal(rt.rows.get(key('studioProjects', projectId)).userId, 'someone-else');
});
test('invalid caller project ID denied before writes', async () => {
  const rt = runtime();
  const result = await rt.createStudioProject({ ...input, id: '../foreign' });
  assert.equal(result.ok, false);
  assert.equal(rt.rows.size, 0);
});
test('owner project allows standalone brief with exact scope', async () => {
  const rt = runtime({ records: seeded() });
  const result = await rt.createStudioBrief({ ...input, projectId, prompt: 'synthetic' });
  assert.equal(result.ok, true);
  assert.equal(rt.rows.get(key('studioBriefs', result.data.id)).projectId, projectId);
  assert.equal(rt.commits, 1);
});
test('foreign and missing projects deny standalone briefs without writes', async () => {
  for (const records of [{}, seeded({ [key('studioProjects', projectId)]: { ...project, userId: 'foreign' } })]) {
    const rt = runtime({ records });
    const result = await rt.createStudioBrief({ ...input, projectId });
    assert.equal(result.ok, false);
    assert.equal(result.error, 'studio_reference_unavailable');
    assert.equal(rt.rows.size, Object.keys(records).length);
  }
});
test('brief transaction failure leaves no brief', async () => {
  const rt = runtime({ records: seeded(), failCommit: true });
  await assert.rejects(rt.createStudioBrief({ ...input, projectId }), /synthetic_commit_failed/);
  assert.equal(rt.rows.size, 1);
});
test('owner can create draft export without pretending media is ready', async () => {
  const rt = runtime({ records: seeded() });
  const result = await rt.createStudioExport({ ...input, projectId, kind: 'mp4' });
  assert.equal(result.ok, true);
  assert.equal(result.data.status, 'draft');
  assert.equal(result.data.downloadUrl, undefined);
  assert.equal(rt.rows.size, 2);
});
test('foreign or missing export project denied without writes', async () => {
  for (const records of [{}, seeded({ [key('studioProjects', projectId)]: { ...project, tenantId: 'other' } })]) {
    const rt = runtime({ records });
    const result = await rt.createStudioExport({ ...input, projectId, kind: 'mp4' });
    assert.equal(result.ok, false);
    assert.equal(rt.rows.size, Object.keys(records).length);
  }
});
test('referenced job must be owned and belong to same project', async () => {
  const rt = runtime({ records: seeded({ [key('studioJobs', 'job-1')]: { ...input, projectId: 'unrelated' } }) });
  const result = await rt.createStudioExport({ ...input, projectId, jobId: 'job-1', kind: 'json' });
  assert.equal(result.ok, false);
  assert.equal(rt.rows.size, 2);
});
test('referenced assets must belong to same owner and project', async () => {
  const rt = runtime({ records: seeded({ [key('studioAssets', 'asset-1')]: { ...input, projectId: 'foreign' } }) });
  const result = await rt.createStudioExport({ ...input, projectId, assetIds: ['asset-1'], kind: 'mp4' });
  assert.equal(result.ok, false);
  assert.equal(rt.rows.size, 2);
});
test('owned job and assets permit a single draft export', async () => {
  const rt = runtime({ records: seeded({
    [key('studioJobs', 'job-1')]: { ...input, projectId },
    [key('studioAssets', 'asset-1')]: { ...input, projectId },
  }) });
  const result = await rt.createStudioExport({ ...input, projectId, jobId: 'job-1', assetIds: ['asset-1'], kind: 'json' });
  assert.equal(result.ok, true);
  assert.equal(rt.rows.size, 4);
  assert.equal(rt.commits, 1);
});
test('duplicate, malformed and oversized asset IDs fail without reads or writes', async () => {
  const bad = [['asset-1', 'asset-1'], ['../bad'], Array.from({ length: 26 }, (_, i) => 'a-' + i)];
  for (const assetIds of bad) {
    const rt = runtime({ records: seeded() });
    const result = await rt.createStudioExport({ ...input, projectId, kind: 'mp4', assetIds });
    assert.equal(result.ok, false);
    assert.equal(rt.commits, 0);
    assert.equal(rt.rows.size, 1);
  }
});
test('commit failure leaves no export', async () => {
  const rt = runtime({ records: seeded(), failCommit: true });
  await assert.rejects(rt.createStudioExport({ ...input, projectId, kind: 'json' }), /synthetic_commit_failed/);
  assert.equal(rt.rows.size, 1);
});
