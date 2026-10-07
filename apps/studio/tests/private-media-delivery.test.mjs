import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import * as module from 'node:module';

const require = module.createRequire(import.meta.url);
const compile = source => typeof module.stripTypeScriptTypes === 'function' ? module.stripTypeScriptTypes(source)
  : require('typescript').transpileModule(source, { compilerOptions: { module: require('typescript').ModuleKind.ESNext, target: require('typescript').ScriptTarget.ES2022 } }).outputText;
const uri = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const code = compile(fs.readFileSync(new URL('../lib/studio-private-media-delivery.ts', import.meta.url), 'utf8')).replaceAll('server-only', uri('export {};'));
const { parseStudioPrivateMedia, deliverStudioPrivateMedia } = await import(uri(code));
const routeKey=Symbol.for('urai.studio.private-media-route'),previousRouteState=globalThis[routeKey];
const routeState=globalThis[routeKey]={};
const source=name=>compile(fs.readFileSync(new URL(`../${name}`,import.meta.url),'utf8'));
const admin=uri(`const state=globalThis[Symbol.for('urai.studio.private-media-route')];
export const firebaseAdminStatus={mode:'synthetic'};
export const adminAuth={async verifyIdToken(token,checkRevoked){state.checks.push(checkRevoked);if(state.revoked&&checkRevoked)throw Error('synthetic revoked');return {...state.decoded};}};
export const adminDb={doc(){return{async get(){return{exists:true,data:()=>({...state.user})};}}}};`);
const auth=uri(source('lib/studio-auth.ts').replaceAll('@/lib/firebase-admin',admin));
const edit=uri(source('lib/studio-life-movie-longform-auth.ts').replaceAll('server-only',uri('export {};'))
  .replaceAll('@/lib/firebase-admin',admin).replaceAll('@/lib/studio-auth',auth));
const contract=uri(source('lib/studio-life-movie-longform-contract.ts'));
const next=uri(`export const NextResponse={json(body,init){return new Response(JSON.stringify(body),{...init,headers:{...init.headers,'content-type':'application/json'}});}};`);
const route=await import(uri(source('app/api/studio/video-factory/private-media/route.ts').replaceAll('next/server',next)
  .replaceAll('@/lib/studio-life-movie-longform-auth',edit).replaceAll('@/lib/studio-life-movie-longform-contract',contract)
  .replaceAll('@/lib/studio-private-media-delivery',uri(code))));
const envKeys = ['NODE_ENV','URAI_STUDIO_JOBS_DISPATCH_ENABLED','URAI_STUDIO_LONGFORM_DISPATCH_ENABLED','URAI_JOBS_BRIDGE_URL','URAI_JOBS_LONGFORM_BRIDGE_URL','URAI_STUDIO_JOBS_BRIDGE_TOKEN'];
const oldEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]])), oldFetch = globalThis.fetch;
let passed = 0, authority, calls;
const identity = { uid: 'synthetic-owner', tenantId: 'synthetic-tenant' };
function body(bridge = 'short') { return { bridge, delivery: { schemaVersion:'urai-authenticated-private-media-v1',requiresAuthorization:true,
  action:'deliver',kind:'mp4',authorityHash:'a'.repeat(64),expiresAt:Date.now()+240_000,generation:'123',disposition:'inline',
  ...(bridge === 'short' ? {jobId:'synthetic_job_001'} : {planId:`lmp_${'a'.repeat(20)}`,artifact:'final'}) } }; }
