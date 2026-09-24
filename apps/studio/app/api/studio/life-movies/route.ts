import { NextResponse } from 'next/server';

import { requireStudioAuth } from '@/lib/studio-auth';
import { canExecuteStudioFeature, resolveStudioFeaturePolicy } from '@/lib/studio/feature-policy';
import {
  createStudioJob,
  createStudioProject,
  getStudioJob,
  runtimeStoreStatus,
  updateStudioJobExecution,
} from '@/lib/studio-runtime-store';
import {
  buildJobsLifeMovieRenderPayload,
  cancelLifeMovieRender,
  dispatchLifeMovieRender,
  getLifeMovieRenderStatus,
  lifeMovieJobsBridgeStatus,
} from '@/lib/studio/life-movie-jobs-bridge';
import {
  buildLifeMovieRenderPlan,
  createLifeMovieProject,
  type LifeMovieChapter,
  type LifeMovieMode,
  type LifeMovieSource,
} from '@/lib/studio/life-movies';
import type { StudioJobStatus } from '@/lib/urai-system-contract';

export const dynamic = 'force-dynamic';

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(
    { ...body, timestamp: new Date().toISOString() },
    { status, headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function authError(auth: Awaited<ReturnType<typeof requireStudioAuth>>) {
  const code = auth.error?.code ?? 'unauthorized';
  return json({ ok: false, status: code, error: auth.error }, code === 'studio_edit_role_required' ? 403 : 401);
}

function localStatus(external: unknown): StudioJobStatus {
  const value = String(external || '').toUpperCase();
  if (value === 'RUNNING') return 'running';
  if (value === 'SUCCESS') return 'succeeded';
  if (value === 'CANCELLED') return 'canceled';
  if (value === 'FAILED' || value === 'DEAD') return 'failed';
  return 'queued';
}

async function resolveJob(req: Request, auth: Awaited<ReturnType<typeof requireStudioAuth>>, jobId: string) {
  const local = await getStudioJob({ jobId, tenantId: auth.tenantId, userId: auth.uid });
  if (!local.ok || !local.data) return { error: local.error ?? 'studio_job_not_found', status: 404 as const };
  const externalJobId = local.data.externalExecution?.jobId;
  if (!externalJobId) return { error: 'life_movie_render_not_dispatched', status: 409 as const };
  return { local: local.data, externalJobId };
}

export async function GET(req: Request) {
  const auth = await requireStudioAuth(req);
  if (!auth.ok) return authError(auth);

  const jobId = new URL(req.url).searchParams.get('jobId');
  if (!jobId) {
    return json({
      ok: true,
      status: 'ready',
      authority: 'urai-studio',
      spatialRequired: false,
      privateByDefault: true,
      providerGenerationAuthorized: false,
      publicReleaseAuthorized: false,
      supportedModes: ['chronological', 'thematic', 'documentary', 'family-history', 'legacy', 'user-directed'],
      supportedSources: ['photo', 'video', 'audio', 'transcript', 'memory', 'storytime', 'replay'],
      exports: ['mp4', 'srt', 'json'],
      renderEngine: 'ffmpeg-worker',
      jobsBridge: lifeMovieJobsBridgeStatus(),
    });
  }

  const resolved = await resolveJob(req, auth, jobId);
  if ('error' in resolved) return json({ ok: false, status: resolved.error }, resolved.status);

  const external = await getLifeMovieRenderStatus({
    tenantId: auth.tenantId,
    userId: auth.uid,
    jobId: resolved.externalJobId,
  });
  if (!external.ok) return json({ ok: false, status: external.error ?? 'jobs_bridge_status_failed' }, 503);

  const externalStatus = record(external.job).status;
  const status = localStatus(externalStatus);
  const updated = await updateStudioJobExecution({
    jobId,
    tenantId: auth.tenantId,
    userId: auth.uid,
    status,
    externalStatus: String(externalStatus ?? status),
    errorCode: status === 'failed' ? 'jobs_render_failed' : undefined,
  });

  return json({
    ok: true,
    status,
    job: updated.data ?? resolved.local,
    execution: external.job,
  });
}

export async function DELETE(req: Request) {
  const auth = await requireStudioAuth(req);
  if (!auth.ok) return authError(auth);

  const body = record(await req.json().catch(() => null));
  const jobId = typeof body.jobId === 'string' ? body.jobId : new URL(req.url).searchParams.get('jobId');
  if (!jobId) return json({ ok: false, status: 'job_id_required' }, 400);

  const resolved = await resolveJob(req, auth, jobId);
  if ('error' in resolved) return json({ ok: false, status: resolved.error }, resolved.status);

  const cancelled = await cancelLifeMovieRender({
    tenantId: auth.tenantId,
    userId: auth.uid,
    jobId: resolved.externalJobId,
  });
  if (!cancelled.ok) return json({ ok: false, status: cancelled.error ?? 'jobs_bridge_cancel_failed' }, 503);

  const updated = await updateStudioJobExecution({
    jobId,
    tenantId: auth.tenantId,
    userId: auth.uid,
    status: 'canceled',
    externalStatus: 'CANCELLED',
  });

  return json({ ok: true, status: 'canceled', job: updated.data ?? resolved.local, execution: cancelled.job });
}

export async function POST(req: Request) {
  const auth = await requireStudioAuth(req);
  if (!auth.ok) return authError(auth);

  const body = record(await req.json().catch(() => null));
  const id = typeof body.id === 'string' ? body.id : `life-movie-${Date.now()}`;
  const title = typeof body.title === 'string' ? body.title : '';
  const mode = typeof body.mode === 'string' ? body.mode as LifeMovieMode : 'user-directed';
  const sources = Array.isArray(body.sources) ? body.sources as LifeMovieSource[] : [];
  const chapters = Array.isArray(body.chapters) ? body.chapters as LifeMovieChapter[] : [];

  try {
    const project = createLifeMovieProject({
      id,
      tenantId: auth.tenantId,
      userId: auth.uid,
      title,
      mode,
      sources,
      chapters,
    });
    const renderPlan = buildLifeMovieRenderPlan(project);
    const renderPolicy = resolveStudioFeaturePolicy('life-movies-render');
    if (!canExecuteStudioFeature('life-movies-render')) {
      return json({
        ok: false,
        status: 'life_movies_render_hard_off',
        persisted: false,
        dispatched: false,
        project,
        renderPlan,
        feature: {
          id: renderPolicy.id,
          state: renderPolicy.state,
          hardOff: renderPolicy.hardOff,
          activationAuthorized: false,
        },
        providerGenerationAuthorized: false,
        publicReleaseAuthorized: false,
      }, 409);
    }

    const persistedProject = await createStudioProject({
      id: project.id,
      tenantId: auth.tenantId,
      userId: auth.uid,
      name: project.title,
      description: `URAI Life Movie (${project.mode})`,
      projectType: 'life_movie',
      metadata: {
        lifeMovie: project,
        renderPlan,
        privateByDefault: true,
        publicReleaseAuthorized: false,
        providerGenerationAuthorized: false,
      },
      linkedSystems: ['urai-studio'],
    });
    if (!persistedProject.ok) {
      return json({
        ok: false,
        status: persistedProject.error ?? 'runtime_store_unconfigured',
        persisted: false,
        project,
        renderPlan,
        store: runtimeStoreStatus(),
      }, 503);
    }

    const job = await createStudioJob({
      projectId: project.id,
      kind: 'video_generation',
      prompt: `Compose Life Movie "${project.title}" from approved source references only. Preserve provenance and chapter order. Spatial is optional.`,
      requestedExports: project.requestedExports,
      tenantId: auth.tenantId,
      userId: auth.uid,
    });
    if (!job.ok || !job.data) {
      return json({
        ok: false,
        status: job.error ?? 'runtime_store_unconfigured',
        persisted: true,
        project,
        renderPlan,
        store: runtimeStoreStatus(),
      }, 503);
    }

    const payload = buildJobsLifeMovieRenderPayload(project, renderPlan);
    const dispatch = await dispatchLifeMovieRender({
      tenantId: auth.tenantId,
      userId: auth.uid,
      idempotencyKey: `life-movie:${project.id}:${renderPlan.inputDigest}`,
      payload,
    });

    if (!dispatch.ok || !dispatch.jobId) {
      const errorCode = dispatch.error ?? 'life_movie_jobs_dispatch_failed';
      await updateStudioJobExecution({
        jobId: job.data.id,
        tenantId: auth.tenantId,
        userId: auth.uid,
        status: 'failed',
        errorCode,
        errorMessage: 'The Life Movie project is saved, but its render could not be dispatched to URAI Jobs.',
      });
      return json({
        ok: false,
        status: errorCode,
        persisted: true,
        dispatched: false,
        project,
        renderPlan,
        job: job.data,
        jobsBridge: lifeMovieJobsBridgeStatus(),
      }, 503);
    }

    const updated = await updateStudioJobExecution({
      jobId: job.data.id,
      tenantId: auth.tenantId,
      userId: auth.uid,
      status: 'queued',
      externalJobId: dispatch.jobId,
      externalStatus: 'PENDING',
    });

    return json({
      ok: true,
      status: 'queued',
      persisted: true,
      dispatched: true,
      project,
      renderPlan,
      job: updated.data ?? job.data,
      externalJobId: dispatch.jobId,
      providerGenerationAuthorized: false,
      publicReleaseAuthorized: false,
    }, 202);
  } catch (error) {
    return json({
      ok: false,
      status: 'invalid_life_movie_request',
      error: error instanceof Error ? error.message : 'invalid_request',
    }, 400);
  }
}
