import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import ts from 'typescript';

const nodeRequire=createRequire(import.meta.url);
const load=(path,deps={})=>{
  const code=fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
  const js=ts.transpileModule(code,{compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports={};
  new Function('exports','require',js)(exports,name=>{
    if(Object.hasOwn(deps,name))return deps[name];
    return nodeRequire(name);
  });
  return exports;
};
const hash=value=>createHash('sha256').update(value).digest('hex');
const state={};
const VIDEO=Buffer.from('Synthetic small video payload for handler transport, not a decodable film');
const SRT=Buffer.from('1\n00:00:00,000 --> 00:00:00,900\nFictional memory caption\n');
const PLAN='lmp_'+('a'.repeat(20)),SCENE='a'.repeat(64),RENDER='b'.repeat(64);
const TOKEN='a'.repeat(45)+'.'+'b'.repeat(45)+'.'+'c'.repeat(45);
let bridgeUrl='';
const savedEnv=Object.fromEntries(['NODE_ENV','URAI_STUDIO_SPATIAL_PRIVATE_DELIVERY_ENABLED',
 'URAI_STUDIO_SPATIAL_IDENTITY_ENABLED','URAI_STUDIO_SPATIAL_MEMORY_PLAN_ENABLED',
 'URAI_SPATIAL_BRIDGE_PROJECT_ID','URAI_STUDIO_LONGFORM_DISPATCH_ENABLED',
 'URAI_JOBS_LONGFORM_BRIDGE_URL','URAI_STUDIO_JOBS_BRIDGE_TOKEN'].map(k=>[k,process.env[k]]));
const studioAdmin={
 firebaseAdminStatus:{mode:'synthetic-test-only'},
 adminAuth:{async verifyIdToken(token){
   if(token!=='studio-token-a'||state.studioRevoked||state.studioUnavailable)throw Error('studio-auth-failed');
   return {uid:state.studioUid,tenantId:state.studioTenant};
 }},
 adminDb:{doc(path){return{async get(){
   if(state.studioUnavailable)throw Error('studio-data-unavailable');
   let value=null;
   if(path==='studioUsers/studio-a')value={uid:'studio-a',role:state.studioRole,disabled:false};
   if(path==='memberships/studio-a_tenant-a'&&state.membershipActive)
     value={uid:'studio-a',studioId:'tenant-a',role:'owner'};
   if(path==='studioSpatialAccountLinks/'+state.linkId&&!state.linkRevoked)value=state.link;
   if(path.startsWith('studioDataRightsOwnerFences/')&&state.studioFenced)
     value={uid:'studio-a',active:true,permanent:false};
   return{exists:value!==null,data:()=>value};
 }}}}
};
const spatialApp={name:'urai-spatial-cross-project-identity-readonly',options:{projectId:'urai-4dc1d'}};
const appSdk={
 applicationDefault:()=>({}),getApp:()=>({options:{projectId:'urai-studio'}}),
 getApps:()=>[spatialApp],initializeApp:()=>spatialApp
};
const spatialAuthSdk={getAuth:()=>({async verifyIdToken(token,checkRevoked){
 if(!checkRevoked||token!==TOKEN||state.spatialRevoked||state.spatialUnavailable)
   throw Error('spatial-auth-failed');
 return{uid:state.spatialUid,sub:state.spatialUid,aud:state.spatialAudience,
   iss:'https://securetoken.google.com/urai-4dc1d'};
}})};
const spatialDbSdk={getFirestore:()=>({
 doc(path){return{async get(){
   if(state.spatialUnavailable)throw Error('spatial-read-failed');
   const value=state.docs[path]??null;
   return{exists:value!==null,data:()=>value,get:key=>value?.[key]};
 }}},
 collection(){return{where(){return{limit(){return{async get(){
   if(state.spatialUnavailable)throw Error('spatial-read-failed');
   return{empty:!state.pendingDeletion};
 }}}}}}}
})};
const NextResponse={json(value,init){
 return new Response(JSON.stringify(value),{...init,headers:{...init.headers,'content-type':'application/json'}});
}};
const contract=load('lib/studio-life-movie-longform-contract.ts');
const studioAuth=load('lib/studio-auth.ts',{'@/lib/firebase-admin':studioAdmin});
const longAuth=load('lib/studio-life-movie-longform-auth.ts',{
 'server-only':{},'@/lib/firebase-admin':studioAdmin,'@/lib/studio-auth':studioAuth});
const link=load('lib/studio-spatial-account-link.ts');
const binding=load('lib/studio-spatial-life-movie-contract.ts',{
 './studio-life-movie-longform-contract':contract});
const playback=load('lib/studio-spatial-private-playback.ts');
const longClient=load('lib/studio-life-movie-longform-client.ts',{
 'server-only':{},'./studio-life-movie-longform-contract':contract});
const route=load('app/api/studio/spatial-private-media/route.ts',{
 'next/server':{NextResponse},
 'firebase-admin/app':appSdk,
 'firebase-admin/auth':spatialAuthSdk,
 'firebase-admin/firestore':spatialDbSdk,
 '@/lib/firebase-admin':studioAdmin,
 '@/lib/studio-life-movie-longform-auth':longAuth,
 '@/lib/studio-spatial-account-link':link,
 '@/lib/studio-spatial-life-movie-contract':binding,
 '@/lib/studio-spatial-private-playback':playback,
 '@/lib/studio-life-movie-longform-client':longClient,
 '@/lib/studio-life-movie-longform-contract':contract,
});
function playlist(){
 const expiresAt=Date.now()+60000;
 const descriptor=kind=>({schemaVersion:'urai-authenticated-private-media-v1',
  requiresAuthorization:true,action:'deliver',kind,planId:PLAN,artifact:'final',
  generation:'77',disposition:'inline',authorityHash:'c'.repeat(64),expiresAt});
 const asset=kind=>({delivery:descriptor(kind),
  mimeType:kind==='mp4'?'video/mp4':'application/x-subrip',
  checksum:hash(kind==='mp4'?VIDEO:SRT)});
 const video=asset('mp4'),subtitles=asset('srt');
 const segment={index:0,startMs:0,endMs:900,gapBeforeMs:0,
  videoChecksum:video.checksum,subtitleChecksum:subtitles.checksum};
 const playlistDigest=hash(JSON.stringify({
  schemaVersion:'urai-life-movie-private-playlist-v1',
  planId:PLAN,renderPlanDigest:RENDER,sceneTruthDigest:SCENE,
  segments:[segment]}));
 return{schemaVersion:'urai-life-movie-private-playlist-v1',
  planId:PLAN,sceneTruthDigest:SCENE,renderPlanDigest:RENDER,
  publicReleaseAuthorized:false,playlistDigest,
  expiresAt:new Date(expiresAt).toISOString(),
  finalFile:{video,subtitles},segments:[{...segment,video,subtitles}]};
}
function jobStatus(){
 return{planId:PLAN,status:'SUCCESS',consentRevoked:false,
  publicReleaseAuthorized:false,assembly:{status:'SUCCESS'},
  sceneTruthDigest:SCENE,renderPlanDigest:RENDER,
  sourceBinding:{sourceSystem:'urai-studio',ownerUid:'studio-a',
   tenantId:'tenant-a',processingPurpose:'life-movie.render',
   sceneTruthDigest:SCENE,renderPlanDigest:RENDER,
   sceneTruthReceiptRef:'receipt-scene-a'}};
}
function reset(){
 Object.assign(state,{requests:[],docs:{},studioUid:'studio-a',
  studioTenant:'tenant-a',spatialUid:'spatial-a',spatialAudience:'urai-4dc1d',
  studioRevoked:false,studioUnavailable:false,studioFenced:false,
  studioRole:'owner',membershipActive:true,linkRevoked:false,
  spatialRevoked:false,spatialUnavailable:false,pendingDeletion:false,
  jobsUnavailable:false,jobsWrongOwner:false,jobsWrongPurpose:false,
  jobsWrongPlan:false,playlistMutation:null,corruptVideo:false,
  largeVideo:false,revokeOnPlayback:false,revokeOnDelivery:false,deliveryCount:0});
 state.linkId=link.studioSpatialLinkId('studio-a','tenant-a','spatial-a');
 state.link={schemaVersion:'urai-studio-spatial-account-link-v1',
  status:'active',provisionedBy:'trusted-server',studioUid:'studio-a',
  tenantId:'tenant-a',spatialUid:'spatial-a',spatialProjectId:'urai-4dc1d',
  purpose:'life-movie.replay',revision:1,expiresAtMs:Date.now()+60000};
 state.docs['users/spatial-a']={accountStatus:'active',deleted:false};
 state.docs['users/spatial-a/memories/memory-a']={ownerId:'spatial-a',
  deleted:false,consentState:'authorized',lifeMovie:{sceneTruthPacketId:'scene-a',
   provenance:{sourceIds:['source-a']}}};
 state.docs['users/spatial-a/lifeMovies/movie-a']={id:'movie-a',
  ownerId:'spatial-a',status:'ready',consentState:'authorized',
  lifeModelSchemaVersion:'urai-life-model-v1',
  syntheticOutputMayBecomeHistoricalSource:false,
  chapters:[{memoryId:'memory-a',sceneTruthPacketId:'scene-a',
    consentState:'authorized',provenance:{sourceIds:['source-a']}}]};
 state.docs['users/spatial-a/privacyPolicy/current']={
  ownerId:'spatial-a',version:2,revision:1,
  domains:{memory:{mode:'granted'},models:{mode:'granted'}},
  enforcement:{state:'fully-enforced'}};
 state.docs['consentRecords/spatial-a_memory_storage']={uid:'spatial-a',
  purpose:'memory.storage',consentTier:'C1',policyVersion:'1.0.0',
  status:'granted',receiptHash:'d'.repeat(64),
  expiresAt:new Date(Date.now()+60000).toISOString()};
 state.docs['users/spatial-a/sceneTruthPackets/scene-a']={sceneId:'scene-a',
  ownerId:'spatial-a',memoryId:'memory-a',schemaVersion:'urai-life-model-v1',
  state:'current',syntheticOutputMayBecomeHistoricalSource:false,
  decision:'READY',packetHash:SCENE,
  memorySourceBindingDigest:'e'.repeat(64),memorySourceIds:['source-a']};
 process.env.NODE_ENV='development';
 process.env.URAI_STUDIO_SPATIAL_PRIVATE_DELIVERY_ENABLED='true';
 process.env.URAI_STUDIO_SPATIAL_IDENTITY_ENABLED='true';
 process.env.URAI_STUDIO_SPATIAL_MEMORY_PLAN_ENABLED='true';
 process.env.URAI_SPATIAL_BRIDGE_PROJECT_ID='urai-4dc1d';
 process.env.URAI_STUDIO_LONGFORM_DISPATCH_ENABLED='true';
 process.env.URAI_STUDIO_JOBS_BRIDGE_TOKEN='fixture-server-secret';
 process.env.URAI_JOBS_LONGFORM_BRIDGE_URL=bridgeUrl;
}
function request(kind='mp4',options={}){
 return new Request('https://studio.example.test/api/studio/spatial-private-media',{
  method:'POST',
  headers:{'content-type':'application/json',
   ...(options.noStudio?{}:{authorization:options.studioToken??'Bearer studio-token-a'}),
   ...(options.noSpatial?{}:{'x-urai-spatial-id-token':options.spatialToken??TOKEN}),
   ...(options.headers??{})},
  body:JSON.stringify(options.body??{
    action:'deliver-spatial-final',memoryId:'memory-a',
    movieId:'movie-a',planId:PLAN,kind})});
}
let server,cases=0;
try{
 server=http.createServer(async(req,res)=>{
   const chunks=[];for await(const part of req)chunks.push(part);
   const input=JSON.parse(Buffer.concat(chunks).toString());
   state.requests.push(input);
   if(req.headers.authorization!=='Bearer fixture-server-secret'||
      input.userId!=='studio-a'||input.tenantId!=='tenant-a'){
      res.writeHead(403);res.end();return;
   }
   if(state.jobsUnavailable){res.destroy();return;}
   if(input.action==='status'){
      const plan=jobStatus();
      if(state.jobsWrongOwner)plan.sourceBinding.ownerUid='studio-b';
      if(state.jobsWrongPurpose)plan.sourceBinding.processingPurpose='marketing';
      if(state.jobsWrongPlan)plan.planId='lmp_'+('z'.repeat(20));
      res.writeHead(200,{'Content-Type':'application/json'});
      res.end(JSON.stringify({ok:true,plan}));return;
   }
   if(input.action==='playback'){
      const value=playlist();
      if(state.playlistMutation)state.playlistMutation(value);
      if(state.revokeOnPlayback)state.docs['users/spatial-a/privacyPolicy/current'].domains.memory.mode='denied';
      res.writeHead(200,{'Content-Type':'application/json'});
      res.end(JSON.stringify({ok:true,playback:value}));return;
   }
   if(input.action==='deliver'){
      state.deliveryCount++;
      if(state.revokeOnDelivery)state.docs['users/spatial-a/privacyPolicy/current'].domains.memory.mode='denied';
      const correct=input.kind==='mp4'?VIDEO:SRT;
      const bytes=state.corruptVideo&&input.kind==='mp4'?Buffer.from('corrupt'):correct;
      res.writeHead(200,{'Content-Type':input.kind==='mp4'?'video/mp4':'application/x-subrip',
        'Content-Disposition':'inline; filename="fixture"',
        'Cache-Control':'private, no-store',
        'Content-Length':String(state.largeVideo?65*1024*1024:bytes.length)});
      res.end(bytes);return;
   }
   res.writeHead(400);res.end();
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 bridgeUrl='http://127.0.0.1:'+server.address().port+'/studioLifeMovieLongformBridge';
 async function deny(label,setup=()=>{},options={}){
   reset();setup();
   const response=await route.POST(request('mp4',options));
   assert.equal(response.status,403,label);
   const body=Buffer.from(await response.arrayBuffer());
   assert.equal(body.includes(VIDEO),false,label+' returned video');
   assert.equal(body.includes(SRT),false,label+' returned captions');
   assert.equal(response.headers.get('cache-control'),'private, no-store, max-age=0');
   cases++;
 }
 for(const [kind,bytes,mime] of [['mp4',VIDEO,'video/mp4'],['srt',SRT,'application/x-subrip']]){
   reset();
   const response=await route.POST(request(kind));
   assert.equal(response.status,200,'authorized '+kind);
   assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes);
   assert.equal(response.headers.get('content-type'),mime);
   assert.equal(response.headers.get('content-length'),String(bytes.length));
   assert.equal(response.headers.get('cache-control'),'private, no-store, max-age=0');
   assert.equal(state.deliveryCount,1);
   assert.ok(state.requests.every(r=>r.tenantId==='tenant-a'&&r.userId==='studio-a'));
   cases++;
 }
 await deny('feature flag disabled',()=>{process.env.URAI_STUDIO_SPATIAL_PRIVATE_DELIVERY_ENABLED='false'});
 await deny('missing Studio token',undefined,{noStudio:true});
 await deny('forged Studio token',undefined,{studioToken:'Bearer forged'});
 await deny('missing Spatial token',undefined,{noSpatial:true});
 await deny('forged Spatial token',undefined,{spatialToken:'invalid.token'});
 await deny('foreign Spatial identity',()=>{state.spatialUid='spatial-b'});
 await deny('Spatial revoked',()=>{state.spatialRevoked=true});
 await deny('wrong token audience',()=>{state.spatialAudience='wrong-project'});
 await deny('foreign Studio tenant',()=>{state.studioTenant='tenant-b'});
 await deny('Studio role revoked',()=>{state.studioRole='viewer'});
 await deny('Studio membership revoked',()=>{state.membershipActive=false});
 await deny('Studio deletion fence',()=>{state.studioFenced=true});
 await deny('link missing',()=>{state.linkRevoked=true});
 await deny('link wrong purpose',()=>{state.link.purpose='marketing'});
 await deny('foreign owned memory',()=>{state.docs['users/spatial-a/memories/memory-a'].ownerId='spatial-b'});
 await deny('deleted memory',()=>{state.docs['users/spatial-a/memories/memory-a'].deleted=true});
 await deny('pending deletion',()=>{state.pendingDeletion=true});
 await deny('consent withdrawn',()=>{state.docs['users/spatial-a/privacyPolicy/current'].domains.memory.mode='denied'});
 await deny('models consent denied',()=>{state.docs['users/spatial-a/privacyPolicy/current'].domains.models.mode='denied'});
 await deny('consent expired',()=>{state.docs['consentRecords/spatial-a_memory_storage'].expiresAt=new Date(Date.now()-1000).toISOString()});
 await deny('wrong Jobs owner',()=>{state.jobsWrongOwner=true});
 await deny('wrong Jobs processing purpose',()=>{state.jobsWrongPurpose=true});
 await deny('foreign Jobs plan',()=>{state.jobsWrongPlan=true});
 await deny('SceneTruth substituted',()=>{state.docs['users/spatial-a/sceneTruthPackets/scene-a'].packetHash='f'.repeat(64)});
 await deny('Jobs provider unavailable',()=>{state.jobsUnavailable=true});
 await deny('Spatial provider unavailable',()=>{state.spatialUnavailable=true});
 await deny('Studio provider unavailable',()=>{state.studioUnavailable=true});
 await deny('playlist digest substitution',()=>{state.playlistMutation=p=>{p.playlistDigest='f'.repeat(64)}});
 await deny('caption checksum substitution',()=>{state.playlistMutation=p=>{p.finalFile.subtitles.checksum='f'.repeat(64)}});
 await deny('storage generation substitution',()=>{state.playlistMutation=p=>{p.finalFile.video.delivery.generation='0'}});
 await deny('corrupt video bytes',()=>{state.corruptVideo=true});
 await deny('oversized advertised bytes',()=>{state.largeVideo=true});
 await deny('revocation after playlist',()=>{state.revokeOnPlayback=true});
 await deny('revocation after upstream bytes',()=>{state.revokeOnDelivery=true});
 await deny('caller storage path',undefined,{body:{action:'deliver-spatial-final',
   memoryId:'memory-a',movieId:'movie-a',planId:PLAN,kind:'mp4',path:'foreign/bucket'}});
 await deny('unsupported range',undefined,{headers:{range:'bytes=0-10'}});
 await deny('foreign origin',undefined,{headers:{origin:'https://evil.example.test'}});
 assert.ok(cases>=38);
 console.log('[PASS] '+cases+' actual source handler synthetic identity/media cases with native loopback Jobs HTTP; not Firebase emulator, browser, or cloud acceptance.');
} finally{
 if(server)await new Promise(resolve=>server.close(resolve));
 for(const [name,value] of Object.entries(savedEnv)){
   if(value===undefined)delete process.env[name];else process.env[name]=value;
 }
}
