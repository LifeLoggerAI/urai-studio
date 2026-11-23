import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),ts=require('typescript');
const src=fs.readFileSync(new URL('../lib/studio-render-membership-evidence.ts',import.meta.url),'utf8');
const js=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const key=Symbol.for('urai.r1715.member'),previous=globalThis[key];
const uid='ownerA',tenant='tenantA';
const fp='studioDataRightsOwnerFences/'+createHash('sha256').update('urai-studio-data-rights:'+uid).digest('hex');
const initial=()=>({['studioUsers/'+uid]:{uid,role:'owner'},['memberships/'+uid+'_'+tenant]:{uid,studioId:tenant,role:'creator',active:true}});
const state={};globalThis[key]=state;
const firebase=data("const s=globalThis[Symbol.for('urai.r1715.member')];export const adminDb={doc(path){s.paths.push(path);return{async get(){if(s.fail)throw Error('no-db');return{exists:Object.hasOwn(s.docs,path),data:()=>s.docs[path]}}}}};");
const auth=data("const s=globalThis[Symbol.for('urai.r1715.member')];export async function requireStudioLongformAuth(){return s.auth};export async function refreshStudioLongformAuth(){return s.refresh}");
const source=js.replaceAll('server-only',data('export {};')).replaceAll('@/lib/firebase-admin',firebase).replaceAll('@/lib/studio-life-movie-longform-auth',auth);
const {readCurrentStudioRenderMembership:run}=await import(data(source));
const req=new Request('https://studio.invalid/private');
function reset(){state.docs=initial();state.paths=[];state.fail=false;state.auth={ok:true,uid,tenantId:tenant,authMode:'firebase_id_token'};state.refresh={...state.auth};}
test('valid current authority returns internal minimal projection',async()=>{
 reset();const v=await run(req);assert.equal(v.status,'current');assert.equal(v.evidence.uid,uid);
 assert.deepEqual(state.paths,['studioUsers/'+uid,'memberships/'+uid+'_'+tenant,fp,'privacyDeletionTombstones/'+uid]);
 assert.equal(v.evidence.membership.role,'creator');
 assert.equal(JSON.stringify(v).includes('token'),false);
});
const fails=[
 ['unauthenticated',s=>s.auth.ok=false],['local fallback',s=>s.auth.authMode='local_fallback'],
 ['foreign tenant',s=>s.auth.tenantId='other'],['missing user',s=>delete s.docs['studioUsers/'+uid]],
 ['disabled user',s=>s.docs['studioUsers/'+uid].disabled=true],
 ['revoked user',s=>s.docs['studioUsers/'+uid].revoked=true],
 ['viewer role',s=>s.docs['studioUsers/'+uid].role='viewer'],
 ['missing member',s=>delete s.docs['memberships/'+uid+'_'+tenant]],
 ['wrong member uid',s=>s.docs['memberships/'+uid+'_'+tenant].uid='other'],
 ['wrong member tenant',s=>s.docs['memberships/'+uid+'_'+tenant].studioId='other'],
 ['member viewer',s=>s.docs['memberships/'+uid+'_'+tenant].role='viewer'],
 ['member inactive',s=>s.docs['memberships/'+uid+'_'+tenant].active=false],
 ['member active missing',s=>delete s.docs['memberships/'+uid+'_'+tenant].active],
 ['member revoked',s=>s.docs['memberships/'+uid+'_'+tenant].revoked=true],
 ['active fence',s=>s.docs[fp]={uid,requestId:'req',active:true,permanent:false}],
 ['permanent fence',s=>s.docs[fp]={uid,requestId:'req',active:false,permanent:true}],
 ['malformed fence',s=>s.docs[fp]={uid,active:false,permanent:false}],
 ['active tombstone',s=>s.docs['privacyDeletionTombstones/'+uid]={uid,active:true}],
 ['planning lease',s=>s.docs['privacyDeletionTombstones/'+uid]={uid,active:false,deletionPlanningLeaseToken:'lease'}],
 ['database outage',s=>s.fail=true],
 ['revoked during read',s=>s.refresh.ok=false],
 ['owner changed during read',s=>s.refresh.uid='other'],
 ['tenant changed during read',s=>s.refresh.tenantId='other'],
];
for(const [name,mutate] of fails)test('fail closed: '+name,async()=>{reset();mutate(state);assert.deepEqual(await run(req),{status:'unavailable'});});
process.on('exit',()=>{if(previous===undefined)delete globalThis[key];else globalThis[key]=previous;});
