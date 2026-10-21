import { NextResponse } from 'next/server';
import { applicationDefault, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { requireStudioLongformAuth, refreshStudioLongformAuth } from '@/lib/studio-life-movie-longform-auth';
import { verifyStudioSpatialAccountLink, SPATIAL_IDENTITY_PROJECT, STUDIO_IDENTITY_PROJECT } from '@/lib/studio-spatial-account-link';
import { verifyCurrentSpatialMemoryPlan } from '@/lib/studio-spatial-life-movie-contract';
import { callStudioLongformBridge } from '@/lib/studio-life-movie-longform-client';
import { readStudioLongformJson } from '@/lib/studio-life-movie-longform-contract';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const NAME = 'urai-spatial-cross-project-identity-readonly';
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const PLAN = /^lmp_[A-Za-z0-9_-]{20,64}$/;
const headers = { 'Cache-Control': 'private, no-store, max-age=0', 'Vary': 'Authorization, x-urai-spatial-id-token', 'X-Content-Type-Options':'nosniff' };
const reply = (code: number, data: Record<string,unknown>) => NextResponse.json(data,{status:code,headers});

/** Disabled by default. This only proves a point-in-time bound memory/plan.
 * It cannot return media bytes, output references or playback entitlement. */
export async function POST(request: Request) {
  const actor = await requireStudioLongformAuth(request);
  if (!actor.ok) return reply(403,{ok:false,error:'studio_current_authority_required'});
  try {
    if (process.env.URAI_STUDIO_SPATIAL_IDENTITY_ENABLED !== 'true' ||
        process.env.URAI_STUDIO_SPATIAL_MEMORY_PLAN_ENABLED !== 'true' ||
        process.env.URAI_SPATIAL_BRIDGE_PROJECT_ID !== SPATIAL_IDENTITY_PROJECT ||
        !adminDb || getApp().options.projectId !== STUDIO_IDENTITY_PROJECT)
      throw new Error('not_configured');
    const value = await readStudioLongformJson(request,4096) as Record<string,unknown>;
    if (!value || Array.isArray(value) || typeof value !== 'object' ||
        Object.keys(value).length !== 4 ||
        value.action !== 'verify-memory-plan' ||
        typeof value.memoryId !== 'string' || !ID.test(value.memoryId) ||
        typeof value.movieId !== 'string' || !ID.test(value.movieId) ||
        typeof value.planId !== 'string' || !PLAN.test(value.planId))
      throw new Error('selector_invalid');
    const app = getApps().find(a=>a.name===NAME) ||
      initializeApp({credential:applicationDefault(),projectId:SPATIAL_IDENTITY_PROJECT},NAME);
    if(app.options.projectId!==SPATIAL_IDENTITY_PROJECT) throw new Error('project_mismatch');
    const auth=getAuth(app), db=getFirestore(app);
    const studioDb = adminDb;
    const spatialIdToken=request.headers.get('x-urai-spatial-id-token') || '';
    const identityArgs={
      studioUid:actor.uid,tenantId:actor.tenantId,spatialIdToken,
      verifySpatialToken:(token:string)=>auth.verifyIdToken(token,true),
      readServerLink:async(id:string)=>{const x=await studioDb.doc('studioSpatialAccountLinks/'+id).get();return x.exists?x.data():null;},
    };
    const check=async(uid:string)=>verifyCurrentSpatialMemoryPlan({
      studioUid:actor.uid,tenantId:actor.tenantId,spatialUid:uid,
      memoryId:value.memoryId as string,movieId:value.movieId as string,planId:value.planId as string,
      readSpatial:async(path:string)=>{const d=await db.doc(path).get();return d.exists?d.data():null;},
      hasPendingDeletion:async(uid:string)=>{
        const [jobs,fence]=await Promise.all([
          db.collection('users/'+uid+'/deletionJobs').where('state','in',['awaiting-grace','queued','in-progress','failed']).limit(1).get(),
          db.doc('users/'+uid+'/privacyRuntime/exportAuthority').get(),
        ]);
        if(!jobs.empty) return true;
        if(!fence.exists) return false;
        const generation=fence.get('generation'),pending=fence.get('pendingDeletions');
        return !Number.isSafeInteger(generation)||generation<0||
          !pending||typeof pending!=='object'||Array.isArray(pending)||
          Object.values(pending).some(v=>v!==true)||Object.keys(pending).length>0;
      },
      readOwnedJobsPlan:({userId,tenantId,planId})=>
        callStudioLongformBridge({action:'status',userId,tenantId,planId}),
    });
    const firstLink=await verifyStudioSpatialAccountLink(identityArgs);
    const first=await check(firstLink.spatialUid);
    const current=await refreshStudioLongformAuth(request,actor);
    if(!current.ok || current.uid!==actor.uid || current.tenantId!==actor.tenantId) throw new Error('studio_revoked');
    const secondLink=await verifyStudioSpatialAccountLink(identityArgs);
    if(firstLink.spatialUid!==secondLink.spatialUid || firstLink.revision!==secondLink.revision) throw new Error('link_changed');
    const second=await check(secondLink.spatialUid);
    if(first.ownerUid!==second.ownerUid||first.memoryId!==second.memoryId||first.movieId!==second.movieId||
       first.planId!==second.planId||first.sceneTruthDigest!==second.sceneTruthDigest||
       first.renderPlanDigest!==second.renderPlanDigest||
       first.sceneTruthReceiptRef!==second.sceneTruthReceiptRef) throw new Error('authority_changed');
    return reply(200,{ok:true,status:'point-in-time-memory-plan-verified',
      privateMediaAuthorized:false,replayDeliveryAuthorized:false,j9Accepted:false});
  } catch {
    return reply(403,{ok:false,error:'spatial_memory_plan_authority_unavailable'});
  }
}
