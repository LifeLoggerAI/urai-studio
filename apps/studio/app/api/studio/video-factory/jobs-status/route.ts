import { NextResponse } from 'next/server';
import { requireStudioLongformAuth, refreshStudioLongformAuth } from '@/lib/studio-life-movie-longform-auth';
import { callStudioJobsBridge } from '@/lib/studio-life-movie-jobs-client';

export const dynamic = 'force-dynamic';

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

/** Read the existing Jobs owner-bound status interface. This endpoint cannot
 * create work, issue media capabilities, or authorize private rendering. */
export async function GET(request: Request) {
  const auth = await requireStudioLongformAuth(request);
  if (!auth.ok) return json({ ok: false, error: 'studio_current_authority_required' }, 403);
  const url = new URL(request.url);
  const jobIds = url.searchParams.getAll('jobId');
  if (jobIds.length !== 1 || [...url.searchParams.keys()].some(key => key !== 'jobId')
      || !/^[A-Za-z0-9_-]{10,64}$/.test(jobIds[0])) {
    return json({ ok: false, error: 'studio_job_reference_invalid' }, 400);
  }
  const jobId = jobIds[0];
  try {
    const result = await callStudioJobsBridge({ action: 'status', tenantId: auth.tenantId, userId: auth.uid, jobId });
    const current = await refreshStudioLongformAuth(request, auth);
    if (!current.ok) return json({ ok: false, error: 'studio_current_authority_required' }, 403);
    const job = result.job;
    if (!job || typeof job !== 'object' || Array.isArray(job)) throw new Error('jobs_bridge_invalid_response');
    const value = job as Record<string, unknown>;
    if (value.jobId !== jobId || value.ownerUid !== auth.uid || value.tenantId !== auth.tenantId
        || value.jobType !== 'studio.render.video' || typeof value.status !== 'string'
        || !/^[A-Z_]{1,40}$/.test(value.status)) throw new Error('jobs_bridge_invalid_response');
    // Never return raw worker output, storage pointers, provider receipts or errors.
    return json({ ok: true, job: { jobId, jobType: value.jobType, status: value.status } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'job_not_found' ? 404 : code === 'job_boundary_mismatch' ? 403
      : code === 'jobs_bridge_timeout' ? 504 : 503;
    return json({ ok: false, error: status === 404 ? 'studio_job_unavailable'
      : status === 403 ? 'studio_job_unavailable' : 'studio_job_status_unavailable' }, status);
  }
}