function reset() {
  authority={ok:true,...identity};calls=[];process.env.NODE_ENV='production';
  routeState.decoded={...identity};routeState.user={uid:identity.uid,role:'owner',disabled:false};routeState.revoked=false;routeState.checks=[];
  process.env.URAI_STUDIO_JOBS_DISPATCH_ENABLED='true';process.env.URAI_STUDIO_LONGFORM_DISPATCH_ENABLED='true';
  process.env.URAI_JOBS_BRIDGE_URL='https://synthetic-short.invalid/bridge';process.env.URAI_JOBS_LONGFORM_BRIDGE_URL='https://synthetic-long.invalid/bridge';
  process.env.URAI_STUDIO_JOBS_BRIDGE_TOKEN='synthetic-private-bridge-token';
  globalThis.fetch=async(url,options)=>{calls.push({url,options});return new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'video/mp4','content-length':'3'}});};
}
const request = signal => new Request('https://synthetic-studio.invalid/private-media',{method:'POST',...(signal?{signal}:{})});
const deliver = (value=body(), extra={}) => deliverStudioPrivateMedia({value,identity,request:request(),authorize:async()=>({...authority}),...extra});
async function check(name,fn){reset();await fn();passed++;console.log(`[PASS] ${name}`);}
let server;
try {
  for (const bridge of ['short','longform']) await check(`${bridge} actual source proxy injects verified identity and returns private bytes`,async()=>{
    const response=await deliver(body(bridge));assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[1,2,3]);
    const sent=JSON.parse(calls[0].options.body);assert.equal(sent.userId,identity.uid);assert.equal(sent.tenantId,identity.tenantId);
    assert.equal(sent.action,'deliver');assert.equal(sent.schemaVersion,undefined);assert.equal(sent.requiresAuthorization,undefined);
    assert.equal(calls[0].options.redirect,'error');assert.equal(calls[0].options.headers.authorization,'Bearer synthetic-private-bridge-token');
    assert.match(response.headers.get('cache-control'),/no-store/);assert.equal(response.headers.get('referrer-policy'),'no-referrer');
  });
  const mutations=[d=>{d.delivery.userId='other';},d=>{d.url='https://other.invalid';},d=>{d.delivery.requiresAuthorization=false;},
    d=>{d.delivery.schemaVersion='old-url';},d=>{d.delivery.expiresAt=Date.now()-1;},d=>{d.delivery.expiresAt=Date.now()+400_000;},
    d=>{d.delivery.generation=123;},d=>{d.delivery.kind=['mp4'];},d=>{d.delivery.authorityHash='wrong';},
    d=>{d.delivery.planId=`lmp_${'a'.repeat(20)}`;},d=>{d.delivery.disposition='inline;evil';},d=>{d.delivery.jobId='../escape';}];
  for(let i=0;i<mutations.length;i++)await check(`malformed/caller-controlled descriptor ${i} denied before token delivery`,async()=>{
    const value=body();mutations[i](value);assert.throws(()=>parseStudioPrivateMedia(value));await assert.rejects(deliver(value));assert.equal(calls.length,0);
  });
  await check('current revoked or offboarded identity denied before fetch',async()=>{authority.ok=false;await assert.rejects(deliver());assert.equal(calls.length,0);});
  await check('tenant reassignment during authority lookup prevents credential dispatch',async()=>{
    await assert.rejects(deliver(body(),{authorize:async()=>({ok:true,uid:identity.uid,tenantId:'different'})}));assert.equal(calls.length,0);
  });
  await check('configured credential changes during auth await deny before dispatch',async()=>{
    await assert.rejects(deliver(body(),{authorize:async()=>{process.env.URAI_STUDIO_JOBS_BRIDGE_TOKEN='changed';return {...authority};}}));assert.equal(calls.length,0);
  });
  await check('production insecure endpoint denied',async()=>{process.env.URAI_JOBS_BRIDGE_URL='http://localhost:1234';await assert.rejects(deliver());assert.equal(calls.length,0);});
  await check('disabled bridge denied',async()=>{process.env.URAI_STUDIO_JOBS_DISPATCH_ENABLED='false';await assert.rejects(deliver());assert.equal(calls.length,0);});
  await check('changed provisioning after fetch await releases no body',async()=>{
    globalThis.fetch=async()=>{process.env.URAI_JOBS_BRIDGE_URL='https://different.invalid/bridge';return new Response('private',{headers:{'content-type':'video/mp4'}});};await assert.rejects(deliver());
  });
  for(const change of [()=>{authority.ok=false;},()=>{process.env.URAI_STUDIO_JOBS_BRIDGE_TOKEN='changed';},()=>{authority.tenantId='different';}])await check('revocation/token/tenant mutation between64KiB deliveries stops next chunk',async()=>{
    globalThis.fetch=async()=>new Response(new Uint8Array(3*65536).fill(7),{headers:{'content-type':'video/mp4'}});
    const response=await deliver(),reader=response.body.getReader();assert.equal((await reader.read()).value.byteLength,65536);change();await assert.rejects(reader.read());
  });
  await check('empty upstream chunk is rejected',async()=>{
    globalThis.fetch=async()=>new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array());c.close();}}),{headers:{'content-type':'video/mp4'}});
    await assert.rejects((await deliver()).arrayBuffer());
  });
  await check('oversized upstream chunk stops without allocating declared whole media',async()=>{
    globalThis.fetch=async()=>new Response(new Uint8Array(1048577),{headers:{'content-type':'video/mp4'}});await assert.rejects((await deliver()).arrayBuffer());
  });
  await check('declared size beyond bound rejected before streaming',async()=>{
    globalThis.fetch=async()=>new Response('a',{headers:{'content-type':'video/mp4','content-length':'2147483649'}});await assert.rejects(deliver());
  });
  await check('wrong MIME rejected without private body delivery',async()=>{
    globalThis.fetch=async()=>new Response('a',{headers:{'content-type':'text/html'}});await assert.rejects(deliver());
  });
  await check('truncated content length cannot complete',async()=>{
    globalThis.fetch=async()=>new Response('a',{headers:{'content-type':'video/mp4','content-length':'2'}});await assert.rejects((await deliver()).arrayBuffer());
  });
  await check('request abort prevents another chunk',async()=>{
    const abort=new AbortController();globalThis.fetch=async()=>new Response(new Uint8Array(2*65536),{headers:{'content-type':'video/mp4'}});
    const response=await deliver(body(),{request:request(abort.signal)}),reader=response.body.getReader();await reader.read();abort.abort();await assert.rejects(reader.read());
  });
  await check('actual native redirect refuses replaying bridge credential',async()=>{
    let target=0;server=http.createServer((req,res)=>{if(req.url==='/target'){target++;res.end('unexpected');return;}res.writeHead(307,{location:'/target'});res.end();});
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));process.env.NODE_ENV='test';process.env.URAI_JOBS_BRIDGE_URL=`http://127.0.0.1:${server.address().port}/redirect`;
    globalThis.fetch=oldFetch;await assert.rejects(deliver());assert.equal(target,0);await new Promise(resolve=>server.close(resolve));server=undefined;
  });
  const post=(headers={authorization:'Bearer synthetic-current-token'})=>route.POST(new Request('https://synthetic-studio.invalid/private-media',
    {method:'POST',headers:{...headers,'content-type':'application/json'},body:JSON.stringify(body())}));
  await check('actual route/current Firebase authority reaches byte adapter with server-owned identity',async()=>{
    const response=await post();assert.equal(response.status,200);assert.equal((await response.arrayBuffer()).byteLength,3);
    assert.ok(routeState.checks.some(value=>value===true));assert.equal(JSON.parse(calls[0].options.body).userId,identity.uid);
  });
  await check('actual route local/header identity fallback cannot deliver',async()=>{
    process.env.NODE_ENV='test';const response=await post({'x-urai-user-id':identity.uid,'x-urai-tenant-id':identity.tenantId});
    assert.equal(response.status,403);assert.equal(calls.length,0);
  });
  await check('actual route revoked Firebase token cannot deliver',async()=>{routeState.revoked=true;assert.equal((await post()).status,403);assert.equal(calls.length,0);});
  await check('actual route viewer role cannot deliver',async()=>{routeState.user.role='viewer';assert.equal((await post()).status,403);assert.equal(calls.length,0);});
  await check('actual route edit-role offboarding during stream stops next64KiB',async()=>{
    globalThis.fetch=async()=>new Response(new Uint8Array(2*65536),{headers:{'content-type':'video/mp4'}});
    const response=await post(),reader=response.body.getReader();assert.equal((await reader.read()).value.byteLength,65536);
    routeState.user.disabled=true;await assert.rejects(reader.read());
  });
  await check('actual route tenant claim correction during stream stops next64KiB',async()=>{
    globalThis.fetch=async()=>new Response(new Uint8Array(2*65536),{headers:{'content-type':'video/mp4'}});
    const response=await post(),reader=response.body.getReader();await reader.read();routeState.decoded.tenantId='other';await assert.rejects(reader.read());
  });
  console.log(`[PASS] ${passed} actual private media adapter/stream boundary cases; provider calls/spending/private media=0`);
} finally {globalThis.fetch=oldFetch;if(previousRouteState===undefined)delete globalThis[routeKey];else globalThis[routeKey]=previousRouteState;
  for(const key of envKeys){if(oldEnv[key]===undefined)delete process.env[key];else process.env[key]=oldEnv[key];}if(server)await new Promise(resolve=>server.close(resolve));}
