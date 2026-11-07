import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const store = source('../lib/studio-runtime-store.ts');
const jobs = source('../app/api/studio/jobs/route.ts');
const video = source('../app/api/studio/video-factory/route.ts');
const exportsRoute = source('../app/api/studio/exports/route.ts');
const ui = source('../app/studio/video-factory/QueueReplayTeaserButton.tsx');
const functions = source('../../../functions/src/index.ts');
const packageJson = JSON.parse(source('../../../functions/package.json'));
const tsConfig = JSON.parse(source('../../../functions/tsconfig.json'));

test('contract-only execution receipt never claims worker/media/consent authorization', () => {
  assert.match(store, /export const STUDIO_CONTRACT_EXECUTION = Object\.freeze\(/);
  for (const field of ['workerDispatched', 'outputVerified', 'mediaRendered', 'privateRenderConsentAuthorized']) {
    assert.match(store, new RegExp(field + ': false'), field + ' must be false');
  }
  assert.match(store, /mode: 'contract-only'/);
  assert.match(store, /execution: STUDIO_CONTRACT_EXECUTION/);
});

test('persisted Studio generation and export records are draft, not fabricated jobs', () => {
  assert.match(store, /status: 'draft',\s*provider: 'feature-gated'/);
  assert.match(store, /model: 'contract-only'/);
  assert.match(store, /status: 'draft' satisfies StudioJobStatus/);
  assert.match(store, /downloadUrl: undefined/);
});

for (const [name, file] of [['Studio jobs', jobs], ['Video Factory', video], ['Studio exports', exportsRoute]]) {
  test(name + ' POST reports saved draft with unexecuted receipt', () => {
    assert.match(file, /status: 'draft'/);
    assert.match(file, /persisted: true/);
    assert.match(file, /execution: runtimeStoreStatus\(\)\.execution/);
    assert.doesNotMatch(file, /status: 'queued',\s*persisted: true/);
  });
}

test('Replay Teaser UI requires draft receipt and explicit no-render evidence', () => {
  assert.match(ui, /payload\.status !== 'draft'/);
  assert.match(ui, /data\.status !== 'draft'/);
  assert.match(ui, /execution\.mode !== 'contract-only'/);
  for (const field of ['workerDispatched', 'outputVerified', 'mediaRendered', 'privateRenderConsentAuthorized']) {
    assert.ok(ui.includes('execution.' + field + ' !== false'), 'UI must require ' + field + ' denial');
  }
  assert.match(ui, /No renderer or provider was dispatched/);
  assert.doesNotMatch(ui, /setState\('queued'\)/);
});

test('original Functions build excludes the historical dummy studioJobs worker', () => {
  assert.equal(packageJson.main, 'lib/index.js');
  assert.deepEqual(tsConfig.include, ['src']);
  assert.doesNotMatch(functions, /jobWorker|\.\/\.\.\/index/);
});

test('the separate private Life Movie transport remains outside this contract-only job path', () => {
  const privateRoute = source('../app/api/studio/video-factory/jobs-dispatch/route.ts');
  const privateContract = source('../app/api/studio/video-factory/jobs-contract/route.ts');
  assert.match(privateRoute, /callStudioJobsBridge/);
  assert.match(privateRoute, /requireStudioJobsRenderConsent/);
  assert.match(privateContract, /renderConsentAuthorized:false/);
  assert.match(privateContract, /consentGrantIssued:false/);
});
