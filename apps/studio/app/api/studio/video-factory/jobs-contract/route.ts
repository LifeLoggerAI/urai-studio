import { NextResponse } from 'next/server';

import { requireStudioAuth } from '@/lib/studio-auth';
import {
  buildJobsLifeMovieEnvelope,
  type JobsLifeMovieAudioCue,
  type JobsLifeMovieSource,
  type JobsLifeMovieTimelineItem,
} from '@/lib/studio-life-movie-jobs-bridge';

export const dynamic = 'force-dynamic';

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

function authErrorResponse(auth: Awaited<ReturnType<typeof requireStudioAuth>>) {
  return json(
    { ok:false, status:auth.error?.code ?? 'unauthorized', error:auth.error, authMode:auth.authMode },
    auth.error?.code === 'studio_membership_lookup_failed' ? 503 : auth.error?.code === 'studio_edit_role_required' ? 403 : 401,
  );
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function GET(request: Request) {
  const auth = await requireStudioAuth(request);
  if (!auth.ok) return authErrorResponse(auth);

  return json({
    ok:true,
    status:'contract-ready',
    service:'urai-studio',
    endpoint:'/api/studio/video-factory/jobs-contract',
    tenantId:auth.tenantId,
    executionAuthority:'urai-jobs',
    jobType:'studio.render.video',
    dispatchAuthorized:false,
    providerGenerationAuthorized:false,
    publicReleaseAuthorized:false,
    requiredSceneFields:['sceneTruthReceiptRef','sceneTruthDigest'],
    requiredSourceFields:['id','bucket','objectPath','mimeType','provenance','sourceRefs','consentRef','ownerOrRightsRef'],
    note:'This endpoint builds a governed Jobs request envelope only. It does not dispatch work or authorize providers/public release.',
  });
}

export async function POST(request: Request) {
  const auth = await requireStudioAuth(request);
  if (!auth.ok) return authErrorResponse(auth);

  const body = record(await request.json().catch(() => null));
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';

  try {
    const envelope = buildJobsLifeMovieEnvelope({
      tenantId: auth.tenantId,
      projectId,
      sceneTruthReceiptRef: typeof body.sceneTruthReceiptRef === 'string' ? body.sceneTruthReceiptRef : '',
      sceneTruthDigest: typeof body.sceneTruthDigest === 'string' ? body.sceneTruthDigest : '',
      sources: Array.isArray(body.sources) ? body.sources as JobsLifeMovieSource[] : [],
      timeline: Array.isArray(body.timeline) ? body.timeline as JobsLifeMovieTimelineItem[] : [],
      audioCues: Array.isArray(body.audioCues) ? body.audioCues as JobsLifeMovieAudioCue[] : [],
      subtitleText: typeof body.subtitleText === 'string' ? body.subtitleText : '',
      width: typeof body.width === 'number' ? body.width : undefined,
      height: typeof body.height === 'number' ? body.height : undefined,
      fps: typeof body.fps === 'number' ? body.fps as 24 | 25 | 30 | 50 | 60 : undefined,
    });

    return json({
      ok:true,
      status:'jobs-contract-built',
      authMode:auth.authMode,
      tenantId:auth.tenantId,
      envelope,
    });
  } catch (error) {
    return json({
      ok:false,
      status:'jobs-contract-rejected',
      authMode:auth.authMode,
      tenantId:auth.tenantId,
      error:{
        code:error instanceof Error ? error.message : 'life_movie_jobs_contract_rejected',
        message:'Life Movie render request did not satisfy the governed urai-jobs contract.',
      },
    }, 400);
  }
}
