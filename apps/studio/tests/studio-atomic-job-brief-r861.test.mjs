import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import vm from 'node:vm';

// R861: execute the exact checked-in createStudioJob TypeScript function with a
// synthetic atomic Admin batch. This is NOT a Firebase emulator or private render.
const ts = createRequire(new URL('../package.json', import.meta.url))('typescript');
const src = fs.readFileSync(new URL('../lib/studio-runtime-store.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('studio-runtime-store.ts', src, ts.ScriptTarget.Latest, true);
const declaration = ast.statements.find(node =>
  ts.isFunctionDeclaration(node) && node.name?.text === 'createStudioJob');
assert.ok(declaration?.body, 'missing canonical createStudioJob function');
const compiled = ts.transpileModule(declaration.getText(ast), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function runtime({ failCommit = false, withAdmin = true } = {}) {
  const rows = new Map();
  let commitCount = 0;
  let seq = 0;
  const adminDb = {
    collection(name) {
      return { doc(id) { return { path: name + '/' + id }; } };
    },
    batch() {
      const pending = [];
      return {
        create(ref, value) {
          pending.push([ref.path, structuredClone(value)]);
          return this;
        },
        async commit() {
          commitCount++;
          if (failCommit) throw new Error('synthetic_batch_failure');
          for (const [path, value] of pending) rows.set(path, value);
        },
      };
    },
  };
  const sharedExports = {};
  const ctx = {
    module: { exports: sharedExports },
    exports: sharedExports,
    adminDb: withAdmin ? adminDb : null,
    nowIso: () => '2026-11-07T08:00:00Z',
    newId: prefix => prefix + '_synthetic_' + (++seq),
    cleanString: (value, fallback) =>
      typeof value === 'string' && value.trim() ? value.trim() : fallback,
    DEFAULT_TENANT_ID: 'public-studio',
    DEFAULT_USER_ID: 'anonymous-studio-user',
    COLLECTIONS: { jobs: 'studioJobs', briefs: 'studioBriefs' },
    defaultConsentRequirements: () => [{ purpose: 'generated_assets' }],
    structuredClone,
  };
  vm.runInNewContext(compiled, ctx, { timeout: 1000 });
  assert.equal(typeof sharedExports.createStudioJob, 'function');
  return {
    create: sharedExports.createStudioJob,
    rows,
    get commits() { return commitCount; },
  };
}

test('with prompt, job and linked brief commit in one atomic batch', async () => {
  const rt = runtime();
  const result = await rt.create({
    tenantId: 'synthetic-tenant',
    userId: 'synthetic-owner',
    projectId: 'synthetic-project',
    prompt: 'Synthetic movie storyboard',
    requestedExports: ['mp4', 'srt'],
  });
  assert.equal(result.ok, true);
  assert.equal(result.data.status, 'draft');
  assert.equal(result.data.provider, 'feature-gated');
  assert.equal(result.data.model, 'contract-only');
  assert.equal(rt.commits, 1);
  assert.equal(rt.rows.size, 2);
  const job = rt.rows.get('studioJobs/' + result.data.id);
  const brief = rt.rows.get('studioBriefs/' + job.briefId);
  assert.ok(brief);
  assert.equal(brief.projectId, job.projectId);
  assert.equal(brief.tenantId, job.tenantId);
  assert.equal(brief.userId, job.userId);
  assert.equal(brief.prompt, 'Synthetic movie storyboard');
  assert.deepEqual(Array.from(brief.requestedExports), ['mp4', 'srt']);
});

test('without prompt, only job is stored with supplied briefId', async () => {
  const rt = runtime();
  const result = await rt.create({ briefId: 'preexisting', projectId: 'synthetic-project' });
  assert.equal(result.ok, true);
  assert.equal(result.data.briefId, 'preexisting');
  assert.equal(rt.rows.size, 1);
  assert.equal(rt.commits, 1);
});

test('failed atomic commit creates neither a job nor brief', async () => {
  const rt = runtime({ failCommit: true });
  await assert.rejects(rt.create({ prompt: 'will fail' }), /synthetic_batch_failure/);
  assert.equal(rt.rows.size, 0);
  assert.equal(rt.commits, 1);
});

test('without Admin, no write or success is possible', async () => {
  const rt = runtime({ withAdmin: false });
  const result = await rt.create({ prompt: 'cannot persist' });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'firebase_admin_unconfigured');
  assert.equal(rt.commits, 0);
  assert.equal(rt.rows.size, 0);
});

test('draft has no verified media or output references', async () => {
  const rt = runtime();
  const result = await rt.create({ prompt: 'synthetic scene' });
  assert.equal(result.data.status, 'draft');
  assert.deepEqual(Array.from(result.data.inputAssetIds), []);
  assert.deepEqual(Array.from(result.data.outputAssetIds), []);
  assert.deepEqual(Array.from(result.data.requestedExportIds), []);
});

test('prompt takes precedence over a supplied existing brief reference', async () => {
  // Existing behavior wrote an unlinked prompt brief; R861 links the newly
  // recorded prompt instead. This change needs API compatibility review.
  const rt = runtime();
  const result = await rt.create({ briefId: 'old', prompt: 'new prompt' });
  assert.notEqual(result.data.briefId, 'old');
  assert.ok(rt.rows.has('studioBriefs/' + result.data.briefId));
});
