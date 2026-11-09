import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../package.json', import.meta.url));
const ts = require('typescript');
const tsSource = fs.readFileSync(new URL('../lib/studio-life-movie-jobs-bridge.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(tsSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const cjs = { exports: {} };
vm.runInNewContext(compiled, { module: cjs, exports: cjs.exports, require, Buffer, console });
const { buildJobsLifeMovieEnvelope } = cjs.exports;
const input = (mimeType='video/mp4', sourceStartMs=undefined) => {
  const timelineItem = { sourceId:'source01', startMs:0, endMs:1000 };
  if (sourceStartMs !== undefined) timelineItem.sourceStartMs=sourceStartMs;
  return {
    tenantId:'tenant-fixture', projectId:'project-fixture',
    sceneTruthReceiptRef:'str_abcdefghijklmnop_mabcdefg_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmn',
    sceneTruthDigest:'b'.repeat(64),
    sources:[{ id:'source01', bucket:'private-fixture-bucket', generation:'17',
      objectPath:'tenants/tenant-fixture/media/source01.mp4', mimeType,
      provenance:'original-source',sourceRefs:['fixture-source'],
      consentRef:'consent-fixture',ownerOrRightsRef:'rights-fixture' }],
    timeline:[timelineItem], audioCues:[], fps:30, width:1280, height:720,
  };
};
const run=(mime,offset)=>buildJobsLifeMovieEnvelope(input(mime,offset));
assert.equal(run('video/mp4',2000).payload.timeline[0].sourceStartMs,2000);
assert.equal(run('audio/wav',30).payload.timeline[0].sourceStartMs,30);
assert.equal(Object.hasOwn(run('video/mp4').payload.timeline[0],'sourceStartMs'),false);
assert.equal(run('image/jpeg',0).payload.timeline[0].sourceStartMs,0);
assert.throws(()=>run('image/jpeg',2),/life_movie_image_source_offset_not_allowed/);
for(const value of [-1,0.25,45*60*1000+1,NaN,Infinity,null,'12']){
  assert.throws(()=>run('video/mp4',value),/life_movie_invalid_timeline_source_start/);
}
const omitted=run('video/mp4'), zero=run('video/mp4',0), later=run('video/mp4',10);
assert.notEqual(omitted.payload.renderPlanDigest,zero.payload.renderPlanDigest);
assert.notEqual(zero.payload.renderPlanDigest,later.payload.renderPlanDigest);
assert.notEqual(zero.idempotencyKey,later.idempotencyKey);
assert.equal(later.dispatchAuthorized,false);
assert.equal(later.payload.publicReleaseAuthorized,false);
assert.equal(later.payload.providerGenerationAuthorized,false);
assert.equal(Object.hasOwn(later,'consent'),false);
console.log('R927 Life Movie timeline sourceStartMs strict parity passed');
