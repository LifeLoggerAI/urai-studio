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
let VIDEO=Buffer.from('Synthetic small video payload for handler transport, not a decodable film');
let SRT=Buffer.from('1\n00:00:00,000 --> 00:00:00,900\nFictional memory caption\n');
let PLAN='lmp_'+('a'.repeat(20));
const SCENE='a'.repeat(64),RENDER='b'.repeat(64);
const TOKEN='a'.repeat(45)+'.'+'b'.repeat(45)+'.'+'c'.repeat(45);
let bridgeUrl='';
const savedEnv=Object.fromEntries(['NODE_ENV','URAI_STUDIO_SPATIAL_PRIVATE_DELIVERY_ENABLED',
 'URAI_STUDIO_SPATIAL_IDENTITY_ENABLED','URAI_STUDIO_SPATIAL_MEMORY_PLAN_ENABLED',
 'URAI_SPATIAL_BRIDGE_PROJECT_ID','URAI_STUDIO_LONGFORM_DISPATCH_ENABLED',
 'URAI_JOBS_LONGFORM_BRIDGE_URL','URAI_STUDIO_JOBS_BRIDGE_TOKEN',
 'URAI_STUDIO_SPATIAL_ALLOWED_ORIGINS'].map(k=>[k,process.env[k]]));
