// Synthetic authenticated service-interface acceptance. No C6 issuance,
// private rendering, media output, cloud IAM or hosted application certification.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire, Module } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const appRoot = path.join(root, 'apps/studio');
const appRequire = createRequire(path.join(appRoot, 'package.json'));
const ts = appRequire('typescript');
const project = 'demo-urai-studio-r1591';
assert.equal(process.env.GCLOUD_PROJECT, project);
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, '127.0.0.1:19099');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:18080');
assert.equal(process.env.FIREBASE_STORAGE_EMULATOR_HOST, '127.0.0.1:19199');
const jobsRoot = process.env.URAI_R1591_JOBS_ROOT;
assert.ok(jobsRoot && path.isAbsolute(jobsRoot));
assert.equal(execFileSync('git', ['-C', jobsRoot, 'rev-parse', 'HEAD'], {encoding:'utf8'}).trim(),
  '260a7cdd96051c890d19a40f788ae60bee50fede');
const admin = appRequire('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: project, storageBucket: project + '.appspot.com' });
const auth = admin.auth(), db = admin.firestore();
const cache = new Map();
function sourceModule(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const mod = new Module(file);
  mod.filename = file; mod.paths = Module._nodeModulePaths(path.dirname(file));
  cache.set(file, mod);
  mod.require = (name) => {
    if (name === 'server-only') return {};
    let target;
    if (name.startsWith('@/')) target = path.join(appRoot, name.slice(2));
    else if (name.startsWith('.')) target = path.resolve(path.dirname(file), name);
    if (target) {
      if (fs.existsSync(target + '.ts')) return sourceModule(target + '.ts');
      if (fs.existsSync(target + '.tsx')) return sourceModule(target + '.tsx');
    }
    return appRequire(name);
  };
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName:file, compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}
  }).outputText;
  mod._compile(compiled, file);
  return mod.exports;
}
const statusRoute = sourceModule(path.join(appRoot, 'app/api/studio/video-factory/jobs-status/route.ts'));
const dispatchRoute = sourceModule(path.join(appRoot, 'app/api/studio/video-factory/jobs-dispatch/route.ts'));
const jobsRoute = sourceModule(path.join(appRoot, 'app/api/studio/jobs/route.ts'));
const jobsModule = await import(pathToFileURL(path.join(jobsRoot, 'functions/lib/functions/jobs/studioLifeMovieBridge.js')).href);
let jobsCalls = 0;
const jobsServer = http.createServer(async (req,res)=>{
  try {
    const chunks=[];for await(const chunk of req) chunks.push(chunk);
    req.rawBody=Buffer.concat(chunks); req.body=JSON.parse(req.rawBody.toString()||'{}');
    req.get = key => req.headers[key.toLowerCase()];
    res.set = (key,value) => {res.setHeader(key,value);return res;};
    res.status = code => {res.statusCode=code;return res;};
    res.json = value => {res.setHeader('content-type','application/json');res.end(JSON.stringify(value));return res;};
    jobsCalls++;
    await jobsModule.studioLifeMovieBridge(req,res);
  } catch {res.statusCode=500;res.end('{"ok":false,"error":"test_adapter_failure"}');}
});
const studioServer=http.createServer(async(req,res)=>{
  try {
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    const body=Buffer.concat(chunks);
    const url='http://127.0.0.1:15003'+req.url;
    const request=new Request(url,{method:req.method,headers:req.headers,
      ...(body.length?{body}: {})});
    const response=req.url.startsWith('/status') ? await statusRoute.GET(request)
      : req.url.startsWith('/dispatch') ? await dispatchRoute[req.method](request)
      : req.url.startsWith('/jobs') ? await jobsRoute[req.method](request)
      : new Response('{}',{status:404});
    res.statusCode=response.status;response.headers.forEach((v,k)=>res.setHeader(k,v));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {res.statusCode=500;res.end('{"ok":false,"error":"test_adapter_failure"}');}
});
await new Promise(resolve=>jobsServer.listen(15002,'127.0.0.1',resolve));
await new Promise(resolve=>studioServer.listen(15003,'127.0.0.1',resolve));
const actors={};
const tenant='r1591-tenant';
for(const role of ['owner','other','unsigned']){
  const uid='r1591-'+role,email=uid+'@example.test',password='Synthetic-r1591-local-only-pass';
  await auth.createUser({uid,email,password,emailVerified:true});
  if(role!=='unsigned')await auth.setCustomUserClaims(uid,{tenantId:tenant});
  const response=await fetch('http://127.0.0.1:19099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=local-only',{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
  assert.equal(response.status,200);const token=(await response.json()).idToken;assert.ok(token);
  actors[role]={uid,token};
  await db.doc('studioUsers/'+uid).set({uid,role:'owner',disabled:false});
  await db.doc('memberships/'+uid+'_'+tenant).set({uid,studioId:tenant,role:'owner',active:true});
}
const jobId='r1591-synthetic-job';
await db.doc('jobs/'+jobId).set({jobId,jobType:'studio.render.video',type:'studio.render.video',
  status:'SUCCEEDED',tenantId:tenant,ownerUid:actors.owner.uid,sourceSystem:'urai-studio',
  output:{outputs:[{kind:'mp4',ref:'gs://synthetic-never-delivered/private.mp4',mimeType:'video/mp4'}]},
  error:{message:'synthetic-private-worker-detail'}});
await db.doc('studioJobs/r1591-owned-draft').set({id:'r1591-owned-draft',tenantId:tenant,userId:actors.owner.uid,status:'draft',createdAt:new Date().toISOString()});
await db.doc('studioJobs/r1591-foreign-draft').set({id:'r1591-foreign-draft',tenantId:tenant,userId:actors.other.uid,status:'draft',createdAt:new Date().toISOString()});
let pass=0,fail=0;
async function check(name,fn){try{await fn();pass++;console.log('PASS '+name);}catch(e){fail++;console.error('FAIL '+name+': '+e.message);}}
async function call(endpoint,who=actors.owner,method='GET',body){
 const response=await fetch('http://127.0.0.1:15003'+endpoint,{method,headers:{
  ...(who?{authorization:'Bearer '+who.token}:{}),'content-type':'application/json',
  'x-urai-tenant-id':tenant,'x-urai-user-id':'untrusted-foreign-owner'},
  ...(body?{body:JSON.stringify(body)}:{})});
 return {status:response.status,body:await response.json(),cache:response.headers.get('cache-control')};
}
const statusPath='/status?jobId='+jobId;
try {
 await check('verified real Firebase identity carries signed tenant',async()=>{
  const token=await auth.verifyIdToken(actors.owner.token,true);assert.equal(token.uid,actors.owner.uid);assert.equal(token.tenantId,tenant);
 });
 await check('default-off Studio bridge never contacts Jobs',async()=>{
  delete process.env.URAI_STUDIO_JOBS_DISPATCH_ENABLED;
  const before=jobsCalls;assert.equal((await call(statusPath)).status,503);assert.equal(jobsCalls,before);
 });
 process.env.URAI_STUDIO_JOBS_DISPATCH_ENABLED='true'; // test process only; status reads only
 await check('actual Studio status route calls compiled current Jobs with owner binding',async()=>{
  const r=await call(statusPath);assert.equal(r.status,200);assert.equal(r.body.job.jobId,jobId);assert.equal(r.body.job.status,'SUCCEEDED');
  assert.deepEqual(Object.keys(r.body.job).sort(),['jobId','jobType','status']);assert.equal(r.cache,'no-store, max-age=0');
  assert.ok(!JSON.stringify(r.body).includes('gs://'));assert.ok(!JSON.stringify(r.body).includes('private-worker-detail'));
 });
 await check('other signed same-tenant member cannot read owner Jobs record',async()=>{
  assert.equal((await call(statusPath,actors.other)).status,403);
 });
 await check('unbound signed token cannot select tenant from headers',async()=>{
  const before=jobsCalls;assert.equal((await call(statusPath,actors.unsigned)).status,403);assert.equal(jobsCalls,before);
 });
 await check('anonymous header identity cannot access current Jobs',async()=>{
  const before=jobsCalls;assert.equal((await call(statusPath,null)).status,403);assert.equal(jobsCalls,before);
 });
 await check('client cannot inject an owner query',async()=>{assert.equal((await call(statusPath+'&userId='+actors.other.uid)).status,400);});
 await check('missing Jobs record returns unavailable without data',async()=>{assert.equal((await call('/status?jobId=r1591-missing-job')).status,404);});
 await check('revoked current membership stops status before Jobs',async()=>{
  const ref=db.doc('memberships/'+actors.owner.uid+'_'+tenant);await ref.update({revoked:true});
  const before=jobsCalls;assert.equal((await call(statusPath)).status,403);assert.equal(jobsCalls,before);await ref.update({revoked:false});
 });
 await check('revoked global member stops status before Jobs',async()=>{
  const ref=db.doc('studioUsers/'+actors.owner.uid);await ref.update({revoked:true});
  const before=jobsCalls;assert.equal((await call(statusPath)).status,403);assert.equal(jobsCalls,before);await ref.update({revoked:false});
 });
 await check('canonical owner deletion tombstone stops status before Jobs',async()=>{
  const ref=db.doc('privacyDeletionTombstones/'+actors.owner.uid);await ref.set({uid:actors.owner.uid,active:true});
  const before=jobsCalls;assert.equal((await call(statusPath)).status,403);assert.equal(jobsCalls,before);await ref.delete();
 });
 await check('disabled Firebase account stops status before Jobs',async()=>{
  await auth.updateUser(actors.owner.uid,{disabled:true});
  const before=jobsCalls;assert.equal((await call(statusPath)).status,403);assert.equal(jobsCalls,before);await auth.updateUser(actors.owner.uid,{disabled:false});
 });
 await check('Studio owner query excludes another member draft',async()=>{
  const r=await call('/jobs');assert.equal(r.status,200);
  const text=JSON.stringify(r.body);assert.ok(text.includes('r1591-owned-draft'));assert.ok(!text.includes('r1591-foreign-draft'));
 });
 await check('missing render consent is rejected before any Jobs request',async()=>{
  const before=jobsCalls;const r=await call('/dispatch',actors.owner,'POST',{projectId:'synthetic'});
  assert.equal(r.status,400);assert.equal(r.body.error.code,'life_movie_invalid_render_consent');assert.equal(jobsCalls,before);
 });
 await check('bad bridge credential is denied by actual Jobs handler',async()=>{
  const prior=process.env.URAI_STUDIO_JOBS_BRIDGE_TOKEN;
  // Jobs secret accessor reads the same process env; use a direct test request
  // carrying a wrong synthetic bearer while keeping configured authority fixed.
  const r=await fetch('http://127.0.0.1:15002',{method:'POST',headers:{authorization:'Bearer deliberately-wrong-local-fixture','content-type':'application/json'},body:JSON.stringify({action:'status',tenantId:tenant,userId:actors.owner.uid,jobId})});
  assert.equal(r.status,401);assert.equal(process.env.URAI_STUDIO_JOBS_BRIDGE_TOKEN,prior);
 });
 await check('no queued processing or new rendered job was created',async()=>{
  assert.equal((await db.collection('jobQueue').get()).size,0);
  assert.equal((await db.collection('jobs').get()).size,1);
 });
 await check('deleted Firebase actor cannot reuse prior session',async()=>{
  await auth.deleteUser(actors.owner.uid);const before=jobsCalls;
  assert.equal((await call(statusPath)).status,403);assert.equal(jobsCalls,before);
 });
 console.log('RESULT '+JSON.stringify({pass,fail,actualJobsRequests:jobsCalls,
  firebaseAuth:'real-local-emulator-issued-token',interface:'actual Studio source and compiled Jobs handler via local HTTP adapters',
  canonicalRenderConsentIssued:false,privateMediaProcessed:false,production:'HOLD',privateMemoryWrites:'OFF'}));
 process.exitCode=fail?1:0;
} finally {
 jobsServer.closeAllConnections();studioServer.closeAllConnections();
 await Promise.all([new Promise(r=>jobsServer.close(r)),new Promise(r=>studioServer.close(r))]);
 await admin.app().delete();
}
