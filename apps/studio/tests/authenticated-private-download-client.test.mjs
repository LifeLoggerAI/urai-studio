import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

// Compile the actual clients, route, Firebase identity and server-owned role
// checks. All identities and byte transports below are synthetic fixtures.
const require = createRequire(import.meta.url), ts = require('typescript');
const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const data = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const key = Symbol.for('urai.studio.authenticated-download-fixture');
const oldState = globalThis[key], oldFetch = globalThis.fetch, oldWindow = globalThis.window, oldNow = Date.now;
const envKeys = ['NODE_ENV', 'URAI_STUDIO_JOBS_DISPATCH_ENABLED', 'URAI_STUDIO_LONGFORM_DISPATCH_ENABLED', 'URAI_JOBS_BRIDGE_URL', 'URAI_JOBS_LONGFORM_BRIDGE_URL', 'URAI_STUDIO_JOBS_BRIDGE_TOKEN'];
const oldEnv = Object.fromEntries(envKeys.map(name => [name, process.env[name]]));
const state = globalThis[key] = {};
const fixture = data(`export const state = globalThis[Symbol.for('urai.studio.authenticated-download-fixture')];`);
const app = data(`import {state} from '${fixture}'; export const getApp = () => ({options:{projectId:'demo-urai-studio'}});`);
const authSdk = data(`import {state} from '${fixture}'; export const getAuth = () => ({get currentUser(){return state.userAvailable ? state.user : null;}});`);
const functionsSdk = data(`import {state} from '${fixture}'; export const getFunctions = () => ({}); export const httpsCallable = (_f,name) => async input => { state.callables.push({name,input}); await state.onDescriptorRead?.(); return {data:state.exportDescriptor}; };`);
const exportClient = await import(data(compile(read('lib/studio-export-download-client.ts'))
  .replaceAll('firebase/app', app).replaceAll('firebase/auth', authSdk).replaceAll('firebase/functions', functionsSdk)));
const browserClient = await import(data(compile(read('lib/studio-private-media-browser.ts')).replaceAll('firebase/app', app).replaceAll('firebase/auth', authSdk)));
const serverOnly = data('export {};');
const admin = data(`import {state} from '${fixture}';
export const firebaseAdminStatus={mode:'synthetic-test-only'};
export const adminAuth={async verifyIdToken(token,revoked){state.checks.push({token,revoked}); if(state.revoked||token!=='synthetic-user-token') throw new Error('synthetic private credential details'); return structuredClone(state.decoded);}};
export const adminDb={doc(path){return {async get(){state.paths.push(path);
  if(path.startsWith('studioDataRightsOwnerFences/'))return {exists:state.fenceExists,data:()=>structuredClone(state.fence)};
  state.roleReads++;await state.onRoleRead?.();return {exists:state.exists,data:()=>structuredClone(state.role)};
}};}};`);
const studioAuth = data(compile(read('lib/studio-auth.ts')).replaceAll('@/lib/firebase-admin', admin));
const ownerAuth = data(compile(read('lib/studio-life-movie-longform-auth.ts')).replaceAll('server-only', serverOnly)
  .replaceAll('@/lib/firebase-admin', admin).replaceAll('@/lib/studio-auth', studioAuth));
const contract = data(compile(read('lib/studio-life-movie-longform-contract.ts')));
const serverClient = data(compile(read('lib/studio-private-media-delivery.ts')).replaceAll('server-only', serverOnly));
const next = data(`export const NextResponse={json(body,init){return new Response(JSON.stringify(body),{...init,headers:{...init.headers,'content-type':'application/json'}});}};`);
const route = await import(data(compile(read('app/api/studio/video-factory/private-media/route.ts'))
  .replaceAll('next/server', next).replaceAll('@/lib/studio-life-movie-longform-auth', ownerAuth)
  .replaceAll('@/lib/studio-life-movie-longform-contract', contract).replaceAll('@/lib/studio-private-media-delivery', serverClient)));
