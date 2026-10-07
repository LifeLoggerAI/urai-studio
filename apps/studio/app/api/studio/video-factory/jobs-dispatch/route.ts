import { NextResponse } from 'next/server';

import { requireStudioLongformAuth } from '@/lib/studio-life-movie-longform-auth';
import { readStudioLongformJson, StudioLongformError } from '@/lib/studio-life-movie-longform-contract';
import {
  buildJobsLifeMovieEnvelope,
  type JobsLifeMovieAudioCue,
  type JobsLifeMovieSource,
  type JobsLifeMovieTimelineItem,
} from '@/lib/studio-life-movie-jobs-bridge';
import { callStudioJobsBridge, requireStudioJobsRenderConsent, studioJobsBridgeStatus } from '@/lib/studio-life-movie-jobs-client';

export const dynamic = 'force-dynamic';

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

function authErrorResponse(auth: Awaited<ReturnType<typeof requireStudioLongformAuth>>) {
  return json(
    { ok:false, status:auth.error?.code ?? 'unauthorized', error:auth.error, authMode:auth.authMode },
    auth.error?.code === 'longform_edit_authority_unavailable' ? 503
      : ['longform_edit_role_required', 'longform_tenant_binding_required'].includes(auth.error?.code || '') ? 403 : 401,
  );
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('life_movie_invalid_request');
  return value as Record<string, unknown>;
}

export async function GET(request: Request) {
  const auth = await requireStudioLongformAuth(request);
  if (!auth.ok) return authErrorResponse(auth);

  return json({
    ok:true,
    status:'bridge-status',
    tenantId:auth.tenantId,
    bridge:studioJobsBridgeStatus(),
    executionAuthority:'urai-jobs',
    dispatchRequiresExplicitEnablement:true,
  });
}

export async function POST(request: Request) {
  const auth = await requireStudioLongformAuth(request);
  if (!auth.ok) return authErrorResponse(auth);

  const status = studioJobsBridgeStatus();
  if (!status.dispatchAvailable) {
    return json({
      ok:false,
      status:'dispatch-unavailable',
      tenantId:auth.tenantId,
      bridge:status,
      error:{ code:status.reason ?? 'jobs_bridge_unavailable', message:'Studio Jobs dispatch is disabled or not configured.' },
    }, 503);
  }

  try {
    const body = record(await readStudioLongformJson(request, 512 * 1024));
    const allowedFields = ['projectId', 'sceneTruthReceiptRef', 'sceneTruthDigest', 'sources', 'timeline', 'audioCues', 'subtitleText', 'width', 'height', 'fps', 'consent'];
    if (Object.keys(body).some((key) => !allowedFields.includes(key))) throw new Error('life_movie_unknown_request_field');
    const consent = requireStudioJobsRenderConsent(body.consent);
    const projectId = typeof body.projectId === 'string' ? body.projectId : '';
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

    const result = await callStudioJobsBridge({
      action:'create',
      tenantId:auth.tenantId,
      userId:auth.uid,
      idempotencyKey:envelope.idempotencyKey,
      consent,
      payload:envelope.payload as unknown as Record<string, unknown>,
    });

    return json({
      ok:true,
      status:'dispatched',
      tenantId:auth.tenantId,
      executionAuthority:'urai-jobs',
      localEnvelope:{
        schemaVersion:envelope.schemaVersion,
        jobType:envelope.jobType,
        idempotencyKey:envelope.idempotencyKey,
        renderPlanDigest:envelope.payload.renderPlanDigest,
        sceneTruthReceiptRef:envelope.payload.sceneTruthReceiptRef,
        sceneTruthDigest:envelope.payload.sceneTruthDigest,
        publicReleaseAuthorized:false,
        providerGenerationAuthorized:false,
      },
      result,
    }, 202);
  } catch (error) {
    const rawCode = error instanceof StudioLongformError ? error.code : error instanceof Error ? error.message : 'life_movie_jobs_dispatch_failed';
    const code = /^[a-z0-9_]{1,120}$/.test(rawCode) ? rawCode : 'life_movie_jobs_dispatch_failed';
    return json({
      ok:false,
      status:'dispatch-rejected',
      tenantId:auth.tenantId,
      error:{ code, message:'Life Movie dispatch did not complete.' },
    }, code === 'jobs_bridge_timeout' ? 504
      : code === 'life_movie_request_too_large' ? 413
      : error instanceof StudioLongformError ? error.status : 400);
  }
}

