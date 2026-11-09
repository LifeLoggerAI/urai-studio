import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = readFileSync(new URL('../lib/studio-life-movie-jobs-bridge.ts', import.meta.url), 'utf8');
const module = { exports: {} };
runInNewContext(ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} }).outputText, { module, exports: module.exports, require, Buffer });
const build = module.exports.buildJobsLifeMovieEnvelope;

function fixture() {
  return {
    tenantId: 'tenant1', projectId: 'project1',
    sceneTruthReceiptRef: `str_${'A'.repeat(16)}_${'a'.repeat(8)}_${'B'.repeat(40)}`,
    sceneTruthDigest: 'b'.repeat(64),
    sources: [{ id: 'source01', bucket: 'urai-media-test',
      objectPath: 'tenants/tenant1/raw/source01.mp4', generation: '17',
      mimeType: 'video/mp4', provenance: 'original-source', sourceRefs: ['proof-001'],
      consentRef: 'consent-001', ownerOrRightsRef: 'rights-001' }],
    timeline: [{ sourceId: 'source01', startMs: 0, endMs: 1000 }],
  };
}

for (const [field, error] of [
  ['sceneTruthReceiptRef', 'life_movie_invalid_scene_truth_receipt'],
  ['sceneTruthDigest', 'life_movie_invalid_scene_truth_digest'],
]) {
  test(`${field} rejects JSON array coercion`, () => {
    const input = fixture();
    // This shape survives JSON.parse at the HTTP boundary.
    input[field] = JSON.parse(JSON.stringify([input[field]]));
    assert.throws(() => build(input), new RegExp(error));
  });
  test(`${field} rejects object coercion without invoking toString`, () => {
    const input = fixture();
    const value = input[field];
    let calls = 0;
    input[field] = { toString() { calls += 1; return value; } };
    assert.throws(() => build(input), new RegExp(error));
    assert.equal(calls, 0);
  });
}

test('valid scene truth strings remain exact and non-authorizing', () => {
  const input = fixture();
  const envelope = build(input);
  assert.equal(envelope.payload.sceneTruthReceiptRef, input.sceneTruthReceiptRef);
  assert.equal(envelope.payload.sceneTruthDigest, input.sceneTruthDigest);
  assert.equal(envelope.dispatchAuthorized, false);
  assert.equal(envelope.providerGenerationAuthorized, false);
  assert.equal(envelope.publicReleaseAuthorized, false);
  assert.equal(Object.hasOwn(envelope, 'consent'), false);
});
