import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

async function loadTs(path, replace = source => source) {
  const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
  const js = ts.transpileModule(replace(source), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
}
const life = await loadTs('../lib/studio/life-movies.ts');
const captured = await loadTs('../lib/studio/captured-reality.ts');
const music = await loadTs('../lib/studio/music-direction.ts');
const input = {
  id: 'movie', tenantId: 'tenant', userId: 'user', title: 'Story', mode: 'thematic',
  sources: [{ id: 'source', kind: 'photo', uri: 'gs://private/photo.jpg', provenance: 'original-source', sourceRefs: ['source:1'], consentRef: 'consent:1', ownerOrRightsRef: 'rights:1' }],
  chapters: [{ id: 'chapter', title: 'Chapter', sourceIds: ['source'], durationMs: 1000 }],
  narrativeTheme: 'relationship-arc', narrativeAuthorityRef: 'storytime:authority',
};
const project = life.createLifeMovieProject(input);
assert.equal(project.narrativeTheme, input.narrativeTheme);
assert.equal(project.narrativeAuthorityRef, input.narrativeAuthorityRef);
for (const narrativeAuthorityRef of [undefined, '', '  ']) {
  assert.throws(() => life.createLifeMovieProject({ ...input, narrativeAuthorityRef }), /life_movie_narrative_authority_required/);
}
assert.doesNotThrow(() => life.createLifeMovieProject({ ...input, narrativeTheme: 'custom', narrativeAuthorityRef: undefined }));
const base = captured.createCapturedRealityProject({ id: 'capture', tenantId: 'tenant', userId: 'user', title: 'Capture', sourceReceiptRefs: ['source:1'], reconstructionMethod: '3dgs' });
const fields = ['cameraSolveReceiptRef', 'trainingReceiptRef', 'sourceVsReconstructionReceiptRef', 'archivalArtifactRef', 'runtimeArtifactRef', 'collisionArtifactRef', 'assetFactoryPromotionReceiptRef', 'spatialReplayBindingRef'];
const ready = { ...base, ...Object.fromEntries(fields.map(field => [field, `receipt:${field}`])), reviewRefs: ['review:1'], approvalRefs: ['approval:1'] };
assert.equal(captured.capturedRealityReviewReadiness(ready).ready, true);
for (const field of fields) for (const value of ['', '  ', '\t\n']) {
  assert.equal(captured.capturedRealityReviewReadiness({ ...ready, [field]: value }).ready, false, field);
}
for (const field of ['reviewRefs', 'approvalRefs']) for (const refs of [[], [''], ['  '], ['valid:1', ' ']]) {
  assert.equal(captured.capturedRealityReviewReadiness({ ...ready, [field]: refs }).ready, false, field);
}
for (const sourceReceiptRefs of [[], [''], ['  '], ['valid:1', ' ']]) {
  assert.throws(() => captured.validateCapturedRealityProject({ ...ready, sourceReceiptRefs }), /captured_reality_source_receipt_required/);
}
const cue = { id: 'cue', productionId: 'production', startMs: 0, endMs: 1000, intensity: 0.5, mood: 'calm', dialoguePriority: true, motifRefs: [], sourceRefs: ['source:1'], provenance: 'original-local', generationRequested: false, generationAuthorized: false, stemsRequired: true, cueSheetRequired: true, loopAndTailPlanRequired: true, dialogueDuckingDb: { min: 0, max: 24 }, deliveryMixes: ['stereo'] };
assert.deepEqual(music.validateMusicDirectionCue(cue), []);
for (const field of ['min', 'max']) for (const value of [NaN, Infinity, -Infinity]) {
  assert.ok(music.validateMusicDirectionCue({ ...cue, dialogueDuckingDb: { ...cue.dialogueDuckingDb, [field]: value } }).includes('music_direction_dialogue_ducking_plan_required'));
}
const route = await loadTs('../app/api/studio/life-movies/route.ts', source => {
  const stripped = source.replace(/import[\s\S]*?from ['"][^'"]+['"];\n/g, '');
  const lifeSource = fs.readFileSync(new URL('../lib/studio/life-movies.ts', import.meta.url), 'utf8');
  return `const NextResponse = { json: (body, options) => ({ body, status: options.status }) };
    const requireStudioAuth = async () => ({ ok: true, tenantId: 'tenant', uid: 'user' });
    const resolveStudioFeaturePolicy = () => ({ id: 'life-movies-render', state: 'hard-off', hardOff: true });
    const canExecuteStudioFeature = () => false;
    ${lifeSource.replace(/import type[\s\S]*?;\n/g, '')}
    ${stripped}`;
});
const rejected = await route.POST({ json: async () => ({ ...input, narrativeAuthorityRef: ' ' }) });
assert.equal(rejected.status, 400);
assert.ok(JSON.stringify(rejected.body).includes('life_movie_narrative_authority_required'));
const hardOff = await route.POST({ json: async () => input });
assert.equal(hardOff.status, 409);
assert.equal(hardOff.body.status, 'life_movies_render_hard_off');
console.log('Studio review validation behavior passed');
