import { NextResponse } from 'next/server';

import { requireStudioLongformAuth } from '@/lib/studio-life-movie-longform-auth';
import { callStudioLongformBridge, studioLongformBridgeStatus } from '@/lib/studio-life-movie-longform-client';
import { buildStudioLongformRequest, readStudioLongformJson, StudioLongformError, STUDIO_LONGFORM_JOBS_CONTRACT } from '@/lib/studio-life-movie-longform-contract';

export const dynamic = 'force-dynamic';

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
function authError(auth: Awaited<ReturnType<typeof requireStudioLongformAuth>>) {
  const code = auth.error?.code || 'unauthorized';
  return json({ ok: false, error: { code, message: 'Verified Studio long-form edit authority is required.' } },
    code === 'longform_edit_authority_unavailable' ? 503 : ['longform_edit_role_required', 'longform_tenant_binding_required'].includes(code) ? 403 : 401);
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
    const envelope = buildStudioLongformRequest(body, { tenantId: auth.tenantId, userId: auth.uid });
    const result = await callStudioLongformBridge(envelope);
    return json({ ok: true, action: envelope.action, tenantId: auth.tenantId, executionAuthority: 'urai-jobs', publicReleaseAuthorized: false, providerGenerationAuthorized: false, result }, envelope.action === 'create' || envelope.action === 'assemble' ? 202 : 200);
  } catch (error) {
    const code = error instanceof StudioLongformError ? error.code : 'longform_dispatch_failed';
    return json({ ok: false, status: 'longform-dispatch-rejected', error: { code, message: 'Long-form dispatch did not complete.' } }, error instanceof StudioLongformError ? error.status : 500);
  }
}
