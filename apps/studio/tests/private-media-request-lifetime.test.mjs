import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as module from 'node:module';

// Execute the original route, JSON reader and delivery adapter. Only Firebase
// authority, NextResponse and the upstream HTTP boundary are synthetic here.
// No real tokens, private media, provider requests or release approval.
const require = module.createRequire(import.meta.url);
const compile = source => typeof module.stripTypeScriptTypes === 'function' ? module.stripTypeScriptTypes(source)
  : require('typescript').transpileModule(source, { compilerOptions: { module: require('typescript').ModuleKind.ESNext, target: require('typescript').ScriptTarget.ES2022 } }).outputText;
const uri = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const source = name => compile(fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8'));
const key = Symbol.for('urai.studio.private-media-request-lifetime');
const previousState = globalThis[key];
const state = globalThis[key] = {};
const authority = uri(`const s=globalThis[Symbol.for('urai.studio.private-media-request-lifetime')];
export async function requireStudioLongformAuth(){s.authCalls++;await s.onAuth?.();return {...s.identity,ok:s.allowed};}`);
const next = uri(`export const NextResponse={json(body,init){return new Response(JSON.stringify(body),{...init,headers:{...init.headers,'content-type':'application/json'}});}};`);
const contract = uri(source('lib/studio-life-movie-longform-contract.ts'));
const delivery = uri(source('lib/studio-private-media-delivery.ts').replaceAll('server-only', uri('export {};')));
const route = await import(uri(source('app/api/studio/video-factory/private-media/route.ts')
  .replaceAll('next/server', next).replaceAll('@/lib/studio-life-movie-longform-auth', authority)
  .replaceAll('@/lib/studio-life-movie-longform-contract', contract).replaceAll('@/lib/studio-private-media-delivery', delivery)));
const keys = ['NODE_ENV','URAI_STUDIO_JOBS_DISPATCH_ENABLED','URAI_JOBS_BRIDGE_URL','URAI_STUDIO_JOBS_BRIDGE_TOKEN'];
const oldEnv = Object.fromEntries(keys.map(name => [name, process.env[name]]));
const realNow = Date.now, oldFetch = globalThis.fetch;
const encoder = new TextEncoder();
let passed = 0;
const failures = [];
function reset() {
  Date.now = realNow;
  Object.assign(state, {identity:{uid:'synthetic-owner',tenantId:'synthetic-tenant'},allowed:true,onAuth:null,authCalls:0,fetchCalls:0});
  process.env.NODE_ENV='production';process.env.URAI_STUDIO_JOBS_DISPATCH_ENABLED='true';
  process.env.URAI_JOBS_BRIDGE_URL='https://synthetic-jobs.invalid/bridge';
  process.env.URAI_STUDIO_JOBS_BRIDGE_TOKEN='synthetic-token';
  globalThis.fetch=async(_url,options)=>{state.fetchCalls++;state.sent=JSON.parse(options.body);
    return new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'video/mp4','content-length':'3'}});};
}
function descriptor() {
  return {bridge:'short',delivery:{schemaVersion:'urai-authenticated-private-media-v1',requiresAuthorization:true,
    action:'deliver',kind:'mp4',authorityHash:'a'.repeat(64),expiresAt:Date.now()+240_000,
    generation:'123',disposition:'inline',jobId:'synthetic_job_001'}};
}
function request(body, extra={}) {
  return new Request('https://synthetic-studio.invalid/private-media',{
    method:'POST',headers:{'content-type':'application/json'},body,...extra});
}
function stalled(signal) {
  let controller, begun;
  const started = new Promise(resolve=>{begun=resolve;});
  const stats={cancelled:0};
  const body=new ReadableStream({start(c){controller=c;},pull(){begun();},cancel(){stats.cancelled++;}});
  return {req:request(body,{signal,duplex:'half'}),started,stats,
    finish(){try{controller.enqueue(encoder.encode('{}'));controller.close();}catch{/* already cancelled */}}};
}
async function settles(promise) {
  let timer;
  try {return await Promise.race([promise.then(response=>({response})),
    new Promise(resolve=>{timer=setTimeout(()=>resolve({timedOut:true}),1000);})]);}
  finally {clearTimeout(timer);}
}
async function check(name, fn) {
  reset();
  try {await fn();passed++;console.log(`[PASS] ${name}`);}
  catch(error){failures.push({name,error});console.error(`[FAIL] ${name}: ${error.message}`);}
  finally {Date.now=realNow;}
}
try {
  await check('valid request still uses the actual parser and private delivery with server-owned identity',async()=>{
    const response=await route.POST(request(JSON.stringify(descriptor())));
    assert.equal(response.status,200);assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[1,2,3]);
    assert.equal(state.sent.userId,state.identity.uid);assert.equal(state.sent.tenantId,state.identity.tenantId);
    assert.match(response.headers.get('cache-control'),/no-store/);
  });
  await check('revoked authority denies before reading input or dispatching',async()=>{
    state.allowed=false;
    const response=await route.POST(request(JSON.stringify(descriptor())));
    assert.equal(response.status,403);assert.equal(state.fetchCalls,0);
  });
  await check('malformed JSON fails closed without dispatch',async()=>{
    const response=await route.POST(request('{'));
    assert.equal(response.status,503);assert.equal(state.fetchCalls,0);
  });
  await check('existing 16-KiB input limit is preserved',async()=>{
    const response=await route.POST(request('x'.repeat(16*1024+1)));
    assert.equal(response.status,503);assert.equal(state.fetchCalls,0);
  });
  await check('client abort cancels a pending input read and returns without waiting for body bytes',async()=>{
    const abort=new AbortController(),pending=stalled(abort.signal);let task;
    try {
      task=route.POST(pending.req);await pending.started;await new Promise(resolve=>setImmediate(resolve));abort.abort();
      const outcome=await settles(task);
      assert.equal(outcome.timedOut,undefined,'route kept waiting on disconnected input');
      assert.equal(outcome.response.status,503);assert.equal(pending.stats.cancelled,1);assert.equal(state.fetchCalls,0);
    } finally {pending.finish();await task;}
  });
  await check('already-aborted input never dispatches or waits for body bytes',async()=>{
    const abort=new AbortController();abort.abort();const pending=stalled(abort.signal);let task;
    try {task=route.POST(pending.req);const outcome=await settles(task);
      assert.equal(outcome.timedOut,undefined,'already-aborted input was still read');
      assert.equal(outcome.response.status,503);assert.equal(state.fetchCalls,0);
    } finally {pending.finish();await task;}
  });
  await check('request reading consumes the original deadline rather than starting a fresh 50-second budget',async()=>{
    const base=realNow();let offset=0;Date.now=()=>base+offset;
    state.onAuth=()=>{offset=49_975;};
    const pending=stalled(new AbortController().signal);let task;
    try {task=route.POST(pending.req);const outcome=await settles(task);
      assert.equal(outcome.timedOut,undefined,'request body exceeded the remaining operation budget');
      assert.equal(outcome.response.status,503);assert.equal(pending.stats.cancelled,1);assert.equal(state.fetchCalls,0);
    } finally {pending.finish();await task;}
  });
  await check('deadline already spent in authorization prevents pending body work',async()=>{
    const base=realNow();let offset=0;Date.now=()=>base+offset;state.onAuth=()=>{offset=50_001;};
    const pending=stalled(new AbortController().signal);let task;
    try {task=route.POST(pending.req);const outcome=await settles(task);
      assert.equal(outcome.timedOut,undefined,'expired request started an unbounded body read');
      assert.equal(outcome.response.status,503);assert.equal(state.fetchCalls,0);
    } finally {pending.finish();await task;}
  });
  console.log(`PRIVATE_MEDIA_REQUEST_LIFETIME PASS=${passed} FAIL=${failures.length} SYNTHETIC_BOUNDARIES_ONLY`);
  if(failures.length)throw new AggregateError(failures.map(item=>item.error),failures.map(item=>item.name).join('; '));
} finally {
  Date.now=realNow;globalThis.fetch=oldFetch;
  if(previousState===undefined)delete globalThis[key];else globalThis[key]=previousState;
  for(const name of keys){if(oldEnv[name]===undefined)delete process.env[name];else process.env[name]=oldEnv[name];}
}
