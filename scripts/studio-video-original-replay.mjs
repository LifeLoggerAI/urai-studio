#!/usr/bin/env node
/** Non-release: original Spatial Next app + Firebase emulators + immutable Jobs MP4.
 * Storage HTTP is a clearly isolated Playwright fixture, NOT Storage IAM. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { spawn, execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(), project='demo-urai-auth-journey', origin='http://127.0.0.1:4173';
const req=createRequire(path.join(root,'urai-tier1/package.json'));
const adminReq=createRequire(path.join(root,'apps/functions/package.json'));
const {chromium}=req('playwright'),admin=adminReq('firebase-admin');
const sha=process.env.URAI_SPATIAL_EXPECTED_SHA, expectedMovie='c4ba548d480d7c71fb8e9efa496f1282bb833cdbb5303c868aa2a5e685c6fe91';
const output=path.resolve(process.env.URAI_STUDIO_PROOF_OUT||'../_audit/20261017_wave131_original_replay');
const url='https://storage.googleapis.com/'+project+'.appspot.com/urai-synthetic-jobs/movie.mp4';
const a='fictional-urai-a',b='fictional-urai-b',memoryId='fictional-memory-a',manifestId='fictional-manifest-a';
const result={schema:'urai-wave131-original-replay-ci-v1',status:'FAIL_CLOSED',spatialSha:sha,movieSha256:expectedMovie,
 mediaTransport:'PLAYWRIGHT_ONLY_STORAGE_URL_FIXTURE_NOT_CLOUD',auth:'REAL_FIREBASE_AUTH_EMULATOR',j9Accepted:false,
 crossProjectAccepted:false,productionAccepted:false,stages:[],screenshots:[],requests:[],failure:null};
let app,browser,server;
const record=(stage,detail={})=>result.stages.push({stage,...detail});
const pause=ms=>new Promise(ok=>setTimeout(ok,ms));
const screenshot=async(page,name)=>{const bytes=await page.screenshot({path:path.join(output,name+'.png'),timeout:60000});result.screenshots.push({name,sha256:createHash('sha256').update(bytes).digest('hex')});};
const waitRoute=async(page,route)=>page.waitForURL(u=>u.pathname.replace(/\/+$/,'')===route,{timeout:60000});
const login=async(page,user)=>{
 await page.goto(origin+'/login',{waitUntil:'domcontentloaded'});
 await page.getByTestId('urai-e2e-login-form').waitFor({state:'visible',timeout:90000});
 await page.waitForFunction(()=>document.querySelector('[data-testid="urai-e2e-login-form"]')?.dataset.emulatorAuthReady==='true',null,{timeout:60000});
 await page.getByTestId('urai-e2e-email').fill(user.email);
 await page.getByTestId('urai-e2e-password').fill(user.password);
 await page.getByTestId('urai-e2e-submit').click();
 await page.waitForFunction(uid=>document.querySelector('[data-testid="urai-e2e-auth-uid"]')?.textContent?.trim()===uid,user.uid,{timeout:60000});
};
const fixtureRoute=(bytes,stats)=>async route=>{
 const target=new URL(route.request().url());
 if(target.href===url){
  stats.count++;if(stats.deny){stats.blocked++;return route.abort('blockedbyclient');}
  const range=route.request().headers().range;
  let first=0,last=bytes.length-1;
  if(range){const m=/^bytes=(\d+)-(\d*)$/.exec(range);if(!m)return route.fulfill({status:416,body:''});
   first=Number(m[1]);if(m[2])last=Math.min(last,Number(m[2]));if(first>last)return route.fulfill({status:416,body:''});}
  const slice=bytes.subarray(first,last+1),status=range?206:200;
  result.requests.push({host:'storage.googleapis.com',status,bytes:slice.length,range:range||null});
  return route.fulfill({status,contentType:'video/mp4',body:slice,headers:{
   'content-length':String(slice.length),'accept-ranges':'bytes','cache-control':'private, no-store',
   ...(range?{'content-range':'bytes '+first+'-'+last+'/'+bytes.length}:{})}});
 }
 if(['localhost','127.0.0.1'].includes(target.hostname))return route.continue();
 return route.abort('blockedbyclient');
};
const recordMemory=()=>({
 ownerId:a,title:'Fictional Jobs Movie',occurredAt:'1988-08-01T12:00:00.000Z',summary:'Fictional test media, not a family memory',
 emotionalState:'calm',consentState:'granted',privacy:'private',deleted:false,demo:false,
 sourceMedia:[{kind:'video',url,caption:'Synthetic Jobs artifact'}],
 star:{id:'fictional-star-a',position:[0,0,-4],scale:1},
 replayManifest:{id:manifestId,version:1,durationMs:5000,segments:[
  {id:'memory',label:'Memory',caption:'Fictional source starts',narratorLine:'Synthetic Jobs',startsAtMs:0,durationMs:400},
  {id:'emotion',label:'Narration',caption:'This is a synthetic UrAi narration.',narratorLine:'This is a synthetic UrAi narration.',startsAtMs:400,durationMs:1900},
  {id:'pattern',label:'Narration',caption:'Your private memories stay yours.',narratorLine:'Your private memories stay yours.',startsAtMs:2300,durationMs:2100},
  {id:'return',label:'Return',caption:'Fictional source ends',narratorLine:'Fictional source ends',startsAtMs:4400,durationMs:600}]}
});
await mkdir(output,{recursive:true});
try{
 assert.match(sha,/^[a-f0-9]{40}$/);
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sha);
 assert.equal(process.env.GCLOUD_PROJECT,project);
 assert.equal(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,project);
 assert.equal(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,project+'.appspot.com');
 const registry=await (await fetch('http://127.0.0.1:4400/emulators',{signal:AbortSignal.timeout(5000)})).json();
 for(const [name,port] of [['auth',9099],['firestore',8080],['functions',5001],['storage',9199]])assert.equal(registry[name]?.port,port);
 const movie=await readFile(process.env.URAI_JOBS_SYNTH_MP4),srt=await readFile(process.env.URAI_JOBS_SYNTH_SRT,'utf8');
 assert.equal(movie.length,104225);assert.equal(createHash('sha256').update(movie).digest('hex'),expectedMovie);
 assert.match(srt,/00:00:00,400 --> 00:00:02,300/);
 assert.match(srt,/00:00:02,300 --> 00:00:04,400/);
 record('verified-original-jobs-artifact',{byteLength:movie.length,cues:2});
 app=admin.initializeApp({projectId:project},'wave131-original-spatial');
 const auth=app.auth(),db=app.firestore(),users=[
  {uid:a,email:'fictional-a@example.invalid',password:'Test_Only_A_2026!'},
  {uid:b,email:'fictional-b@example.invalid',password:'Test_Only_B_2026!'}];
 for(const user of users){await auth.createUser(user);await db.doc('users/'+user.uid).set({ownerId:user.uid,accountStatus:'active',deleted:false});}
 await db.doc('users/'+a+'/memories/'+memoryId).set(recordMemory());
 const d=()=>({mode:'limited',retentionDays:365,precise:false,replayVisible:true,lifeMapVisible:true,modelContext:false,sharingEnabled:false,automationEnabled:false,likenessEnabled:false});
 await db.doc('users/'+a+'/privacyPolicy/current').set({version:2,revision:1,ownerId:a,
  domains:{memory:{...d(),mode:'granted',modelContext:true},location:d(),models:{...d(),modelContext:true},exports:{...d(),mode:'denied'},workforce:{...d(),mode:'paused'},identity:d()},
  enforcement:{state:'fully-enforced',jobId:null,affectedTargets:[],providerState:'not-applicable'}});
 await db.doc('users/'+a+'/lifeMapEvents/fictional-star-a').set({userId:a,type:'memory',title:'Fictional Jobs Movie',
  memoryId,sourceType:'manual_seed',occurredAt:'1988-08-01T12:00:00.000Z',replayAvailable:true});
 server=spawn('pnpm',['--dir','urai-tier1','exec','next','dev','--hostname','127.0.0.1','--port','4173'],{cwd:root,env:{...process.env,NODE_ENV:'development',NEXT_TELEMETRY_DISABLED:'1'},stdio:'ignore'});
 let available=false;for(let i=0;i<110;i++){if(server.exitCode!==null)throw Error('Original Spatial server stopped');
  try{if((await fetch(origin+'/login',{signal:AbortSignal.timeout(3500)})).ok){available=true;break;}}catch{}await pause(1500);}
 assert.ok(available,'original Next route did not start');
 browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const ca=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
 const countA={count:0,blocked:0,deny:false};await ca.route('**/*',fixtureRoute(movie,countA));
 const page=await ca.newPage();await login(page,users[0]);record('real-auth-emulator-user-a');
 await page.getByRole('link',{name:'Open Home'}).click();await waitRoute(page,'/home');
 const nav=page.getByTestId('urai-persistent-world-shell').getByTestId('home-semantic-life-map');
 await nav.waitFor({state:'visible',timeout:90000});await nav.click();await waitRoute(page,'/life-map');
 const map=page.getByTestId('urai-true-3d-life-map');
 await page.waitForFunction(()=>document.querySelector('[data-testid="urai-true-3d-life-map"]')?.dataset.lifeMapSource==='private',null,{timeout:90000});
 await page.getByTestId('life-map-semantic-trigger').click();
 await page.locator('#life-map-navigator button[data-life-map-node-id="fictional-star-a"]').click({timeout:60000});
 const threshold=page.locator('.life-map-thresholds button.focus-threshold');
 await threshold.waitFor({state:'visible',timeout:60000});await threshold.click();await waitRoute(page,'/focus');
 const focus=page.getByTestId('urai-final-focus-chamber');
 await page.waitForFunction(()=>document.querySelector('[data-testid="urai-final-focus-chamber"]')?.dataset.memoryStatus==='ready',null,{timeout:90000});
 assert.equal(await focus.getAttribute('data-memory-id'),memoryId);
 await focus.locator('nav.focusControls button.primary').click();await waitRoute(page,'/replay');
 const replay=page.getByTestId('cinematic-replay-client');
 await page.waitForFunction(()=>{const r=document.querySelector('[data-testid="cinematic-replay-client"]');
  const v=r?.querySelector('video');return r?.dataset.replayMediaReady==='true'&&v?.readyState>=2&&v.videoWidth>0;},null,{timeout:60000});
 assert.equal(await replay.getAttribute('data-memory-id'),memoryId);
 const video=replay.locator('video');
 const dimensions=await video.evaluate(v=>({width:v.videoWidth,height:v.videoHeight,readyState:v.readyState,muted:v.muted}));
 assert.equal(dimensions.width,320);assert.equal(dimensions.height,320);assert.ok(countA.count>0);
 await screenshot(page,'original-replay-real-jobs-video');
 await replay.getByRole('button',{name:'Continue memory'}).click();
 await page.waitForFunction(()=>document.querySelector('[data-testid="cinematic-replay-client"] video')?.currentTime>0.8,null,{timeout:15000});
 const first=await replay.locator('.caption strong').innerText();assert.match(first,/synthetic UrAi narration/i);
 await page.waitForFunction(()=>document.querySelector('[data-testid="cinematic-replay-client"] video')?.currentTime>2.75,null,{timeout:12000});
 const second=await replay.locator('.caption strong').innerText();assert.match(second,/private memories stay yours/i);
 await replay.getByRole('button',{name:'Pause memory'}).click();
 const paused=await video.evaluate(v=>({time:v.currentTime,paused:v.paused}));assert.equal(paused.paused,true);
 await pause(250);assert.ok(Math.abs((await video.evaluate(v=>v.currentTime))-paused.time)<0.12);
 await replay.getByRole('button',{name:'Continue memory'}).click();
 await page.waitForFunction(t=>document.querySelector('[data-testid="cinematic-replay-client"] video')?.currentTime>t,paused.time+0.1,{timeout:8000});
 record('original-replay-real-movie',{route:'/replay',dimensions,requestCount:countA.count,firstCue:first,secondCue:second,pausedAndResumed:true,audio:'AAC present by ffprobe; muted by default'});
 await replay.locator('button.unwind').click();await waitRoute(page,'/focus');
 await focus.locator('nav.focusControls button.unwind').click();await waitRoute(page,'/life-map');
 await map.getByRole('button',{name:'Return to Life Map overview'}).click();
 await map.locator('button[data-life-map-overview-home-return="true"]').click();await waitRoute(page,'/home');
 record('replay-return',{route:'/home',videoElements:await page.locator('video').count()});await screenshot(page,'original-home-return');
 const cb=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
 const countB={count:0,blocked:0,deny:true};await cb.route('**/*',fixtureRoute(movie,countB));
 const foreign=await cb.newPage();await login(foreign,users[1]);
 await foreign.goto(origin+'/replay?memoryId='+memoryId+'&manifestId='+manifestId);
 await foreign.waitForFunction(()=>['unavailable','unauthorized','deleted'].includes(document.querySelector('[data-testid="cinematic-replay-client"]')?.dataset.memoryStatus),null,{timeout:90000});
 assert.equal(countB.count,0,'Nonowner requested movie');record('foreign-user-denied',{mediaRequests:0});await screenshot(foreign,'original-replay-user-b-denied');await cb.close();
 await page.goto(origin+'/replay?memoryId='+memoryId+'&manifestId='+manifestId);
 await page.waitForFunction(()=>document.querySelector('[data-testid="cinematic-replay-client"]')?.dataset.memoryStatus==='ready',null,{timeout:60000});
 await db.doc('users/'+a+'/privacyPolicy/current').update({'domains.memory.mode':'denied','domains.memory.replayVisible':false,revision:2});
 await page.waitForFunction(()=>['unavailable','unauthorized','deleted'].includes(document.querySelector('[data-testid="cinematic-replay-client"]')?.dataset.memoryStatus),null,{timeout:30000});
 record('emulator-revocation',{method:'admin-direct-fixture-not-canonical-consent-ui',replayDenied:true});await screenshot(page,'original-replay-revoked');
 result.status='ORIGINAL_APP_EMULATOR_MEDIA_ACCEPTED_NOT_J9';
}catch(error){result.failure=String(error).slice(0,1000);process.exitCode=1;}
finally{
 if(browser)await browser.close().catch(()=>{});
 if(server)server.kill('SIGTERM');
 if(app)await app.delete().catch(()=>{});
 await writeFile(path.join(output,'receipt.json'),JSON.stringify(result,null,2)+'\n');
 console.log('ORIGINAL_SPATIAL_REPLAY_JOBS_MOVIE='+result.status);
 if(result.failure)console.error('FIRST_FAILURE='+result.failure);
}
