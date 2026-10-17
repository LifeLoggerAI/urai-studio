import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL('../lib/studio-spatial-private-playback.ts',import.meta.url),'utf8');
const js = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports = {};
new Function('exports','require',js)(exports,require);
const {verifiedFinalSpatialAsset, sameAuthorizedMemoryPlan, sameFinalSpatialAsset}=exports;
const planId='lmp_'+('a'.repeat(20)), now=Date.now();
const auth={ownerUid:'spatial-owner',memoryId:'memory-a',movieId:'movie-a',
  planId,sceneTruthPacketId:'scene-a',sceneTruthDigest:'a'.repeat(64),
  renderPlanDigest:'b'.repeat(64),sceneTruthReceiptRef:'receipt-a'};
const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
function fixture(){
  const expiration=now+60_000,expiresAt=new Date(expiration).toISOString();
  const descriptor=kind=>({schemaVersion:'urai-authenticated-private-media-v1',
    requiresAuthorization:true,action:'deliver',kind,authorityHash:'c'.repeat(64),
    expiresAt:expiration,generation:'123',disposition:'inline',planId,artifact:'final'});
  const entry=(kind)=>({delivery:descriptor(kind),mimeType:kind==='mp4'?'video/mp4':'application/x-subrip',
    checksum:kind==='mp4'?'d'.repeat(64):'e'.repeat(64)});
  const video=entry('mp4'),subtitles=entry('srt');
  const segment={index:0,startMs:0,endMs:1000,gapBeforeMs:0,videoChecksum:video.checksum,subtitleChecksum:subtitles.checksum};
  const playlistDigest=digest({schemaVersion:'urai-life-movie-private-playlist-v1',planId,
    renderPlanDigest:auth.renderPlanDigest,sceneTruthDigest:auth.sceneTruthDigest,segments:[segment]});
  return {ok:true,playback:{schemaVersion:'urai-life-movie-private-playlist-v1',planId,expiresAt,
    sceneTruthDigest:auth.sceneTruthDigest,renderPlanDigest:auth.renderPlanDigest,
    playlistDigest,publicReleaseAuthorized:false,finalFile:{video,subtitles},
    segments:[{...segment,video,subtitles}]}};
}
assert.equal(verifiedFinalSpatialAsset(fixture(),auth,'mp4',now).sha256,'d'.repeat(64));
assert.equal(verifiedFinalSpatialAsset(fixture(),auth,'srt',now).sha256,'e'.repeat(64));
const denial=[
['foreign plan',v=>v.playback.planId='lmp_'+('z'.repeat(20))],
['foreign SceneTruth',v=>v.playback.sceneTruthDigest='f'.repeat(64)],
['render source changed',v=>v.playback.renderPlanDigest='f'.repeat(64)],
['modified playlist digest',v=>v.playback.playlistDigest='f'.repeat(64)],
['video substituted',v=>v.playback.finalFile.video.checksum='f'.repeat(64)],
['caption substituted',v=>v.playback.finalFile.subtitles.checksum='f'.repeat(64)],
['generation malformed',v=>v.playback.finalFile.video.delivery.generation='0'],
['different token owner',v=>v.playback.finalFile.video.delivery.authorityHash='f'.repeat(64)],
['external object path injection',v=>v.playback.finalFile.video.path='gs://foreign/private'],
['public release',v=>v.playback.publicReleaseAuthorized=true],
['expired playlist',v=>v.playback.expiresAt=new Date(now-1000).toISOString()],
['foreign plan final delivery',v=>v.playback.finalFile.video.delivery.planId='lmp_'+('z'.repeat(20))],
['foreign caption final delivery',v=>v.playback.finalFile.subtitles.delivery.planId='lmp_'+('z'.repeat(20))],
['disposition changed',v=>v.playback.finalFile.video.delivery.disposition='attachment'],
['missing final',v=>v.playback.finalFile=null],
['missing segments',v=>v.playback.segments=[]],
['segment omitted caption',v=>delete v.playback.segments[0].subtitles],
['duration inconsistent',v=>v.playback.segments[0].endMs=2000],
['missing generation',v=>delete v.playback.finalFile.video.delivery.generation],
['server response denial',v=>v.ok=false],
];
for(const [name,mutate] of denial){const value=fixture();mutate(value);
  assert.throws(()=>verifiedFinalSpatialAsset(value,auth,'mp4',now),undefined,name);}
const a=fixture(),asset=verifiedFinalSpatialAsset(a,auth,'mp4',now);
const revised=structuredClone(auth);revised.ownerUid='foreign-owner';
assert.throws(()=>sameAuthorizedMemoryPlan(auth,revised),undefined, 'foreign owner');
const wrongMedia={...asset,sha256:'f'.repeat(64)};
assert.throws(()=>sameFinalSpatialAsset(asset,wrongMedia),undefined,'substituted bytes');
const route=fs.readFileSync(new URL('../app/api/studio/spatial-private-media/route.ts',import.meta.url),'utf8');
for(const marker of ['URAI_STUDIO_SPATIAL_PRIVATE_DELIVERY_ENABLED',
  'requireStudioLongformAuth(request)','verifyStudioSpatialAccountLink(identityArgs)',
  'verifyCurrentSpatialMemoryPlan({','refreshStudioLongformAuth(request, actor)',
  'callStudioLongformPrivateBytes({','sameFinalSpatialAsset(asset, latest)',
  'sameAuthorizedMemoryPlan(initial, await readAuthority())',
  'request.headers.has('+"'range'"+')','sha256: asset.sha256','Cache-Control',
])assert.ok(route.includes(marker),'Missing exact protected delivery boundary: '+marker);
assert.ok(!route.includes('createSignedUrl'));
console.log('[PASS] 24 synthetic private-media binding/denial assertions and source boundaries; not cloud acceptance');
