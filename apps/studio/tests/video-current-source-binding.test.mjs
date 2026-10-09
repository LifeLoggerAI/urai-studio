import assert from 'node:assert/strict';
import fs from 'node:fs';
import { assertCurrentSpatialOwner, verifyCurrentSpatialOwner } from '../../../scripts/studio-video-spatial-owner.mjs';

const spatialSha = '3b6b5f4d53fb57c03c4cbe74276d35fe713f9230', studioSha = '1'.repeat(40);
const fixture = () => ({ number: 1636, state: 'open', merged: false,
  base: { repo: { full_name: 'LifeLoggerAI/urai-spatial' } },
  head: { sha: spatialSha, repo: { full_name: 'LifeLoggerAI/urai-spatial' } } });
let cases = 0;
assert.equal(assertCurrentSpatialOwner(fixture(), spatialSha).sourceSha, spatialSha); cases++;
for (const change of [
  pr => { pr.number = 1; }, pr => { pr.state = 'closed'; }, pr => { pr.merged = true; },
  pr => { pr.base.repo.full_name = 'foreign/repo'; }, pr => { pr.head.repo.full_name = 'foreign/repo'; },
  pr => { pr.head.sha = 'f'.repeat(40); }, pr => { pr.head.sha = null; }, pr => { delete pr.head; },
]) {
  const pr = fixture(); change(pr); assert.throws(() => assertCurrentSpatialOwner(pr, spatialSha)); cases++;
}
for (const expectedSha of ['', 'unknown', spatialSha.toUpperCase()]) {
  assert.throws(() => assertCurrentSpatialOwner(fixture(), expectedSha), /source_invalid/); cases++;
}
let calls = 0;
const fetchImpl = async (url, options) => {
  calls++;
  assert.equal(url, 'https://api.github.com/repos/LifeLoggerAI/urai-spatial/pulls/1636');
  assert.equal(options.method, 'GET'); assert.equal(options.redirect, 'error'); assert.equal(options.cache, 'no-store');
  assert.equal(options.headers.authorization, 'Bearer fictional-read-token');
  return new Response(JSON.stringify(fixture()));
};
const receipt = await verifyCurrentSpatialOwner({ expectedSha: spatialSha, studioSha, token: 'fictional-read-token', fetchImpl });
assert.equal(receipt.studioSourceSha, studioSha); assert.equal(receipt.spatial.sourceSha, spatialSha);
for (const field of ['independentReviewAccepted', 'visualAccepted', 'deviceAccepted', 'productionVerified', 'goldenMaster']) assert.equal(receipt[field], false);
assert.equal(JSON.stringify(receipt).includes('fictional-read-token'), false); cases++;
await assert.rejects(verifyCurrentSpatialOwner({ expectedSha: spatialSha, studioSha: 'unknown', fetchImpl }), /exact_source_invalid/);
assert.equal(calls, 1); cases++;
for (const fake of [
  async () => new Response('forbidden', { status: 403 }),
  async () => { throw new Error('private token and response must never enter logs'); },
  async () => new Response('malformed'),
  async () => new Response('x'.repeat(1_048_577)),
  async () => { const pr = fixture(); pr.head.sha = 'f'.repeat(40); return new Response(JSON.stringify(pr)); },
]) {
  await assert.rejects(verifyCurrentSpatialOwner({ expectedSha: spatialSha, studioSha, fetchImpl: fake }),
    error => /^spatial_current_owner_/.test(error.message) && !error.message.includes('private token'));
  cases++;
}
const workflow = fs.readFileSync(new URL('../../../.github/workflows/video-factory-verification.yml', import.meta.url), 'utf8');
let streamChunks = 0, streamCancelled = false;
await assert.rejects(verifyCurrentSpatialOwner({ expectedSha: spatialSha, studioSha,
  fetchImpl: async () => new Response(new ReadableStream({
    pull(controller) { streamChunks++; controller.enqueue(new Uint8Array(131_072)); },
    cancel() { streamCancelled = true; },
  }, { highWaterMark: 0 })) }), /response_invalid/);
assert.equal(streamCancelled, true); assert.equal(streamChunks, 9); cases++;
await assert.rejects(verifyCurrentSpatialOwner({ expectedSha: spatialSha, studioSha,
  fetchImpl: async () => new Response(new ReadableStream({
    start(controller) { controller.error(new Error('private upstream details')); },
  })) }), error => error.message === 'spatial_current_owner_response_invalid'); cases++;
assert.ok(workflow.includes('pnpm install --frozen-lockfile')); assert.ok(!workflow.includes('--no-frozen-lockfile'));
assert.ok(workflow.includes('Prove install preserved exact source')); assert.ok(workflow.includes('Prove Studio build preserved exact source'));
assert.ok(workflow.includes('Bind current Spatial owner before capture')); assert.ok(workflow.includes('Revalidate current Spatial owner after capture'));
assert.ok(workflow.indexOf('Revalidate current Spatial owner after capture') > workflow.indexOf('Compose and verify semantic-ready motion MP4'));
assert.equal((workflow.match(/studio-video-spatial-owner\.mjs/g) || []).length, 2);
assert.ok(workflow.includes('ref: ${{ env.URAI_SPATIAL_EXPECTED_SHA }}')); assert.ok(workflow.includes(spatialSha));
assert.ok(!workflow.includes('ff6f3df71a18b7ac6a2e5b7872b2fd0e802dbe3b'));
cases++;
console.log(`[PASS] ${cases} exact current-owner/readback/source-boundary cases; no visual/device/production acceptance or provider calls`);
