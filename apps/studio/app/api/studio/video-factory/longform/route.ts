import { NextResponse } from 'next/server';

import { requireStudioLongformAuth, refreshStudioLongformAuth } from '@/lib/studio-life-movie-longform-auth';
import { callStudioLongformBridge, callStudioLongformPrivateBytes, studioLongformBridgeStatus } from '@/lib/studio-life-movie-longform-client';
import { buildStudioLongformRequest, readStudioLongformJson, StudioLongformError, STUDIO_LONGFORM_JOBS_CONTRACT } from '@/lib/studio-life-movie-longform-contract';

export const dynamic = 'force-dynamic';

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
function authError(auth: Awaited<ReturnType<typeof requireStudioLongformAuth>>) {
  const code = auth.error?.code || 'unauthorized';
  return json({ ok: false, error: { code, message: 'Verified Studio long-form edit authority is required.' } },
    code === 'longform_edit_authority_unavailable' ? 503 : ['longform_edit_role_required', 'longform_tenant_binding_required', 'longform_tenant_membership_required', 'longform_current_owner_deletion_fence'].includes(code) ? 403 : 401);
}

export async function GET(request: Request) {
  const auth = await requireStudioLongformAuth(request);
  if (!auth.ok) return authError(auth);
  return json({ ok: true, status: 'longform-bridge-status', bridge: studioLongformBridgeStatus(), tenantId: auth.tenantId, jobsContract: STUDIO_LONGFORM_JOBS_CONTRACT, executionAuthority: 'urai-jobs', publicReleaseAuthorized: false, providerGenerationAuthorized: false });
}

export async function POST(request: Request) {
  const auth = await requireStudioLongformAuth(request);
  if (!auth.ok) return authError(auth);
  const status = studioLongformBridgeStatus();
  if (!status.dispatchAvailable) return json({ ok: false, status: 'longform-dispatch-unavailable', bridge: status, error: { code: status.reason || 'longform_bridge_unavailable' } }, 503);
  try {
    const body = await readStudioLongformJson(request, STUDIO_LONGFORM_JOBS_CONTRACT.maxRequestBytes);

    // Studio is the existing owner-authenticated server broker. The browser
    // never receives the Jobs bridge credential or a raw gs:// object path.
    // Only an exactly owned final asset from a freshly read Jobs playlist
    // can be returned, after complete SHA-256 verification and a second
    // canonical Firebase identity/deletion-fence check.
    if (body && typeof body==='object' && !Array.isArray(body) &&
        (body as Record<string,unknown>).action==='deliver-final') {
      const input=body as Record<string,unknown>;
      if(Object.keys(input).some(key=>!['action','planId','kind'].includes(key)) ||
         typeof input.planId!=='string' ||
         !/^lmp_[A-Za-z0-9_-]{20,64}$/.test(input.planId) ||
         (input.kind!=='mp4'&&input.kind!=='srt')) {
        throw new StudioLongformError('longform_private_delivery_request_invalid',400);
      }
      const planId=input.planId,kind=input.kind as 'mp4'|'srt';
      const before=await refreshStudioLongformAuth(request,auth);
      if(!before.ok)return authError(before);
      const bound=await callStudioLongformBridge({
        action:'playback',tenantId:auth.tenantId,userId:auth.uid,planId,
      });
      const playlist=bound.playback && typeof bound.playback==='object' &&
        !Array.isArray(bound.playback)?bound.playback as Record<string,unknown>:null;
      const finalFile=playlist?.finalFile && typeof playlist.finalFile==='object' &&
        !Array.isArray(playlist.finalFile)?playlist.finalFile as Record<string,unknown>:null;
      const assetValue=finalFile?.[kind==='mp4'?'video':'subtitles'];
      const asset=assetValue&&typeof assetValue==='object'&&!Array.isArray(assetValue)
        ?assetValue as Record<string,unknown>:null;
      const descValue=asset?.delivery;
      const desc=descValue&&typeof descValue==='object'&&!Array.isArray(descValue)
        ?descValue as Record<string,unknown>:null;
      const mime=kind==='mp4'?'video/mp4' as const:'application/x-subrip' as const;
      if(!playlist||playlist.schemaVersion!=='urai-life-movie-private-playlist-v1' ||
        playlist.planId!==planId||playlist.publicReleaseAuthorized!==false ||
        typeof playlist.playlistDigest!=='string'||!/^[a-f0-9]{64}$/.test(playlist.playlistDigest)||
        !asset||asset.mimeType!==mime||typeof asset.checksum!=='string'||
        !/^[a-f0-9]{64}$/.test(asset.checksum)||
        !desc||desc.schemaVersion!=='urai-authenticated-private-media-v1'||
        desc.requiresAuthorization!==true||desc.action!=='deliver'||
        desc.planId!==planId||desc.artifact!=='final'||desc.kind!==kind||
        desc.disposition!=='inline'||typeof desc.authorityHash!=='string'||
        !/^[a-f0-9]{64}$/.test(desc.authorityHash)||
        typeof desc.generation!=='string'||!/^[1-9][0-9]*$/.test(desc.generation)||
        typeof desc.expiresAt!=='number'||!Number.isSafeInteger(desc.expiresAt)||
        desc.expiresAt<=Date.now()||desc.expiresAt>Date.now()+300_000) {
        throw new StudioLongformError('longform_private_delivery_binding_invalid',409);
      }
      const between=await refreshStudioLongformAuth(request,auth);
      if(!between.ok)return authError(between);
      const bytes=await callStudioLongformPrivateBytes({
        action:'deliver',tenantId:auth.tenantId,userId:auth.uid,planId,
        artifact:'final',kind,authorityHash:desc.authorityHash,
        expiresAt:desc.expiresAt,generation:desc.generation,disposition:'inline',
      },{sha256:asset.checksum,mimeType:mime,signal:request.signal});
      const after=await refreshStudioLongformAuth(request,auth);
      if(!after.ok)return authError(after);
      return new Response(new Uint8Array(bytes),{status:200,headers:{
        'Cache-Control':'private, no-store, max-age=0',
        'Content-Type':mime,'X-Content-Type-Options':'nosniff',
        'Referrer-Policy':'no-referrer','Content-Disposition':'inline; filename="urai-private-movie"',
      }});
    }
    const envelope = buildStudioLongformRequest(body, { tenantId: auth.tenantId, userId: auth.uid });
    const dispatchAuth = await refreshStudioLongformAuth(request, auth);
    if (!dispatchAuth.ok) return authError(dispatchAuth);
    const result = await callStudioLongformBridge(envelope);
    const responseAuth = await refreshStudioLongformAuth(request, auth);
    if (!responseAuth.ok) return authError(responseAuth);
    return json({ ok: true, action: envelope.action, tenantId: auth.tenantId, executionAuthority: 'urai-jobs', publicReleaseAuthorized: false, providerGenerationAuthorized: false, result }, envelope.action === 'create' || envelope.action === 'assemble' ? 202 : 200);
  } catch (error) {
    const code = error instanceof StudioLongformError ? error.code : 'longform_dispatch_failed';
    return json({ ok: false, status: 'longform-dispatch-rejected', error: { code, message: 'Long-form dispatch did not complete.' } }, error instanceof StudioLongformError ? error.status : 500);
  }
}
