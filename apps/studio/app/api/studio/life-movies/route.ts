import { NextResponse } from 'next/server';

import { requireStudioAuth } from '@/lib/studio-auth';
import { createStudioJob, runtimeStoreStatus } from '@/lib/studio-runtime-store';
import {
  buildLifeMovieRenderPlan,
  createLifeMovieProject,
  type LifeMovieChapter,
  type LifeMovieMode,
  type LifeMovieSource,
} from '@/lib/studio/life-movies';

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

export async function GET(req: Request) {
  const auth = await requireStudioAuth(req);
  if (!auth.ok) return authError(auth);
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
  });
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

    const job = await createStudioJob({
      projectId: project.id,
      kind: 'video_generation',
      prompt: `Compose Life Movie "${project.title}" from approved source references only. Preserve provenance and chapter order. Spatial is optional.`,
      requestedExports: project.requestedExports,
      tenantId: auth.tenantId,
      userId: auth.uid,
    });

    if (!job.ok) {
      return json({
        ok: false,
        status: job.error ?? 'runtime_store_unconfigured',
        persisted: false,
        project,
        renderPlan,
        store: runtimeStoreStatus(),
      }, 503);
    }

    return json({
      ok: true,
      status: 'queued',
      persisted: true,
      project,
      renderPlan,
      job: job.data,
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