const project = 'demo-urai-studio', exportUrl = () => `https://us-central1-${project}.cloudfunctions.net/downloadStudioDataExport?requestId=synthetic-export&expiresAt=${Date.now()+240_000}&authorityHash=${'a'.repeat(64)}`;
function reset() {
  Date.now=oldNow;
  Object.assign(state, { userAvailable:true, tokenCalls:[], callables:[], calls:[], checks:[], paths:[], roleReads:0, revoked:false, exists:true, fenceExists:false, fence:{uid:'synthetic-owner',active:false,permanent:false}, onRoleRead:null, onTokenRead:null, onDescriptorRead:null,
    decoded:{uid:'synthetic-owner',tenantId:'synthetic-tenant'}, role:{uid:'synthetic-owner',role:'owner',disabled:false},
    exportDescriptor:{requiresAuthorization:true,requestId:'synthetic-export',url:exportUrl()} });
  state.user={uid:'synthetic-owner',getIdToken:async force=>{state.tokenCalls.push(force);await state.onTokenRead?.();return 'synthetic-user-token';}};
  process.env.NODE_ENV='production'; process.env.URAI_STUDIO_JOBS_DISPATCH_ENABLED='true'; process.env.URAI_STUDIO_LONGFORM_DISPATCH_ENABLED='true';
  process.env.URAI_JOBS_BRIDGE_URL='https://jobs.example.test/studioLifeMovieBridge';
  process.env.URAI_JOBS_LONGFORM_BRIDGE_URL='https://jobs.example.test/studioLifeMovieLongformBridge';
  process.env.URAI_STUDIO_JOBS_BRIDGE_TOKEN='synthetic-server-only-token';
  globalThis.window={location:{origin:'https://studio.example.test'}};
  globalThis.fetch=async (url,options)=>{state.calls.push({url:String(url),options});return new Response('{"synthetic":true}',{headers:{'Content-Type':'application/json'}});};
}
const descriptor = (form='short',kind='mp4') => ({schemaVersion:'urai-authenticated-private-media-v1',requiresAuthorization:true,action:'deliver',kind,
  authorityHash:'b'.repeat(64),expiresAt:Date.now()+240_000,generation:'1',disposition:'inline',
  ...(form==='short'?{jobId:'synthetic-job-001'}:{planId:`lmp_${'a'.repeat(24)}`,artifact:'final'})});
