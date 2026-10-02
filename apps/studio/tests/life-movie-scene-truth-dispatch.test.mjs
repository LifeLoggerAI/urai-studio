import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../package.json', import.meta.url));
const ts = require('typescript');
const compiled = ts.transpileModule(
  fs.readFileSync(new URL('../lib/studio-life-movie-jobs-bridge.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

const module = { exports: {} };
vm.runInNewContext(compiled, {
  module,
  exports: module.exports,
  require,
  Buffer,
  console,
});

const { buildJobsLifeMovieEnvelope } = module.exports;

const base = {
  tenantId: 'tenant-fixture',
  projectId: 'project-fixture',
  sceneTruthReceiptRef: 'str_fixture_truth_receipt_0001',
  sceneTruthDigest: 'b'.repeat(64),
  sources: [{
    id: 'source-1',
    bucket: 'private-fixture-bucket',
    objectPath: 'tenants/tenant-fixture/source.png',
    mimeType: 'image/png',
    provenance: 'original-source',
    sourceRefs: ['fixture-source'],
    consentRef: 'consent-fixture',
    ownerOrRightsRef: 'rights-fixture',
  }],
  timeline: [{ sourceId: 'source-1', startMs: 0, endMs: 1000 }],
  audioCues: [],
  subtitleText: '',
  width: 1280,
  height: 720,
  fps: 30,
};

const accepted = buildJobsLifeMovieEnvelope(base);
assert.equal(accepted.payload.sceneTruthReceiptRef, base.sceneTruthReceiptRef);
assert.match(accepted.payload.renderPlanDigest, /^[a-f0-9]{64}$/);

assert.throws(
  () => buildJobsLifeMovieEnvelope({ ...base, sceneTruthReceiptRef: '' }),
  /life_movie_invalid_scene_truth_receipt/,
);
assert.throws(
  () => buildJobsLifeMovieEnvelope({ ...base, sceneTruthReceiptRef: 'bad' }),
  /life_movie_invalid_scene_truth_receipt/,
);

const alternate = buildJobsLifeMovieEnvelope({
  ...base,
  sceneTruthReceiptRef: 'str_fixture_truth_receipt_0002',
  sceneTruthDigest: 'b'.repeat(64),
});
assert.notEqual(
  accepted.payload.renderPlanDigest,
  alternate.payload.renderPlanDigest,
  'SceneTruth receipt must be cryptographically bound into the render-plan digest',
);

console.log('Life Movie SceneTruth dispatch binding passed');

const alternateDigest = buildJobsLifeMovieEnvelope({
  ...base,
  sceneTruthDigest: 'c'.repeat(64),
});
assert.notEqual(
  accepted.payload.renderPlanDigest,
  alternateDigest.payload.renderPlanDigest,
  'SceneTruth digest must be cryptographically bound into the render-plan digest',
);
assert.throws(
  () => buildJobsLifeMovieEnvelope({ ...base, sceneTruthDigest: 'bad' }),
  /life_movie_invalid_scene_truth_digest/,
);
