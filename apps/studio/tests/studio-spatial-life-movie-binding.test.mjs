import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const source=fs.readFileSync(new URL('../lib/studio-spatial-life-movie-contract.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const stub={StudioLongformError:class StudioLongformError extends Error{constructor(code,status){super(code);this.status=status;this.code=code}}};
const exports={};new Function('exports','require',js)(exports,n=>n.includes('longform-contract')?stub:require(n));
const check=exports.assertSpatialLifeMovieBinding;
const uid='spatial-user-a',planId='lmp_'+('a'.repeat(20)),now=Date.now();
function fixture(){return {studioUid:'studio-a',tenantId:'tenant-a',spatialUid:uid,memoryId:'memory-a',movieId:'movie-a',planId,projectId:'urai-4dc1d',now,pendingDeletion:false,
user:{accountStatus:'active',deleted:false},
memory:{ownerId:uid,consentState:'authorized',lifeMovie:{sceneTruthPacketId:'scene-a'}},
movie:{id:'movie-a',ownerId:uid,status:'ready',consentState:'authorized',lifeModelSchemaVersion:'urai-life-model-v1',syntheticOutputMayBecomeHistoricalSource:false,chapters:[{memoryId:'memory-a',sceneTruthPacketId:'scene-a',consentState:'authorized'}]},
scene:{ownerId:uid,sceneId:'scene-a',memoryId:'memory-a',schemaVersion:'urai-life-model-v1',state:'current',syntheticOutputMayBecomeHistoricalSource:false,decision:'READY',packetHash:'a'.repeat(64),memorySourceBindingDigest:'b'.repeat(64),memorySourceIds:['fictional']},
policy:{ownerId:uid,version:2,revision:1,domains:{memory:{mode:'granted'}},enforcement:{state:'fully-enforced'}},
consent:{uid,purpose:'memory.storage',consentTier:'C1',policyVersion:'1.0.0',status:'granted',receiptHash:'c'.repeat(64),expiresAt:new Date(now+60000).toISOString()},
jobsStatus:{ok:true,plan:{planId,status:'SUCCESS',consentRevoked:false,publicReleaseAuthorized:false,assembly:{status:'SUCCESS'},sceneTruthDigest:'a'.repeat(64),renderPlanDigest:'d'.repeat(64)}}}}
assert.equal(check(fixture()).planId,planId);
const scenarios=[
['project',x=>x.projectId='urai-studio'],
['owner',x=>x.memory.ownerId='user-b'],
['consent',x=>x.consent.status='revoked'],
['expired',x=>x.consent.expiresAt=new Date(now-1000).toISOString()],
['deleted',x=>x.user.deleted=true],
['memory deleted',x=>x.memory.deleted=true],
['deleting',x=>x.pendingDeletion=true],
['policy',x=>x.policy.domains.memory.mode='denied'],
['movie',x=>x.movie.ownerId='user-b'],
['chapter',x=>x.movie.chapters[0].memoryId='other-memory'],
['scene owner',x=>x.scene.ownerId='user-b'],
['scene stale',x=>x.scene.state='revoked'],
['scene hash',x=>x.jobsStatus.plan.sceneTruthDigest='e'.repeat(64)],
['plan',x=>x.jobsStatus.plan.planId='lmp_'+('z'.repeat(20))],
['job revoked',x=>x.jobsStatus.plan.consentRevoked=true],
['job not ready',x=>x.jobsStatus.plan.assembly.status='RUNNING'],
['job denied',x=>x.jobsStatus.ok=false],
['tombstone',x=>x.tombstone={uid,active:true}],
['local deletion',x=>x.ownerFence={ownerHash:'f'.repeat(64),deleted:true,deletionEpoch:1}],
['render consent',x=>x.renderConsentBlock={ownerUid:uid,purpose:'life-movie.render',active:true}],
];
for(const [name,mutate] of scenarios){const v=fixture();mutate(v);assert.throws(()=>check(v),undefined,name)}
console.log('[PASS] 21 offline binding cases; identity and Jobs records are fixtures, not live cloud');