import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const sourceRoot = process.env.STUDIO_SUBTITLE_SOURCE_ROOT || new URL('../lib/', import.meta.url);
function load(name) {
  const source = sourceRoot instanceof URL ? new URL(name, sourceRoot) : path.join(sourceRoot, name);
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(source, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require, Buffer });
  return exports;
}
const short = load('studio-life-movie-jobs-bridge.ts').buildJobsLifeMovieEnvelope;
const long = load('studio-life-movie-longform-contract.ts').buildStudioLongformRequest;
function fixture(subtitleText) {
  return {
    tenantId: 'fixture-tenant', projectId: 'fixture-project',
    sceneTruthReceiptRef: `str_fixturefixture1234_zzzzzzzz_${'A'.repeat(40)}`,
    sceneTruthDigest: 'b'.repeat(64), width: 320, height: 320, fps: 30,
    sources: [{ id: 'fixture-source', bucket: 'private-fixture-bucket',
      objectPath: 'tenants/fixture-tenant/source.mp4', mimeType: 'video/mp4',
      provenance: 'original-source', sourceRefs: ['synthetic-source-reference'],
      consentRef: 'fixture-consent', ownerOrRightsRef: 'fixture-rights' }],
    timeline: [{ sourceId: 'fixture-source', startMs: 0, endMs: 1000 }], subtitleText,
  };
}
function buildLong(input) {
  const { tenantId, ...body } = input;
  return long({ action: 'create', ...body, consent: {
    purpose: 'life-movie.render', policyVersion: 'synthetic-policy', decisionReceiptId: 'synthetic-decision',
  } }, { tenantId, userId: 'fixture-owner' });
}
const malformed = [
  ['plain prose', 'Synthetic private caption'],
  ['missing caption', '1\n00:00:00,000 --> 00:00:00,900\n'],
  ['invalid minute', '1\n00:60:00,000 --> 00:60:00,900\nSynthetic caption'],
  ['invalid second', '1\n00:00:60,000 --> 00:00:60,900\nSynthetic caption'],
  ['reversed interval', '1\n00:00:00,900 --> 00:00:00,100\nSynthetic caption'],
  ['empty interval', '1\n00:00:00,500 --> 00:00:00,500\nSynthetic caption'],
  ['invalid later block', '1\n00:00:00,000 --> 00:00:00,500\nSynthetic caption\n\n2\ninvalid\nSynthetic later caption'],
];
for (const [form, build, code] of [
  ['shortform', short, 'life_movie_subtitle_invalid'],
  ['longform', buildLong, 'longform_invalid_subtitles'],
]) {
  for (const [name, value] of malformed) {
    test(`${form} rejects ${name} before producing a Jobs envelope`, () => {
      assert.throws(() => build(fixture(value)), new RegExp(code));
    });
  }
  test(`${form} preserves accepted SRT bytes, digest identity and false authorities`, () => {
    for (const value of ['', ' \r\n\t ',
      '1\n00:00:00,100 --> 00:00:00,900\nSynthetic caption\n',
      '00:00:00,100 --> 00:00:01,000 position:50%\r\nSynthetic first line\r\nSynthetic second line\r\n']) {
      const result = build(fixture(value));
      assert.equal(result.payload.subtitleText, value);
      assert.equal(result.payload.renderPlanDigest, build(fixture(value)).payload.renderPlanDigest);
      assert.equal(result.payload.sceneTruthDigest, 'b'.repeat(64));
      assert.deepEqual([result.payload.spatialRequired, result.payload.providerGenerationAuthorized,
        result.payload.publicReleaseAuthorized], [false, false, false]);
    }
  });
}
test('shortform rejects a subtitle extending beyond the rendered timeline', () => {
  assert.throws(() => short(fixture('1\n00:00:00,900 --> 00:00:01,001\nSynthetic caption')), /life_movie_subtitle_outside_timeline/);
});
test('longform preserves Jobs clipping of a valid subtitle across segment boundaries', () => {
  const input = fixture('1\n00:00:00,900 --> 00:00:30,000\nSynthetic clipped caption');
  assert.equal(buildLong(input).payload.subtitleText, input.subtitleText);
});