const request = (value, token=true) => new Request('https://studio.example.test/api/studio/video-factory/private-media/',{method:'POST',
  headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer synthetic-user-token'}:{}),'x-urai-user-id':'foreign-owner','x-urai-tenant-id':'foreign-tenant'},body:JSON.stringify(value)});
let cases=0;
try {
  reset();
  const blob=await exportClient.downloadStudioDataExport('synthetic-export'); assert.equal(await blob.text(),'{"synthetic":true}');
  assert.deepEqual(state.tokenCalls,[true]); assert.deepEqual(state.callables,[{name:'getStudioDataExportDownload',input:{requestId:'synthetic-export'}}]);
  assert.equal(state.calls[0].options.headers.Authorization,'Bearer synthetic-user-token');
  for(const name of ['cache','credentials','redirect','referrerPolicy']) assert.equal(state.calls[0].options[name],{cache:'no-store',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer'}[name]); cases++;
  for(const change of [url=>url.replace('demo-urai-studio.cloudfunctions.net','foreign-project.cloudfunctions.net'),url=>url.replace('https:','http:'),
    url=>url.replace('/downloadStudioDataExport','/other'),url=>url.replace('.net/', '.net:4430/'),url=>url.replace('https://','https://user:password@'),
    url=>`${url}#private`,url=>`${url}&requestId=foreign`,url=>`${url}&redirect=https://foreign.example/`]) {
    reset(); let tokens=0; await assert.rejects(exportClient.fetchAuthorizedStudioExport({url:change(exportUrl()),projectId:project,assertCurrentSession:()=>{},getIdToken:async()=>{tokens++;return 'synthetic-user-token';}}));
    assert.equal(tokens,0); assert.equal(state.calls.length,0); cases++;
  }
  for(const change of [()=>{state.userAvailable=false;},()=>{state.exportDescriptor.requiresAuthorization=false;},()=>{state.exportDescriptor.requestId='foreign-request';}]) {
    reset();change();await assert.rejects(exportClient.downloadStudioDataExport('synthetic-export'));assert.equal(state.calls.length,0);cases++;
  }
  reset();globalThis.fetch=async()=>new Response(new Uint8Array(16*1024*1024+1),{headers:{'Content-Type':'application/json'}});
  await assert.rejects(exportClient.downloadStudioDataExport('synthetic-export'));cases++;
  reset();globalThis.fetch=async()=>new Response('',{headers:{'Content-Type':'application/json'}});
  await assert.rejects(exportClient.downloadStudioDataExport('synthetic-export'));cases++;
  for(const form of ['short','long']) for(const kind of ['mp4','srt']) {
    reset();globalThis.fetch=async(url,options)=>{state.calls.push({url:String(url),options,input:JSON.parse(options.body)});
      return new Response('synthetic-private-bytes',{headers:{'Content-Type':kind==='mp4'?'video/mp4':'application/x-subrip'}});};
    const d=descriptor(form,kind), result=await route.POST(request({bridge:form==='short'?'short':'longform',delivery:d}));
    assert.equal(result.status,200);assert.equal(await result.text(),'synthetic-private-bytes');assert.equal(state.calls.length,1);
    const call=state.calls[0];assert.equal(call.input.userId,'synthetic-owner');assert.equal(call.input.tenantId,'synthetic-tenant');
    assert.equal(call.input.requiresAuthorization,undefined);assert.equal(call.input.schemaVersion,undefined);
    assert.equal(call.options.headers.authorization,'Bearer synthetic-server-only-token');assert.equal(call.options.redirect,'error');
    assert.equal(call.options.credentials,'omit');assert.ok(state.checks.some(check=>check.revoked===true));
    assert.match(result.headers.get('cache-control'),/no-store/);cases++;
  }
  for(const [change,status] of [[value=>{value.userId='foreign-owner';},503],[value=>{value.delivery.url='https://foreign.example/';},503],[value=>{value.delivery.authorityHash='caller-approval';},503],
    [value=>{value.delivery.generation='0';},503],[value=>{value.delivery.expiresAt=Date.now()-1;},503],[()=>{state.revoked=true;},403],[()=>{state.role.role='viewer';},403],
    [()=>{state.role.disabled=true;},403],[()=>{delete state.decoded.tenantId;},403],[()=>{process.env.URAI_STUDIO_JOBS_DISPATCH_ENABLED='false';},503],
    [()=>{state.fenceExists=true;state.fence.active=true;},403],[()=>{state.fenceExists=true;state.fence.permanent=true;},403],
    [()=>{state.fenceExists=true;state.fence.uid='foreign-owner';},403]]) {
    reset();const value={bridge:'short',delivery:descriptor()};change(value);const result=await route.POST(request(value));
    assert.equal(result.status,status);assert.equal(state.calls.length,0);
    assert.equal((await result.json()).error,status===403?'private_media_verified_authority_required':'private_media_delivery_unavailable');cases++;
  }
  reset();assert.equal((await route.POST(request({bridge:'short',delivery:descriptor()},false))).status,403);assert.equal(state.calls.length,0);cases++;
  reset();state.onRoleRead=async()=>{state.revoked=true;};
  assert.equal((await route.POST(request({bridge:'short',delivery:descriptor()}))).status,403);assert.equal(state.calls.length,0);cases++;
  for(const reason of ['token','role','owner','tenant','deletion','metadata-await','role-await-token','cancel']) {
    reset();const source=new ReadableStream({pull(out){if(reason==='metadata-await') state.revoked=true;out.enqueue(new Uint8Array(3*64*1024));out.close();}}, {highWaterMark:0});
    if(reason==='role-await-token')state.onRoleRead=async()=>{if(state.roleReads===2)state.revoked=true;};
    globalThis.fetch=async()=>new Response(source,{headers:{'Content-Type':'video/mp4'}});
    const result=await route.POST(request({bridge:'short',delivery:descriptor()}));
    if(reason==='role-await-token'){assert.equal(result.status,503);assert.equal(state.calls.length,0);cases++;continue;}
    assert.equal(result.status,200);
    const reader=result.body.getReader();
    if(['metadata-await','role-await-token'].includes(reason)){await assert.rejects(reader.read());}
    else {
      const first=await reader.read();assert.equal(first.value.byteLength,64*1024);
      if(reason==='token')state.revoked=true;if(reason==='role')state.role.role='viewer';if(reason==='owner')state.decoded.uid='foreign-owner';if(reason==='tenant')state.decoded.tenantId='foreign-tenant';
      if(reason==='deletion'){state.fenceExists=true;state.fence.active=true;}
      if(reason==='cancel')await reader.cancel();else await assert.rejects(reader.read());
    }
    cases++;
  }
  reset();globalThis.fetch=async(url,options)=>{state.calls.push({url:String(url),options});return new Response('synthetic-video',{headers:{'Content-Type':'video/mp4'}});};
  const browserBlob=await browserClient.downloadStudioPrivateMedia('short',descriptor());
  assert.equal(await browserBlob.text(),'synthetic-video');assert.equal(state.calls[0].url,'https://studio.example.test/api/studio/video-factory/private-media/');
  assert.equal(state.calls[0].options.headers.Authorization,'Bearer synthetic-user-token');assert.equal(state.calls[0].options.credentials,'omit');assert.equal(state.calls[0].options.redirect,'error');cases++;
  assert.deepEqual(state.tokenCalls,[true]);
  for(const consumer of ['export','media']) for(const change of ['token','fetch','stream','same-uid-session']) {
    reset();const mime=consumer==='export'?'application/json':'video/mp4';
    if(change==='token')state.onTokenRead=async()=>{state.userAvailable=false;};
    globalThis.fetch=async(url,options)=>{state.calls.push({url:String(url),options});
      if(change==='fetch')state.userAvailable=false;
      if(['stream','same-uid-session'].includes(change))return new Response(new ReadableStream({pull(out){
        out.enqueue(new TextEncoder().encode('synthetic-private-body'));out.close();
        if(change==='same-uid-session')state.user={...state.user};else state.userAvailable=false;
      }},{highWaterMark:0}),{headers:{'Content-Type':mime}});
      return new Response('synthetic-private-body',{headers:{'Content-Type':mime}});
    };
    await assert.rejects(consumer==='export'?exportClient.downloadStudioDataExport('synthetic-export'):browserClient.downloadStudioPrivateMedia('short',descriptor()));
    if(change==='token')assert.equal(state.calls.length,0);cases++;
  }
  reset();state.onDescriptorRead=async()=>{state.userAvailable=false;};
  await assert.rejects(exportClient.downloadStudioDataExport('synthetic-export'));assert.equal(state.tokenCalls.length,0);assert.equal(state.calls.length,0);cases++;
  reset();const lateDescriptor=descriptor(), now=oldNow();state.onTokenRead=async()=>{Date.now=()=>now+50_001;};
  await assert.rejects(browserClient.downloadStudioPrivateMedia('short',lateDescriptor));assert.equal(state.calls.length,0);cases++;
  reset();const serverDescriptor=descriptor(), serverNow=oldNow();state.onRoleRead=async()=>{Date.now=()=>serverNow+50_001;};
  assert.equal((await route.POST(request({bridge:'short',delivery:serverDescriptor}))).status,503);assert.equal(state.calls.length,0);cases++;
  console.log(`[PASS] ${cases} actual authenticated Studio export/media client and route cases; endpoint rejection before token, server-bound identity, live revocation/role fences and bounded streams; provider calls=0`);
} finally {
  Date.now=oldNow;globalThis.fetch=oldFetch;if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;
  if(oldState===undefined)delete globalThis[key];else globalThis[key]=oldState;
  for(const [name,value] of Object.entries(oldEnv)){if(value===undefined)delete process.env[name];else process.env[name]=value;}
}
