import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const lifeSource = fs.readFileSync(new URL('../lib/studio/life-movies.ts', import.meta.url), 'utf8');
const bridgeSource = fs.readFileSync(new URL('../lib/studio/life-movie-jobs-bridge.ts', import.meta.url), 'utf8');
const source = `${lifeSource}\n${bridgeSource.replace(/^import .*from '\.\/life-movies';\n/m, '')}`;
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { buildJobsLifeMovieRenderPayload: build, LIFE_MOVIE_JOBS_CONTRACT } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const project = { id: 'project', tenantId: 'tenant', sources: [{ id: 'source', uri: 'gs://private-fixture/tenants/tenant/image.png', mimeType: 'image/png', provenance: 'original-source', sourceRefs: ['synthetic'], consentRef: 'consent', ownerOrRightsRef: 'rights' }] };
const plan = { inputDigest: 'a'.repeat(64), timeline: [{ sourceId: 'source', startMs: 0, endMs: 15000 }], subtitleText: '' };
const accepted = build(project, plan);
assert.equal(accepted.timeline[0].endMs, 15000);
assert.equal(accepted.providerGenerationAuthorized, false);
assert.equal(accepted.publicReleaseAuthorized, false);
for (const endMs of [15001, 30000, 45 * 60 * 1000, NaN, Infinity]) {
  assert.throws(() => build(project, { ...plan, timeline: [{ sourceId: 'source', startMs: 0, endMs }] }), /synchronous_render_budget/);
}
assert.throws(() => build(project, { ...plan, timeline: [{ sourceId: 'source', startMs: 45000, endMs: 46000 }] }), /synchronous_render_budget/);
assert.throws(() => build({ ...project, sources: Array(13).fill(project.sources[0]) }, plan), /synchronous_render_budget/);
assert.throws(() => build(project, { ...plan, timeline: Array(13).fill(plan.timeline[0]) }), /synchronous_render_budget/);
const audioCue = { sourceId: 'source', role: 'music', startMs: 0, endMs: 1000, sourceStartMs: 0, gainDb: -6 };
assert.throws(() => build(project, { ...plan, audioCues: Array(13).fill(audioCue) }), /synchronous_render_budget/);
const withAudio = build(project, { ...plan, audioCues: [audioCue] });
assert.equal(withAudio.audioCues[0].role, 'music');
assert.equal(withAudio.audioCues[0].gainDb, -6);
assert.equal(LIFE_MOVIE_JOBS_CONTRACT.maxTotalTimelineMs, 45 * 60 * 1000, 'render budget must not silently rewrite authoring limits');
console.log('Life Movie bridge rejects unsupported synchronous renders before dispatch; authoring and hard-off boundaries retained');
