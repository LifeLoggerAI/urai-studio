import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../package.json', import.meta.url));
const ts = require('typescript');
const sourceText = fs.readFileSync(new URL('../lib/studio-life-movie-jobs-bridge.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(sourceText, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const cjs = { exports: {} };
vm.runInNewContext(compiled, { module: cjs, exports: cjs.exports, require, Buffer, console });
const { buildJobsLifeMovieEnvelope } = cjs.exports;

const base = () => ({
  tenantId:'tenant1', projectId:'project1',
  sceneTruthReceiptRef:'str_' + 'A'.repeat(16) + '_' + 'a'.repeat(8) + '_' + 'B'.repeat(40),
  sceneTruthDigest:'a'.repeat(64),
  sources:[{
    id:'source01', bucket:'urai-media-prod', objectPath:'tenants/tenant1/raw/source01.jpg',
    generation:'17', mimeType:'image/jpeg', provenance:'original-source',
    sourceRefs:['source-proof-001'], consentRef:'consent-001', ownerOrRightsRef:'rights-001',
  }],
  timeline:[{ sourceId:'source01', startMs:0, endMs:1000 }],
});
const build = mutate => { const input=base(); if (mutate) mutate(input); return buildJobsLifeMovieEnvelope(input); };
const reject = (mutate, code) => assert.throws(() => build(mutate), new RegExp(code));

const original=build();
assert.equal(original.payload.sources[0].generation, '17');
assert.match(original.payload.renderPlanDigest, /^[0-9a-f]{64}$/);
reject(x => { delete x.sources[0].generation; }, 'life_movie_invalid_source_shape');
for (const generation of ['0','01','-1','1e3','17.0','99999999999999999999',17,null]) {
  reject(x => { x.sources[0].generation=generation; }, 'life_movie_invalid_source_generation');
}
reject(x => { x.sources[0].unexpected='verified'; }, 'life_movie_invalid_source_shape');
reject(x => { x.sources[0].mimeType='application/x-custom'; }, 'life_movie_invalid_source_mime');
reject(x => { x.sources[0].provenance='unverified-claim'; }, 'life_movie_invalid_source_provenance');
assert.deepEqual(Array.from(Object.keys(original.payload.sources[0])), [
  'id','bucket','objectPath','generation','mimeType','provenance',
  'sourceRefs','consentRef','ownerOrRightsRef',
]);
const alternate=build(x => { x.sources[0].generation='18'; });
assert.notEqual(alternate.payload.renderPlanDigest, original.payload.renderPlanDigest);
assert.notEqual(alternate.idempotencyKey, original.idempotencyKey);
const input=base();
const normalized=buildJobsLifeMovieEnvelope(input);
input.sources[0].sourceRefs[0]='tampered';
assert.equal(normalized.payload.sources[0].sourceRefs[0],'source-proof-001');
reject(x => { x.sources[0].objectPath='tenants/other/raw/source.jpg'; }, 'life_movie_source_outside_tenant');
reject(x => { x.sources[0].objectPath='tenants/tenant1/../outside.jpg'; }, 'life_movie_invalid_source_path');
reject(x => { x.sources.push({...x.sources[0]}); }, 'life_movie_invalid_source_id');
reject(x => { x.sources[0].ownerOrRightsRef='bad/path'; }, 'life_movie_invalid_rights_ref');
reject(x => { x.sources[0].consentRef='bad/path'; }, 'life_movie_invalid_consent_ref');
assert.equal(Object.prototype.hasOwnProperty.call(original,'consent'), false);
assert.equal(original.dispatchAuthorized,false);
assert.equal(original.payload.publicReleaseAuthorized,false);
assert.equal(original.payload.providerGenerationAuthorized,false);
assert.equal(original.payload.outputPrefix,'tenants/tenant1/life-movies/project1/');
console.log('R926 Studio generation-pinned strict-source contract passed');
