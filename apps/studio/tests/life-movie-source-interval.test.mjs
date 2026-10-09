import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
function load(relative) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL(relative, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require, Buffer });
  return exports;
}
const short = load('../lib/studio-life-movie-jobs-bridge.ts');
const long = load('../lib/studio-life-movie-longform-contract.ts');
const input = {
  tenantId: 'tenant-fixture', projectId: 'project-fixture',
  sceneTruthReceiptRef: `str_fixturefixture1234_zzzzzzzz_${'A'.repeat(40)}`, sceneTruthDigest: 'b'.repeat(64),
  width: 320, height: 320, fps: 30,
  sources: [{ id: 'source-fixture', bucket: 'private-fixture-bucket', objectPath: 'tenants/tenant-fixture/source.mp4',
    mimeType: 'video/mp4', provenance: 'original-source', sourceRefs: ['synthetic-source-reference'], consentRef: 'fixture-consent', ownerOrRightsRef: 'fixture-rights' }],
  timeline: [{ sourceId: 'source-fixture', startMs: 0, endMs: 750, sourceStartMs: 1250 }],
};
function longRequest(value) {
  const { tenantId, ...body } = value;
  return long.buildStudioLongformRequest({ ...body, action: 'create',
    consent: { purpose: 'life-movie.render', policyVersion: 'fixture-v1', decisionReceiptId: 'fixture-decision' },
  }, { tenantId, userId: 'owner-fixture' });
}
let cases = 0;
for (const offset of [0, 1250, 45 * 60 * 1000]) {
  const value = { ...input, timeline: [{ ...input.timeline[0], sourceStartMs: offset }] };
  assert.equal(short.buildJobsLifeMovieEnvelope(value).payload.timeline[0].sourceStartMs, offset);
  assert.equal(longRequest(value).payload.timeline[0].sourceStartMs, offset);
  cases++;
}
for (const offset of [-1, .5, 45 * 60 * 1000 + 1, null, '1250', false, NaN, Infinity]) {
  const value = { ...input, timeline: [{ ...input.timeline[0], sourceStartMs: offset }] };
  assert.throws(() => short.buildJobsLifeMovieEnvelope(value), /invalid_timeline_source_start/);
  assert.throws(() => longRequest(value), /invalid_timeline_source_start/); cases++;
}
const legacy = { ...input, timeline: [{ sourceId: 'source-fixture', startMs: 0, endMs: 750 }] };
assert.deepEqual(JSON.parse(JSON.stringify(short.buildJobsLifeMovieEnvelope(legacy).payload.timeline)), legacy.timeline);
assert.deepEqual(JSON.parse(JSON.stringify(longRequest(legacy).payload.timeline)), legacy.timeline); cases++;
const later = { ...input, timeline: [{ ...input.timeline[0], sourceStartMs: 1500 }] };
assert.notEqual(short.buildJobsLifeMovieEnvelope(input).payload.renderPlanDigest, short.buildJobsLifeMovieEnvelope(later).payload.renderPlanDigest);
assert.notEqual(longRequest(input).payload.renderPlanDigest, longRequest(later).payload.renderPlanDigest);
assert.notEqual(longRequest(input).idempotencyKey, longRequest(later).idempotencyKey); cases++;
const still = { ...input, sources: [{ ...input.sources[0], mimeType: 'image/png' }] };
assert.throws(() => short.buildJobsLifeMovieEnvelope(still), /image_source_start_must_be_zero/);
assert.throws(() => longRequest(still), /image_source_start_must_be_zero/); cases++;
for (const result of [short.buildJobsLifeMovieEnvelope(input), longRequest(input)]) {
  assert.equal(result.payload.publicReleaseAuthorized, false);
  assert.equal(result.payload.providerGenerationAuthorized, false);
  assert.equal(result.payload.spatialRequired, false);
  assert.equal(result.payload.sceneTruthReceiptRef, input.sceneTruthReceiptRef);
  assert.equal(result.payload.sceneTruthDigest, input.sceneTruthDigest);
} cases++;
console.log(`[PASS] ${cases} actual Studio producer source-time cases: source offsets/digest/legacy parity, scalar/still-image denials and retained SceneTruth/private authority; synthetic inputs, no dispatch`);
