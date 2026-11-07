import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import vm from 'node:vm';

// R862: run the exact checked-in TypeScript function against a synthetic
// Firestore transaction. This does not substitute for real Firebase emulators.
const ts = createRequire(new URL('../package.json', import.meta.url))('typescript');
const src = fs.readFileSync(new URL('../lib/studio-runtime-store.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('studio-runtime-store.ts', src, ts.ScriptTarget.Latest, true);
const declaration = ast.statements.find(node =>
  ts.isFunctionDeclaration(node) && node.name?.text === 'createStudioJob');
assert.ok(declaration?.body, 'missing canonical createStudioJob');
const compiled = ts.transpileModule(declaration.getText(ast), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function runtime({ seed = {}, failCommit = false, withAdmin = true } = {}) {
  const rows = new Map(Object.entries(seed));
  let commits = 0;
  let sequence = 0;
  const db = {
    collection(name) {
      return { doc(id) { return { path: name + '/' + id }; } };
    },
    async runTransaction(callback) {
      const pending = [];
      let readsFinished = false;
      const tx = {
        async get(ref) {
          assert.equal(readsFinished, false, 'reads must precede writes');
          return { exists: rows.has(ref.path), data: () => structuredClone(rows.get(ref.path)) };
        },
        create(ref, value) {
          readsFinished = true;
          pending.push([ref.path, structuredClone(value)]);
        },
      };
      const result = await callback(tx);
      commits++;
      if (failCommit) throw new Error('synthetic_transaction_failure');
      for (const [path] of pending) {
        if (rows.has(path)) throw Error('already_exists');
      }
      for (const [path, value] of pending) rows.set(path, value);
      return result;
    },
  };
  const module = { exports: {} };
  const context = {
    module, exports: module.exports, adminDb: withAdmin ? db : null,
    nowIso: () => '2026-11-07T08:00:00Z',
    newId: prefix => prefix + '_synthetic_' + (++sequence),
    cleanString: (value, fallback) => typeof value === 'string' && value.trim() ? value.trim() : fallback,
    DEFAULT_TENANT_ID: 'public-studio', DEFAULT_USER_ID: 'anonymous-studio-user',
    COLLECTIONS: { projects: 'studioProjects', jobs: 'studioJobs', briefs: 'studioBriefs' },
    defaultConsentRequirements: () => [{ purpose: 'generated_assets' }],
  };
  vm.runInNewContext(compiled, context, { timeout: 1000 });
  return { create: module.exports.createStudioJob, rows, get commits() { return commits; } };
}
const tenant = 'tenant-a', owner = 'owner-a', projectId = 'project-a';
const ownedProject = { id: projectId, tenantId: tenant, userId: owner };
const input = { tenantId: tenant, userId: owner, projectId };

test('owner project and prompt brief create one draft transaction', async () => {
  const rt = runtime({ seed: { ['studioProjects/' + projectId]: ownedProject } });
  const r = await rt.create({ ...input, prompt: 'Synthetic film', requestedExports: ['mp4', 'srt'] });
  assert.equal(r.ok, true);
  assert.equal(r.data.status, 'draft');
  assert.equal(r.data.provider, 'feature-gated');
  assert.equal(rt.commits, 1);
  const brief = rt.rows.get('studioBriefs/' + r.data.briefId);
  assert.equal(brief.projectId, projectId);
  assert.equal(brief.tenantId, tenant);
  assert.equal(brief.userId, owner);
  assert.deepEqual(Array.from(brief.requestedExports), ['mp4', 'srt']);
  assert.equal(rt.rows.size, 3);
});

test('implicit project is owner scoped and atomically created', async () => {
  const rt = runtime();
  const r = await rt.create({ tenantId: tenant, userId: owner, prompt: 'Synthetic film' });
  const project = rt.rows.get('studioProjects/' + r.data.projectId);
  assert.equal(project?.tenantId, tenant);
  assert.equal(project?.userId, owner);
  assert.ok(rt.rows.has('studioBriefs/' + r.data.briefId));
  assert.ok(rt.rows.has('studioJobs/' + r.data.id));
  assert.equal(rt.rows.size, 3);
});

test('unknown project is rejected without creating job or brief', async () => {
  const rt = runtime();
  await assert.rejects(rt.create({ ...input, prompt: 'No project' }), /studio_project_not_found/);
  assert.equal(rt.rows.size, 0);
  assert.equal(rt.commits, 0);
});

for (const variant of [
  { tenantId: 'other-tenant', userId: owner },
  { tenantId: tenant, userId: 'other-owner' },
]) {
  test('foreign project is denied for ' + JSON.stringify(variant), async () => {
    const rt = runtime({ seed: { ['studioProjects/' + projectId]: { ...ownedProject, ...variant } } });
    await assert.rejects(rt.create({ ...input, prompt: 'Forged project' }), /studio_project_forbidden/);
    assert.equal(rt.rows.size, 1);
    assert.equal(rt.commits, 0);
  });
}

test('matching existing brief is accepted without new brief write', async () => {
  const briefId = 'brief-existing';
  const rt = runtime({ seed: {
    ['studioProjects/' + projectId]: ownedProject,
    ['studioBriefs/' + briefId]: { projectId, tenantId: tenant, userId: owner },
  } });
  const r = await rt.create({ ...input, briefId });
  assert.equal(r.data.briefId, briefId);
  assert.equal(rt.rows.size, 3);
  assert.equal(rt.commits, 1);
});

test('foreign, wrong-project or missing brief denied with no writes', async () => {
  for (const bad of [
    undefined,
    { projectId, tenantId: 'foreign', userId: owner },
    { projectId: 'other-project', tenantId: tenant, userId: owner },
    { projectId, tenantId: tenant, userId: 'foreign' },
  ]) {
    const briefId = 'brief-requested';
    const seed = { ['studioProjects/' + projectId]: ownedProject };
    if (bad) seed['studioBriefs/' + briefId] = bad;
    const rt = runtime({ seed });
    await assert.rejects(rt.create({ ...input, briefId }),
      /studio_brief_(not_found|forbidden)/);
    assert.equal(rt.rows.size, Object.keys(seed).length);
  }
});

test('transaction failure creates neither job, project nor prompt brief', async () => {
  const rt = runtime({ failCommit: true });
  await assert.rejects(rt.create({ tenantId: tenant, userId: owner, prompt: 'Test failure' }),
    /synthetic_transaction_failure/);
  assert.equal(rt.rows.size, 0);
  assert.equal(rt.commits, 1);
});

test('unconfigured Admin refuses writes', async () => {
  const rt = runtime({ withAdmin: false });
  const r = await rt.create({ ...input, prompt: 'Synthetic' });
  assert.equal(r.ok, false);
  assert.equal(r.error, 'firebase_admin_unconfigured');
  assert.equal(rt.rows.size, 0);
});

test('new prompt owns linked brief instead of caller supplied brief id', async () => {
  const rt = runtime({ seed: { ['studioProjects/' + projectId]: ownedProject } });
  const r = await rt.create({ ...input, briefId: 'old', prompt: 'New synthetic prompt' });
  assert.notEqual(r.data.briefId, 'old');
  assert.ok(rt.rows.has('studioBriefs/' + r.data.briefId));
});

test('no private output or fabricated rendered media is recorded', async () => {
  const rt = runtime({ seed: { ['studioProjects/' + projectId]: ownedProject } });
  const r = await rt.create({ ...input, prompt: 'Synthetic only' });
  assert.equal(r.data.status, 'draft');
  assert.equal(r.data.model, 'contract-only');
  assert.deepEqual(Array.from(r.data.outputAssetIds), []);
  assert.deepEqual(Array.from(r.data.inputAssetIds), []);
});
