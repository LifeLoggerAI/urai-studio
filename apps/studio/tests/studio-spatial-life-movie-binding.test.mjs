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
memory:{ownerId:uid,consentState:'authorized',lifeMovie:{sceneTruthPacketId:'scene-a',provenance:{sourceIds:['fictional']}}},
movie:{id:'movie-a',ownerId:uid,status:'ready',consentState:'authorized',lifeModelSchemaVersion:'urai-life-model-v1',syntheticOutputMayBecomeHistoricalSource:false,chapters:[{memoryId:'memory-a',sceneTruthPacketId:'scene-a',consentState:'authorized',provenance:{sourceIds:['fictional']}}]},
scene:{ownerId:uid,sceneId:'scene-a',memoryId:'memory-a',schemaVersion:'urai-life-model-v1',state:'current',syntheticOutputMayBecomeHistoricalSource:false,decision:'READY',packetHash:'a'.repeat(64),memorySourceBindingDigest:'b'.repeat(64),memorySourceIds:['fictional']},
policy:{ownerId:uid,version:2,revision:1,domains:{memory:{mode:'granted'}},enforcement:{state:'fully-enforced'}},
consent:{uid,purpose:'memory.storage',consentTier:'C1',policyVersion:'1.0.0',status:'granted',receiptHash:'c'.repeat(64),expiresAt:new Date(now+60000).toISOString()},
jobsStatus:{ok:true,plan:{planId,status:'SUCCESS',consentRevoked:false,publicReleaseAuthorized:false,assembly:{status:'SUCCESS'},sceneTruthDigest:'a'.repeat(64),renderPlanDigest:'d'.repeat(64),
sourceBinding:{sourceSystem:'urai-studio',ownerUid:'studio-a',tenantId:'tenant-a',processingPurpose:'life-movie.render',
sceneTruthDigest:'a'.repeat(64),renderPlanDigest:'d'.repeat(64),sceneTruthReceiptRef:'synthetic-scene-receipt'}}}}}
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
['scene source substitution',x=>x.scene.memorySourceIds=['source-foreign']],
['chapter source substitution',x=>x.movie.chapters[0].provenance.sourceIds=['source-foreign']],
['memory source replaced',x=>x.memory.lifeMovie.provenance.sourceIds=['source-revised']],
['scene hash',x=>x.jobsStatus.plan.sceneTruthDigest='e'.repeat(64)],
['plan',x=>x.jobsStatus.plan.planId='lmp_'+('z'.repeat(20))],
['job revoked',x=>x.jobsStatus.plan.consentRevoked=true],
['job not ready',x=>x.jobsStatus.plan.assembly.status='RUNNING'],
['job denied',x=>x.jobsStatus.ok=false],
['missing Jobs provenance',x=>delete x.jobsStatus.plan.sourceBinding],
['foreign Jobs owner',x=>x.jobsStatus.plan.sourceBinding.ownerUid='studio-b'],
['foreign Jobs tenant',x=>x.jobsStatus.plan.sourceBinding.tenantId='tenant-b'],
['Jobs purpose substitution',x=>x.jobsStatus.plan.sourceBinding.processingPurpose='public'],
['Jobs SceneTruth substitution',x=>x.jobsStatus.plan.sourceBinding.sceneTruthDigest='e'.repeat(64)],
['Jobs render plan substitution',x=>x.jobsStatus.plan.sourceBinding.renderPlanDigest='e'.repeat(64)],
['Jobs source receipt missing',x=>x.jobsStatus.plan.sourceBinding.sceneTruthReceiptRef=''],

['tombstone',x=>x.tombstone={uid,active:true}],
['local deletion',x=>x.ownerFence={ownerHash:'f'.repeat(64),deleted:true,deletionEpoch:1}],
['render consent',x=>x.renderConsentBlock={ownerUid:uid,purpose:'life-movie.render',active:true}],
];
for(const [name,mutate] of scenarios){const v=fixture();mutate(v);assert.throws(()=>check(v),undefined,name)}
console.log('[PASS] 31 offline binding cases with source-set substitutions; identity and Jobs records are fixtures, not live cloud');