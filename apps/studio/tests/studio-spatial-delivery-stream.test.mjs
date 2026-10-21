import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL('../lib/studio-spatial-private-playback.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exported = {};
new Function('exports','require',compiled)(exported,require);
const {guardedSpatialPrivateResponse} = exported;
const future=()=>Date.now()+60_000;
const make=(bytes,reauthorize,signal=new AbortController().signal,expiresAt=future())=>
  guardedSpatialPrivateResponse({bytes,reauthorize,signal,expiresAt,
    headers:{'content-type':'video/mp4','cache-control':'private, no-store'}});

test('private bytes decode and source buffer is scrubbed after bounded transmission',async()=>{
  const bytes=Buffer.alloc(2*1024*1024+300,37);let checks=0;
  const result=make(bytes,async()=>{checks++});
  const received=new Uint8Array(await result.arrayBuffer());
  assert.equal(result.status,200);assert.equal(received.byteLength,2*1024*1024+300);
  assert.equal(received[0],37);assert.equal(received.at(-1),37);assert.equal(checks,3);
  assert.ok(bytes.every(value=>value===0));
});
test('revoked owner or consent prevents all subsequent chunks',async()=>{
  const bytes=Buffer.alloc(2*1024*1024+50,87);let allowed=true;
  const reader=make(bytes,async()=>{if(!allowed)throw Error('revoked')}).body.getReader();
  assert.equal((await reader.read()).value.length,1024*1024);
  allowed=false;
  await assert.rejects(reader.read(),/spatial_private_media_delivery_unavailable/);
  assert.ok(bytes.every(value=>value===0));
});
test('client abort prevents subsequent protected chunks',async()=>{
  const bytes=Buffer.alloc(2*1024*1024+1,51), abort=new AbortController();
  const reader=make(bytes,async()=>{},abort.signal).body.getReader();
  assert.equal((await reader.read()).value.length,1024*1024);
  abort.abort();
  await assert.rejects(reader.read(),/spatial_private_media_delivery_unavailable/);
  assert.ok(bytes.every(value=>value===0));
});
test('expired authority rejects without delivering bytes',()=>{
  const bytes=Buffer.alloc(12,61);
  assert.throws(()=>make(bytes,async()=>{},undefined,Date.now()-1),/spatial_private_media_delivery_unavailable/);
  assert.ok(bytes.every(value=>value===0));
});
test('reader cancellation discards all remaining private bytes',async()=>{
  const bytes=Buffer.alloc(2*1024*1024,93);
  const reader=make(bytes,async()=>{}).body.getReader();
  await reader.read();await reader.cancel();
  assert.ok(bytes.every(value=>value===0));
});
test('owner denial before first response chunk never exposes bytes',async()=>{
  const bytes=Buffer.alloc(129,127);
  const reader=make(bytes,async()=>{throw Error('wrong owner')}).body.getReader();
  await assert.rejects(reader.read(),/spatial_private_media_delivery_unavailable/);
  assert.ok(bytes.every(value=>value===0));
});
test('original Spatial delivery route connects chunk reauthorization',()=>{
  const route=fs.readFileSync(new URL('../app/api/studio/spatial-private-media/route.ts',import.meta.url),'utf8');
  assert.match(route,/guardedSpatialPrivateResponse\(/);
  assert.match(route,/reauthorize: async \(\) => \{ sameAuthorizedMemoryPlan\(initial, await readAuthority\(\)\); \}/);
  assert.match(route,/expiresAt: asset\.expiresAt/);
});
test('aborted authorization read never strands a protected response or reveals a next chunk',async()=>{
  const bytes=Buffer.alloc(2*1024*1024+13,71), abort=new AbortController();
  let calls=0;
  const reader=make(bytes,async()=>{
    calls++;
    if(calls>1) return new Promise(()=>{});
  },abort.signal).body.getReader();
  assert.equal((await reader.read()).value.length,1024*1024);
  const blocked=reader.read().then(()=> 'released',()=> 'denied');
  abort.abort();
  assert.equal(await Promise.race([blocked,new Promise(resolve=>setTimeout(()=>resolve('stalled'),250))]),'denied');
  assert.ok(bytes.every(value=>value===0));
});
test('server-side authority timeout bounds permanently unresolved authorization reads',async()=>{
  const bytes=Buffer.alloc(123,74);
  const reader=make(bytes,()=>new Promise(()=>{}),new AbortController().signal,Date.now()+30).body.getReader();
  const result=reader.read().then(()=> 'released',()=> 'denied');
  assert.equal(await Promise.race([result,new Promise(resolve=>setTimeout(()=>resolve('stalled'),250))]),'denied');
  assert.ok(bytes.every(value=>value===0));
});

test('aborted before construction scrubs source even before any stream exists',()=>{
  const bytes=Buffer.alloc(64,21),abort=new AbortController();
  abort.abort();
  assert.throws(()=>make(bytes,async()=>{},abort.signal),/spatial_private_media_delivery_unavailable/);
  assert.ok(bytes.every(value=>value===0));
});
test('aborted unread response immediately wipes source and denies subsequent read',async()=>{
  const bytes=Buffer.alloc(1025,77),abort=new AbortController();
  const response=make(bytes,async()=>{},abort.signal);
  abort.abort();
  assert.ok(bytes.every(value=>value===0));
  await assert.rejects(response.arrayBuffer(),/spatial_private_media_delivery_unavailable/);
});
test('expired unread response wipes source without waiting for a consumer',async()=>{
  const bytes=Buffer.alloc(1025,42);
  const response=make(bytes,async()=>{},new AbortController().signal,Date.now()+25);
  await new Promise(resolve=>setTimeout(resolve,65));
  assert.ok(bytes.every(value=>value===0));
  await assert.rejects(response.arrayBuffer(),/spatial_private_media_delivery_unavailable/);
});
test('cancel before reading private stream wipes source',async()=>{
  const bytes=Buffer.alloc(1025,18);
  const reader=make(bytes,async()=>{}).body.getReader();
  await reader.cancel();
  assert.ok(bytes.every(value=>value===0));
});
