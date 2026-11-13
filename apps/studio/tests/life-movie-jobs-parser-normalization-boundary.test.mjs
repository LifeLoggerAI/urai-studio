import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require=createRequire(new URL('../package.json',import.meta.url));
const ts=require('typescript');
const text=fs.readFileSync(new URL('../lib/studio-life-movie-jobs-bridge.ts',import.meta.url),'utf8');
const code=ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{}};
vm.runInNewContext(code,{module,exports:module.exports,require,Buffer,console});
const {buildJobsLifeMovieEnvelope:buildEnvelope}=module.exports;
const fixture=()=>({
 tenantId:'tenant1',projectId:'project1',
 sceneTruthReceiptRef:'str_'+'A'.repeat(16)+'_'+'a'.repeat(8)+'_'+'B'.repeat(40),
 sceneTruthDigest:'b'.repeat(64),
 sources:[{id:'source01',bucket:'urai-media-prod',objectPath:'tenants/tenant1/raw/source01.mp4',generation:'17',mimeType:'video/mp4',provenance:'original-source',sourceRefs:['source-proof-001'],consentRef:'consent-001',ownerOrRightsRef:'rights-001'}],
 timeline:[{sourceId:'source01',startMs:0,endMs:1000,sourceStartMs:100}],
 audioCues:[{sourceId:'source01',role:'narration',startMs:0,endMs:1000,sourceStartMs:0,gainDb:0}],
});
const build=mutate=>{const x=fixture();if(mutate)mutate(x);return buildEnvelope(x);};
const deny=(mutate,code)=>assert.throws(()=>build(mutate),new RegExp(code));
const checks=[
 ['tenant whitespace',x=>{x.tenantId='tenant one';x.sources[0].objectPath='tenants/tenant one/raw/source01.mp4';},'life_movie_invalid_tenant'],
 ['tenant embedded dot-dot rejected',x=>{x.tenantId='tenant..one';x.sources[0].objectPath='tenants/tenant..one/raw/source01.mp4';},'life_movie_invalid_tenant'],
 ['tenant length',x=>{x.tenantId='t'.repeat(129);x.sources[0].objectPath='tenants/'+x.tenantId+'/raw/source01.mp4';},'life_movie_invalid_tenant'],
 ['idempotency overflow',x=>{x.projectId='p'.repeat(117);},'life_movie_invalid_idempotency_key'],
 ['bucket length',x=>{x.sources[0].bucket='a'.repeat(256);},'life_movie_invalid_bucket'],
 ['source id coercion',x=>{x.sources[0].id=12345;x.timeline[0].sourceId=12345;x.audioCues[0].sourceId=12345;},'life_movie_invalid_source_id'],
 ['bucket coercion',x=>{x.sources[0].bucket=12345;},'life_movie_invalid_bucket'],
 ['consent coercion',x=>{x.sources[0].consentRef=12345;},'life_movie_invalid_consent_ref'],
 ['rights coercion',x=>{x.sources[0].ownerOrRightsRef=12345;},'life_movie_invalid_rights_ref'],
 ['path whitespace',x=>{x.sources[0].objectPath+=' ';},'life_movie_invalid_source_path'],
 ['source ref leading whitespace',x=>{x.sources[0].sourceRefs=[' source-proof-001'];},'life_movie_invalid_source_refs'],
 ['source ref trailing whitespace',x=>{x.sources[0].sourceRefs=['source-proof-001 '];},'life_movie_invalid_source_refs'],
 ['audio role not allowed',x=>{x.audioCues[0].role='not-a-role';},'life_movie_invalid_audio_role'],
 ['audio role omitted',x=>{delete x.audioCues[0].role;},'life_movie_invalid_audio_role'],
 ['audio offset max',x=>{x.audioCues[0].sourceStartMs=2700001;},'life_movie_invalid_audio_source_start'],
 ['audio offset negative',x=>{x.audioCues[0].sourceStartMs=-1;},'life_movie_invalid_audio_source_start'],
 ['audio offset decimal',x=>{x.audioCues[0].sourceStartMs=0.5;},'life_movie_invalid_audio_source_start'],
 ['audio offset infinite',x=>{x.audioCues[0].sourceStartMs=Infinity;},'life_movie_invalid_audio_source_start'],
 ['generation required',x=>{delete x.sources[0].generation;},'life_movie_invalid_source_shape'],
 ['generation not zero',x=>{x.sources[0].generation='0';},'life_movie_invalid_source_generation'],
 ['mime allowlist',x=>{x.sources[0].mimeType='application/octet-stream';},'life_movie_invalid_source_mime'],
 ['provenance allowlist',x=>{x.sources[0].provenance='unverified';},'life_movie_invalid_source_provenance'],
 ['tenant source isolation',x=>{x.sources[0].objectPath='tenants/foreign/raw/source01.mp4';},'life_movie_source_outside_tenant'],
 ['surplus field',x=>{x.sources[0].adminApproval=true;},'life_movie_invalid_source_shape'],
 ['timeline offset max',x=>{x.timeline[0].sourceStartMs=2700001;},'life_movie_invalid_timeline_source_start'],
];
for(const [name,mutate,code] of checks)deny(mutate,code);
const original=build();
assert.equal(original.payload.sources[0].generation,'17');
assert.equal(original.payload.timeline[0].sourceStartMs,100);
assert.equal(original.payload.audioCues[0].role,'narration');
assert.equal(original.dispatchAuthorized,false);
assert.equal(original.providerGenerationAuthorized,false);
assert.equal(original.publicReleaseAuthorized,false);
assert.equal(Object.hasOwn(original,'consent'),false);
assert.equal(build(x=>{x.projectId='p'.repeat(116);}).idempotencyKey.length,160);
assert.equal(build(x=>{x.tenantId='t'.repeat(128);x.sources[0].objectPath='tenants/'+x.tenantId+'/raw/source01.mp4';}).payload.sources[0].objectPath.split('/')[1].length,128);
assert.equal(build(x=>{x.sources[0].bucket='a'.repeat(255);}).payload.sources[0].bucket.length,255);
assert.equal(build(x=>{x.audioCues[0].sourceStartMs=2700000;}).payload.audioCues[0].sourceStartMs,2700000);
for(const role of ['narration','dialogue','music','ambience','foley','effects'])assert.equal(build(x=>{x.audioCues[0].role=role;}).payload.audioCues[0].role,role);
assert.notEqual(original.payload.renderPlanDigest,build(x=>{x.sources[0].generation='18';}).payload.renderPlanDigest);
const absent=build(x=>{delete x.timeline[0].sourceStartMs;});
const zero=build(x=>{x.timeline[0].sourceStartMs=0;});
assert.equal(Object.hasOwn(absent.payload.timeline[0],'sourceStartMs'),false);
assert.notEqual(absent.payload.renderPlanDigest,zero.payload.renderPlanDigest);
deny(x=>{x.audioCues=[];x.sources[0].mimeType='image/jpeg';x.timeline[0].sourceStartMs=10;},'life_movie_image_source_offset_not_allowed');
const mutated=fixture();const built=buildEnvelope(mutated);
mutated.sources[0].sourceRefs[0]='changed-after-hash';
assert.equal(built.payload.sources[0].sourceRefs[0],'source-proof-001');
console.log('R931 Studio→Jobs constructed output-prefix boundary: 35 checks PASS; no consent issued or dispatch enabled');
