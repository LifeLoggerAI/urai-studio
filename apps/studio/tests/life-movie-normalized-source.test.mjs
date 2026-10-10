import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const sourcePath = process.env.STUDIO_JOBS_BRIDGE_SOURCE || new URL('../lib/studio-life-movie-jobs-bridge.ts', import.meta.url);
const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports, require, Buffer });
const build = exports.buildJobsLifeMovieEnvelope;
const plain = (value) => JSON.parse(JSON.stringify(value));

function fixture() {
  return {
    tenantId: 'fixture-tenant', projectId: 'fixture-project',
    sceneTruthReceiptRef: `str_fixturefixture1234_zzzzzzzz_${'A'.repeat(40)}`,
    sceneTruthDigest: 'b'.repeat(64), width: 320, height: 320, fps: 30,
    sources: [{ id: 'fixture-source', bucket: 'private-fixture-bucket',
      objectPath: 'tenants/fixture-tenant/source.mp4', mimeType: 'video/mp4',
      provenance: 'original-source', sourceRefs: ['synthetic-source-reference'],
      consentRef: 'fixture-consent', ownerOrRightsRef: 'fixture-rights' }],
    timeline: [{ sourceId: 'fixture-source', startMs: 0, endMs: 750, sourceStartMs: 1250 }],
    audioCues: [{ sourceId: 'fixture-source', role: 'narration', startMs: 0, endMs: 750 }],
  };
}

test('accepted padded source references bind the same worker plan and retry key', () => {
  const clean = fixture();
  const padded = fixture();
  padded.sources[0].sourceRefs = [' \t synthetic-source-reference \n'];
  const before = plain(padded);
  const result = build(padded);
  assert.deepEqual(plain(result.payload), plain(build(clean).payload));
  assert.equal(result.idempotencyKey, build(clean).idempotencyKey);
  assert.deepEqual(padded, before, 'producer must not rewrite caller input');
});

test('accepted object-path padding is normalized before plan binding and tenant checks', () => {
  const input = fixture();
  input.sources[0].objectPath += ' \t';
  const result = build(input);
  assert.deepEqual(plain(result.payload), plain(build(fixture()).payload));
  assert.equal(input.sources[0].objectPath.endsWith(' \t'), true);
  const foreign = fixture();
  foreign.sources[0].objectPath = ' tenants/other-tenant/source.mp4 ';
  assert.throws(() => build(foreign), /life_movie_source_outside_tenant/);
});

test('caller mutation cannot change source references after the digest is computed', () => {
  const input = fixture();
  const result = build(input);
  const before = plain(result);
  input.sources[0].sourceRefs.push('synthetic-later-reference');
  input.sources[0].sourceRefs[0] = 'synthetic-replacement';
  input.sources[0].objectPath = 'tenants/fixture-tenant/other.mp4';
  assert.deepEqual(plain(result), before);
});

for (const [field, code, values] of [
  ['mimeType', 'life_movie_invalid_source_mime', ['video/unsupported', ' video/mp4', null, 7]],
  ['provenance', 'life_movie_invalid_source_provenance', ['verified', ' original-source', null, 7]],
]) {
  test(`raw request ${field} must match the existing Jobs enum`, () => {
    for (const value of values) {
      const input = fixture(); input.sources[0][field] = value;
      assert.throws(() => build(input), new RegExp(code));
    }
  });
}

test('raw audio roles must match the existing Jobs enum', () => {
  for (const role of ['speech', ' narration', null, 7]) {
    const input = fixture(); input.audioCues[0].role = role;
    assert.throws(() => build(input), /life_movie_invalid_audio_role/);
  }
});

test('raw source identities and receipts reject regex-coercible scalar types', () => {
  for (const [field, code] of [
    ['id', 'life_movie_invalid_source_id'], ['bucket', 'life_movie_invalid_bucket'],
    ['consentRef', 'life_movie_invalid_consent_ref'], ['ownerOrRightsRef', 'life_movie_invalid_rights_ref'],
  ]) {
    const input = fixture(); input.sources[0][field] = 123;
    if (field === 'id') {
      input.timeline[0].sourceId = 123; input.audioCues[0].sourceId = 123;
    }
    assert.throws(() => build(input), new RegExp(code));
  }
});

test('unknown raw source fields cannot enter a digest Jobs will reject', () => {
  const input = fixture(); input.sources[0].providerGenerationAuthorized = true;
  assert.throws(() => build(input), /life_movie_unknown_source_field/);
});

test('source references retain bounded nonempty string admission', () => {
  for (const sourceRefs of [[], [' \t\n '], [7], ['x'.repeat(513)], Array(33).fill('synthetic-ref')]) {
    const input = fixture(); input.sources[0].sourceRefs = sourceRefs;
    assert.throws(() => build(input), /life_movie_invalid_source_refs/);
  }
});

test('normalizing does not erase internal path spaces or admit unsafe paths', () => {
  const input = fixture(); input.sources[0].objectPath = 'tenants/fixture-tenant/source copy.mp4';
  assert.equal(build(input).payload.sources[0].objectPath, input.sources[0].objectPath);
  for (const objectPath of ['/tenants/fixture-tenant/source.mp4', 'tenants/fixture-tenant/../source.mp4', 'tenants/fixture-tenant/source\\copy.mp4']) {
    input.sources[0].objectPath = objectPath;
    assert.throws(() => build(input), /life_movie_invalid_source_path/);
  }
  input.sources[0].bucket = 'a'.repeat(256);
  input.sources[0].objectPath = 'tenants/fixture-tenant/source.mp4';
  assert.throws(() => build(input), /life_movie_invalid_bucket/);
});

test('the emitted digest binds the emitted plan while factual changes remain distinct', () => {
  const result = build(fixture());
  const { schemaVersion, renderPlanDigest, spatialRequired, publicReleaseAuthorized,
    providerGenerationAuthorized, ...plan } = plain(result.payload);
  const sorted = (value) => Array.isArray(value) ? value.map(sorted) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sorted(value[key])])) : value;
  assert.equal(renderPlanDigest, createHash('sha256').update(JSON.stringify(sorted(plan))).digest('hex'));
  for (const field of ['sourceRefs', 'objectPath', 'provenance']) {
    const input = fixture();
    input.sources[0][field] = field === 'sourceRefs' ? ['synthetic-other-reference']
      : field === 'objectPath' ? 'tenants/fixture-tenant/other.mp4' : 'reconstructed';
    assert.notEqual(build(input).payload.renderPlanDigest, renderPlanDigest);
    assert.notEqual(build(input).idempotencyKey, result.idempotencyKey);
  }
  assert.equal(schemaVersion, 'urai-life-movie-render-v1');
  assert.deepEqual([spatialRequired, publicReleaseAuthorized, providerGenerationAuthorized,
    result.dispatchAuthorized, result.publicReleaseAuthorized, result.providerGenerationAuthorized], Array(6).fill(false));
  assert.equal(plan.sceneTruthDigest, fixture().sceneTruthDigest);
  assert.equal(plan.sceneTruthReceiptRef, fixture().sceneTruthReceiptRef);
  assert.equal(plan.timeline[0].sourceStartMs, 1250);
});
