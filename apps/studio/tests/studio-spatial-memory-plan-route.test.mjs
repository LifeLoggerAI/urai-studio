import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../app/api/studio/spatial-memory-plan/route.ts',import.meta.url),'utf8');
for(const clause of [
  "requireStudioLongformAuth(request)",
  "URAI_STUDIO_SPATIAL_MEMORY_PLAN_ENABLED",
  "URAI_STUDIO_SPATIAL_IDENTITY_ENABLED",
  "verifyIdToken(token,true)",
  "verifyStudioSpatialAccountLink(identityArgs)",
  "verifyCurrentSpatialMemoryPlan({",
  "refreshStudioLongformAuth(request,actor)",
  "readOwnedJobsPlan:({userId,tenantId,planId})",
  "callStudioLongformBridge({action:'status',userId,tenantId,planId})",
  "privacyRuntime/exportAuthority",
  "deletionJobs",
  "privateMediaAuthorized:false",
  "replayDeliveryAuthorized:false",
  "j9Accepted:false",
]) assert.ok(source.includes(clause),'Missing read-only boundary '+clause);
for(const unsafe of ["createSignedUrl","callStudioLongformPrivateBytes","return new Response(bytes)","redirect:","publicReleaseAuthorized:true","initializeApp({credential:applicationDefault(),projectId:STUDIO_IDENTITY_PROJECT}"]){
  assert.equal(source.includes(unsafe),false,'Forbidden unauthorized media primitive '+unsafe);
}
console.log('[PASS] Spatial memory route preflight checks remain read-only, owner-scoped and fail-closed; NOT cloud acceptance');
