import 'server-only';
import { createHash } from 'node:crypto';
import { adminDb } from '@/lib/firebase-admin';
import { requireStudioLongformAuth, refreshStudioLongformAuth } from '@/lib/studio-life-movie-longform-auth';

/** Internal, read-only projection. NOT transferable authority or a credential.
 * Trusted cross-service transport and current render consent are NOT included.
 * No route, signer, or writer is registered.
 */
export type StudioRenderMembershipEvidence = Readonly<{
  uid: string; tenantId: string;
  studioUser: Readonly<{uid:string;role:'owner'|'admin';disabled:false;revoked:false}>;
  membership: Readonly<{uid:string;studioId:string;role:'owner'|'creator';active:true;disabled:false;revoked:false}>;
  ownerDeletionFenced:false; deletionTombstoneActive:false;
}>;
export type StudioRenderMembershipResult =
  | {status:'unavailable'}
  | {status:'current';evidence:StudioRenderMembershipEvidence};

const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const LEASE_FIELDS=[
  'deletionPlanningLeaseToken','deletionPlanningLeaseUntil',
  'deletionPlanningLeaseRequestId','deletionPlanningLeaseOperation','deletionPlanningLeaseBy',
] as const;
const deny=():StudioRenderMembershipResult=>({status:'unavailable'});

export async function readCurrentStudioRenderMembership(request:Request):Promise<StudioRenderMembershipResult> {
 try {
   const actor=await requireStudioLongformAuth(request);
   if(!actor.ok || actor.authMode!=='firebase_id_token'
     || !ID.test(actor.uid)||!ID.test(actor.tenantId)||!adminDb)return deny();
   const uid=actor.uid,tenantId=actor.tenantId;
   const fenceId=createHash('sha256').update('urai-studio-data-rights:'+uid).digest('hex');
   const [userS,memberS,fenceS,deletionS]=await Promise.all([
     adminDb.doc('studioUsers/'+uid).get(),
     adminDb.doc('memberships/'+uid+'_'+tenantId).get(),
     adminDb.doc('studioDataRightsOwnerFences/'+fenceId).get(),
     adminDb.doc('privacyDeletionTombstones/'+uid).get(),
   ]);
   if(!userS.exists||!memberS.exists)return deny();
   const user=userS.data(),member=memberS.data();
   if(!user||!member||user.uid!==uid||member.uid!==uid||member.studioId!==tenantId
     ||!['owner','admin'].includes(String(user.role))
     ||!['owner','creator'].includes(String(member.role))
     ||user.disabled===true||user.revoked===true
     ||member.active!==true||member.disabled===true||member.revoked===true)return deny();

   if(fenceS.exists){
     const f=fenceS.data();
     if(!f||f.uid!==uid||f.active!==false||f.permanent!==false
       ||typeof f.requestId!=='string'||!f.requestId)return deny();
   }
   if(deletionS.exists){
     const d=deletionS.data();
     if(!d||d.uid!==uid||d.active!==false||LEASE_FIELDS.some(field=>Object.hasOwn(d,field)))return deny();
   }
   const current=await refreshStudioLongformAuth(request,actor);
   if(!current.ok||current.uid!==uid||current.tenantId!==tenantId
     ||current.authMode!=='firebase_id_token')return deny();
   return {status:'current',evidence:{
     uid,tenantId,
     studioUser:{uid,role:user.role as 'owner'|'admin',disabled:false,revoked:false},
     membership:{uid,studioId:tenantId,role:member.role as 'owner'|'creator',
       active:true,disabled:false,revoked:false},
     ownerDeletionFenced:false,deletionTombstoneActive:false,
   }};
 } catch{return deny();}
}