const studioAdmin={
 firebaseAdminStatus:{mode:'synthetic-test-only'},
 adminAuth:{async verifyIdToken(token){
   if(!(['studio-token-a',...(process.env.URAI_STUDIO_PROTECTED_BROWSER_LOOPBACK==='true'?['synthetic-studio-token-a']:[])].includes(token))||state.studioRevoked||state.studioUnavailable)throw Error('studio-auth-failed');
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
 if(!checkRevoked||!(token===TOKEN||(process.env.URAI_STUDIO_PROTECTED_BROWSER_LOOPBACK==='true'&&token===TOKEN))||state.spatialRevoked||state.spatialUnavailable)
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
  finalFile:{video,subtitles},segments:[{...segment,
  video:{...video,delivery:{...video.delivery,artifact:'segment:0'}},
  subtitles:{...subtitles,delivery:{...subtitles.delivery,artifact:'segment:0'}}}]};
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
let server,handlerServer,cases=0;
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
   const response=await route.POST(request(options.kind??'mp4',options));
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
 // A final SRT checksum substitution must fail on the SRT delivery boundary.
 // Final MP4 remains independently authorized and is verified above.
 await deny('caption checksum substitution',()=>{state.playlistMutation=p=>{p.finalFile.subtitles.checksum='f'.repeat(64)}},{kind:'srt'});
 await deny('storage generation substitution',()=>{state.playlistMutation=p=>{p.finalFile.video.delivery.generation='0'}});
 await deny('corrupt video bytes',()=>{state.corruptVideo=true});
 await deny('oversized advertised bytes',()=>{state.largeVideo=true});
 await deny('revocation after playlist',()=>{state.revokeOnPlayback=true});
 await deny('revocation after upstream bytes',()=>{state.revokeOnDelivery=true});
 await deny('caller storage path',undefined,{body:{action:'deliver-spatial-final',
   memoryId:'memory-a',movieId:'movie-a',planId:PLAN,kind:'mp4',path:'foreign/bucket'}});
 // A timeline is private metadata, never an unvalidated caller's list.
 const timelineRequest={action:'read-spatial-timeline',memoryId:'memory-a',
   movieId:'movie-a',planId:PLAN};
 reset();
 const timelineResponse=await route.POST(request('mp4',{body:timelineRequest}));
 assert.equal(timelineResponse.status,200,'owner-authorized timeline');
 assert.match(timelineResponse.headers.get('cache-control'),/no-store/);
 const timelineEnvelope=await timelineResponse.json();
 assert.equal(timelineEnvelope.ok,true);
 assert.equal(timelineEnvelope.timeline.schemaVersion,'urai-spatial-private-segment-timeline-v1');
 assert.equal(timelineEnvelope.timeline.movieId,'movie-a');
 assert.equal(timelineEnvelope.timeline.planId,PLAN);
 assert.match(timelineEnvelope.timeline.playlistDigest,/^[a-f0-9]{64}$/);
 assert.equal(timelineEnvelope.timeline.durationMs,900);
 assert.deepEqual(timelineEnvelope.timeline.segments,[{index:0,startMs:0,endMs:900,gapBeforeMs:0}]);
 assert.equal(state.deliveryCount,0,'timeline cannot read protected bytes');
 assert.ok(!JSON.stringify(timelineEnvelope).includes('tenant-a/'),'no private storage identifiers');
 cases++;
 await deny('foreign timeline owner',()=>{state.spatialUid='spatial-b'},{body:timelineRequest});
 await deny('wrong Studio timeline tenant',()=>{state.studioTenant='tenant-b'},{body:timelineRequest});
 await deny('deleted timeline memory',()=>{state.docs['users/spatial-a/memories/memory-a'].deleted=true},{body:timelineRequest});
 await deny('revoked timeline consent',()=>{state.docs['users/spatial-a/privacyPolicy/current'].domains.memory.mode='denied'},{body:timelineRequest});
 await deny('wrong timeline plan',()=>{state.jobsWrongPlan=true},{body:timelineRequest});
 await deny('tampered timeline digest',()=>{state.playlistMutation=p=>{p.playlistDigest='f'.repeat(64)}},{body:timelineRequest});
 await deny('tampered timeline subtitle',()=>{state.playlistMutation=p=>{p.segments[0].subtitles.checksum='f'.repeat(64)}},{body:timelineRequest});
 await deny('wrong timeline generation',()=>{state.playlistMutation=p=>{p.segments[0].video.delivery.generation='0'}},{body:timelineRequest});
 await deny('unavailable timeline Jobs',()=>{state.jobsUnavailable=true},{body:timelineRequest});

 // Real exported route, synthetic Jobs HTTP and Admin. Final playback remains untouched.
 for(const kind of ['mp4','srt']){
  reset();
  const response=await route.POST(request(kind,{body:{
   action:'deliver-spatial-segment',memoryId:'memory-a',movieId:'movie-a',
   planId:PLAN,kind,segmentIndex:0}}));
  assert.equal(response.status,200,'authorized segment '+kind);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),kind==='mp4'?VIDEO:SRT);
  assert.equal(response.headers.get('x-urai-private-segment-index'),'0');
  assert.equal(response.headers.get('x-urai-private-segment-start-ms'),'0');
  assert.equal(response.headers.get('x-urai-private-segment-end-ms'),'900');
  assert.equal(state.requests.find(x=>x.action==='deliver')?.artifact,'segment:0');
  cases++;
 }
 const segmentRequest=(index=0)=>({body:{action:'deliver-spatial-segment',
   memoryId:'memory-a',movieId:'movie-a',planId:PLAN,kind:'mp4',segmentIndex:index}});
 for(const index of [-1,1,180,1.5,'0'])await deny('invalid segment '+index,undefined,segmentRequest(index));
 await deny('foreign segment owner',()=>{state.spatialUid='spatial-b'},segmentRequest());
 await deny('withdrawn segment consent',()=>{state.docs['users/spatial-a/privacyPolicy/current'].domains.memory.mode='denied'},segmentRequest());
 await deny('deleted segment memory',()=>{state.docs['users/spatial-a/memories/memory-a'].deleted=true},segmentRequest());
 await deny('tampered segment digest',()=>{state.playlistMutation=p=>{p.segments[0].video.checksum='f'.repeat(64)}},segmentRequest());
 await deny('changed segment generation',()=>{state.playlistMutation=p=>{p.segments[0].video.delivery.generation='0'}},segmentRequest());
 await deny('Jobs outage on segment',()=>{state.jobsUnavailable=true},segmentRequest());
 await deny('unsupported range',undefined,{headers:{range:'bytes=0-10'}});
 await deny('foreign origin',undefined,{headers:{origin:'https://evil.example.test'}});

 // Exercise the ACTUAL exported Studio route across a real loopback HTTP
 // request boundary; Firebase Admin and Jobs remain explicit synthetic fakes.
 // Node HTTP does not enforce browser CORS; check exact policy headers here,
 // leaving genuine Chromium CORS verification to the separate browser suite.
 handlerServer=http.createServer(async (incoming,outgoing)=>{
   try {
     const chunks=[];for await(const part of incoming)chunks.push(part);
     const headers=new Headers();
     for(const [key,value] of Object.entries(incoming.headers))
       if(typeof value==='string')headers.set(key,value);
     const target='http://127.0.0.1:'+handlerServer.address().port+incoming.url;
     const method=incoming.method;
     const testRequest=new Request(target,{method,headers,
       ...(method==='POST'?{body:Buffer.concat(chunks)}:{})});
     const result=method==='OPTIONS'?await route.OPTIONS(testRequest):
       method==='POST'?await route.POST(testRequest):
       new Response(null,{status:405});
     if(process.env.URAI_STUDIO_PROTECTED_BROWSER_LOOPBACK==='true'){
       const kind=method==='POST'?JSON.parse(Buffer.concat(chunks).toString()).kind:null;
       console.log('URAI_STUDIO_REAL_HANDLER_HTTP '+JSON.stringify({method,kind,status:result.status,
         corsOriginAllowed:result.headers.get('access-control-allow-origin')===incoming.headers.origin,
         contentLength:result.headers.get('content-length')}));
     }
     const responseBytes=Buffer.from(await result.arrayBuffer());
     if(process.env.URAI_STUDIO_PROTECTED_BROWSER_LOOPBACK==='true' &&
        method==='POST' && result.status===403) {
       assert.equal(result.headers.get('content-type'),'application/json');
       assert.match(result.headers.get('cache-control')??'',/no-store/);
       assert.equal(result.headers.get('x-urai-private-playlist-digest'),null);
       assert.equal(responseBytes.includes(VIDEO),false,'denial disclosed protected MP4');
       assert.equal(responseBytes.includes(SRT),false,'denial disclosed protected captions');
       assert.deepEqual(JSON.parse(responseBytes.toString()),{
         ok:false,error:'spatial_private_media_authority_unavailable'
       });
       console.log('URAI_STUDIO_DENIED_NO_PRIVATE_BYTES '+JSON.stringify({
         method,status:403,protectedMp4Bytes:0,protectedSrtBytes:0,
         responseKind:'fixed-json-denial'
       }));
     }
     outgoing.writeHead(result.status,Object.fromEntries(result.headers.entries()));
     outgoing.end(responseBytes);
   }catch{
     outgoing.writeHead(500,{'content-type':'text/plain','cache-control':'no-store'});
     outgoing.end('synthetic_bridge_unavailable');
   }
 });
 await new Promise(resolve=>handlerServer.listen(0,'127.0.0.1',resolve));
 const localEndpoint='http://127.0.0.1:'+handlerServer.address().port+'/api/studio/spatial-private-media';
 const allowed='https://synthetic-spatial.invalid';
 const forbidden='https://foreign-spatial.invalid';
 process.env.URAI_STUDIO_SPATIAL_ALLOWED_ORIGINS=allowed;
 const send=async(kind='mp4',extra={})=>fetch(localEndpoint,{
   method:'POST',
   headers:{origin:allowed,authorization:'Bearer studio-token-a',
     'x-urai-spatial-id-token':TOKEN,'content-type':'application/json',
     ...(extra.headers||{})},
   body:JSON.stringify(extra.body??{action:'deliver-spatial-final',memoryId:'memory-a',
     movieId:'movie-a',planId:PLAN,kind}),
 });
 reset();
 let answer=await fetch(localEndpoint,{method:'OPTIONS',
   headers:{origin:allowed,'access-control-request-method':'POST',
     'access-control-request-headers':'authorization,content-type,x-urai-spatial-id-token'}});
 assert.equal(answer.status,204,'approved original-Spatial preflight');
 assert.equal(answer.headers.get('access-control-allow-origin'),allowed);
 assert.equal(answer.headers.get('access-control-allow-methods'),'POST, OPTIONS');
 assert.ok(answer.headers.get('access-control-allow-headers').includes('x-urai-spatial-id-token'));
 assert.ok(answer.headers.get('access-control-expose-headers').includes('x-urai-private-playlist-digest'));
 for(const segmentHeader of ['x-urai-private-segment-index','x-urai-private-segment-start-ms','x-urai-private-segment-end-ms'])
   assert.ok(answer.headers.get('access-control-expose-headers').includes(segmentHeader), 'authorized segment header not exposed: '+segmentHeader);
 assert.ok(!answer.headers.has('access-control-allow-credentials'));
 cases++;
 answer=await fetch(localEndpoint,{method:'OPTIONS',headers:{origin:forbidden,
   'access-control-request-method':'POST'}});
 assert.equal(answer.status,403,'foreign browser origin preflight must fail closed');
 assert.equal(answer.headers.get('access-control-allow-origin'),null);
 cases++;
 for(const [kind,payload,mime] of [['mp4',VIDEO,'video/mp4'],['srt',SRT,'application/x-subrip']]){
   reset();answer=await send(kind);
   assert.equal(answer.status,200,'authorized Studio->Spatial synthetic '+kind);
   assert.deepEqual(Buffer.from(await answer.arrayBuffer()),payload);
   assert.equal(answer.headers.get('content-type'),mime);
   assert.equal(answer.headers.get('access-control-allow-origin'),allowed);
   assert.match(answer.headers.get('cache-control'),/no-store/);
   assert.match(answer.headers.get('vary'),/Origin/);
   assert.match(answer.headers.get('x-urai-private-playlist-digest'),/^[a-f0-9]{64}$/);
   assert.equal(state.deliveryCount,1);
   cases++;
 }
 reset();answer=await send('mp4',{body:timelineRequest});
 assert.equal(answer.status,200,'authorized timeline via exported Studio handler');
 const loopbackTimeline=await answer.json();
 assert.equal(loopbackTimeline.timeline.durationMs,900);
 assert.equal(loopbackTimeline.timeline.segments.length,1);
 assert.equal(state.deliveryCount,0);
 cases++;
 reset();answer=await send('mp4',{headers:{authorization:'Bearer studio-token-b'}});
 assert.equal(answer.status,403,'foreign Studio user denied by actual route over HTTP');
 assert.equal(Buffer.from(await answer.arrayBuffer()).includes(VIDEO),false);
 assert.equal(state.deliveryCount,0);cases++;
 reset();answer=await send('mp4',{headers:{'x-urai-spatial-id-token':'forged.spatial.token'}});
 assert.equal(answer.status,403,'forged Spatial identity denied over HTTP');
 assert.equal(Buffer.from(await answer.arrayBuffer()).includes(VIDEO),false);
 assert.equal(state.deliveryCount,0);cases++;
 reset();answer=await send('mp4',{headers:{origin:forbidden}});
 assert.equal(answer.status,403,'foreign POST origin denied over HTTP');
 assert.equal(answer.headers.get('access-control-allow-origin'),null);
 assert.equal(state.deliveryCount,0);cases++;
 reset();answer=await send('mp4');
 assert.equal(answer.status,200);await answer.arrayBuffer();
 state.docs['users/spatial-a/privacyPolicy/current'].domains.memory.mode='denied';
 const deliveredBefore=state.deliveryCount;
 answer=await send('srt');
 assert.equal(answer.status,403,'consent revoked before next caption request');
 assert.equal(Buffer.from(await answer.arrayBuffer()).includes(SRT),false);
 assert.equal(state.deliveryCount,deliveredBefore);
 cases++;
 reset();process.env.URAI_STUDIO_SPATIAL_PRIVATE_DELIVERY_ENABLED='false';
 answer=await fetch(localEndpoint,{method:'OPTIONS',headers:{origin:allowed,
   'access-control-request-method':'POST'}});
 assert.equal(answer.status,403,'feature flag revokes preflight');
 answer=await send('mp4');assert.equal(answer.status,403);
 assert.equal(state.deliveryCount,0);cases++;
 console.log('[PASS] 9 original Studio route loopback HTTP/CORS/identity/consent boundary cases; Firebase/Jobs synthetic, NOT live browser or real-cloud identity acceptance');

 assert.ok(cases>=38);
 console.log('[PASS] '+cases+' actual source handler synthetic identity/media cases with native loopback Jobs HTTP; not Firebase emulator, browser, or cloud acceptance.');

 // Optional CI-only server for the REAL original Spatial Replay Chromium client.
 // Retain the actual exported POST/OPTIONS functions and all owner/consent/Jobs
 // assertions. Only Firebase Admin and upstream Jobs remain synthetic fakes.
 if(process.env.URAI_STUDIO_PROTECTED_BROWSER_LOOPBACK==='true'){
   assert.equal(process.env.NODE_ENV,'development','private loopback proof must be nonproduction');
   assert.ok(process.env.URAI_STUDIO_PRIVATE_HANDLER_PORT_FILE,'missing isolated ready-file');
   const video=fs.readFileSync(process.env.URAI_JOBS_SYNTH_MP4);
   const captions=fs.readFileSync(process.env.URAI_JOBS_SYNTH_SRT);
   assert.equal(hash(video),'c4ba548d480d7c71fb8e9efa496f1282bb833cdbb5303c868aa2a5e685c6fe91',
     'real Jobs synthetic artifact hash must be pinned before serving');
   assert.ok(captions.length>0 && captions.length<2*1024*1024);
   assert.match(captions.toString(),/--> [0-9:,]+/);
   VIDEO=video;SRT=captions;
   reset();
   // Only the explicit local-browser test aligns fictionally provisioned
   // identities with the original Spatial Chromium fixture. Production link,
   // tenant, ownership, consent, Jobs and provenance functions are unchanged.
   PLAN='lmp_'+('a'.repeat(24));
   const mapId=value=>value.replaceAll('spatial-a','synthetic-owner')
     .replaceAll('memory-a','synthetic-receipt-memory')
     .replaceAll('movie-a','synthetic-movie');
   const mapped={};
   for(const [docPath,docValue] of Object.entries(state.docs))
     mapped[mapId(docPath)]=JSON.parse(mapId(JSON.stringify(docValue)));
   state.docs=mapped;
   state.spatialUid='synthetic-owner';
   state.linkId=link.studioSpatialLinkId('studio-a','tenant-a','synthetic-owner');
   state.link={...state.link,spatialUid:'synthetic-owner'};
   assert.equal(state.docs['users/synthetic-owner/memories/synthetic-receipt-memory'].ownerId,'synthetic-owner');
   assert.equal(state.docs['users/synthetic-owner/lifeMovies/synthetic-movie'].ownerId,'synthetic-owner');
   process.env.URAI_STUDIO_SPATIAL_ALLOWED_ORIGINS='http://127.0.0.1:4173';
   const endpoint='http://127.0.0.1:'+handlerServer.address().port;
   fs.writeFileSync(process.env.URAI_STUDIO_PRIVATE_HANDLER_PORT_FILE,
     JSON.stringify({origin:endpoint,spatialOrigin:'http://127.0.0.1:4173',
       mp4Sha256:hash(VIDEO),studioRoute:'actual-exported-handler',
       firebase:'synthetic-admin-provider',jobs:'synthetic-owner-scoped-http'})+'\n');
   console.log('URAI_STUDIO_REAL_HANDLER_READY '+endpoint);
   await new Promise(resolve=>{
     process.once('SIGTERM',resolve);process.once('SIGINT',resolve);
   });
 }
} finally{
 if(handlerServer)await new Promise(resolve=>handlerServer.close(resolve));
 if(server)await new Promise(resolve=>server.close(resolve));
 for(const [name,value] of Object.entries(savedEnv)){
   if(value===undefined)delete process.env[name];else process.env[name]=value;
 }
}
