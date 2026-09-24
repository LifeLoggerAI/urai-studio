import type { LifeMovieProject, LifeMovieRenderPlan, LifeMovieSource } from './life-movies';

export type JobsLifeMovieRenderPayload = {
  schemaVersion: 'urai-life-movie-render-v1';
  projectId: string;
  renderPlanDigest: string;
  outputPrefix: string;
  width: 1920;
  height: 1080;
  fps: 30;
  sources: Array<{
    id: string;
    bucket: string;
    objectPath: string;
    mimeType: string;
    provenance: LifeMovieSource['provenance'];
    sourceRefs: string[];
    consentRef: string;
    ownerOrRightsRef: string;
  }>;
  timeline: Array<{ sourceId: string; startMs: number; endMs: number }>;
  subtitleText: string;
  spatialRequired: false;
  publicReleaseAuthorized: false;
  providerGenerationAuthorized: false;
};

export type LifeMovieBridgeResult = {
  ok: boolean;
  status?: string;
  jobId?: string;
  deduplicated?: boolean;
  job?: Record<string, unknown>;
  error?: string;
};

const SUPPORTED_RENDER_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp',
  'video/mp4', 'video/quicktime', 'video/webm',
  'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg',
]);

function bridgeUrl() {
  const value = process.env.URAI_JOBS_LIFE_MOVIE_BRIDGE_URL?.trim() || '';
  if (!value) return null;
  const parsed = new URL(value);
  if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
    throw new Error('life_movie_jobs_bridge_requires_https');
  }
  return value.replace(/\/$/, '');
}

function bridgeToken() {
  return process.env.URAI_JOBS_LIFE_MOVIE_BRIDGE_TOKEN?.trim() || null;
}

function storageBucket() {
  return process.env.URAI_STUDIO_STORAGE_BUCKET?.trim() || null;
}

function parseSourceLocation(source: LifeMovieSource, tenantId: string) {
  if (!source.mimeType || !SUPPORTED_RENDER_MIME.has(source.mimeType)) {
    throw new Error(`life_movie_source_mime_not_renderable:${source.id}`);
  }

  if (source.uri.startsWith('gs://')) {
    const withoutScheme = source.uri.slice(5);
    const slash = withoutScheme.indexOf('/');
    if (slash < 1) throw new Error(`invalid_gcs_source_uri:${source.id}`);
    const bucket = withoutScheme.slice(0, slash);
    const objectPath = withoutScheme.slice(slash + 1);
    if (![ `studios/${tenantId}/`, `tenants/${tenantId}/` ].some((prefix) => objectPath.startsWith(prefix))) {
      throw new Error(`life_movie_source_outside_tenant:${source.id}`);
    }
    return { bucket, objectPath };
  }

  if (source.uri.startsWith(`studios/${tenantId}/`)) {
    const bucket = storageBucket();
    if (!bucket) throw new Error('urai_studio_storage_bucket_unconfigured');
    return { bucket, objectPath: source.uri };
  }

  throw new Error(`life_movie_source_not_staged_for_render:${source.id}`);
}

export function lifeMovieJobsBridgeStatus() {
  let url: string | null = null;
  let configurationError: string | null = null;
  try {
    url = bridgeUrl();
  } catch (error) {
    configurationError = error instanceof Error ? error.message : 'bridge_configuration_invalid';
  }
  return {
    configured: Boolean(url && bridgeToken()),
    urlConfigured: Boolean(url),
    tokenConfigured: Boolean(bridgeToken()),
    storageBucketConfigured: Boolean(storageBucket()),
    configurationError,
  };
}

export function buildJobsLifeMovieRenderPayload(project: LifeMovieProject, renderPlan: LifeMovieRenderPlan): JobsLifeMovieRenderPayload {
  const sources = project.sources.map((source) => {
    const location = parseSourceLocation(source, project.tenantId);
    return {
      id: source.id,
      ...location,
      mimeType: source.mimeType!,
      provenance: source.provenance,
      sourceRefs: source.sourceRefs,
      consentRef: source.consentRef,
      ownerOrRightsRef: source.ownerOrRightsRef,
    };
  });

  return {
    schemaVersion: 'urai-life-movie-render-v1',
    projectId: project.id,
    renderPlanDigest: renderPlan.inputDigest,
    outputPrefix: `tenants/${project.tenantId}/life-movies/${project.id}/${renderPlan.inputDigest.slice(0, 16)}`,
    width: 1920,
    height: 1080,
    fps: 30,
    sources,
    timeline: renderPlan.timeline.map(({ sourceId, startMs, endMs }) => ({ sourceId, startMs, endMs })),
    subtitleText: renderPlan.subtitleText,
    spatialRequired: false,
    publicReleaseAuthorized: false,
    providerGenerationAuthorized: false,
  };
}

async function callBridge(body: Record<string, unknown>): Promise<LifeMovieBridgeResult> {
  const url = bridgeUrl();
  const token = bridgeToken();
  if (!url || !token) return { ok: false, error: 'life_movie_jobs_bridge_unconfigured' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => ({})) as LifeMovieBridgeResult;
    if (!response.ok || payload.ok !== true) {
      return { ok: false, error: typeof payload.error === 'string' ? payload.error : `jobs_bridge_http_${response.status}` };
    }
    return payload;
  } catch (error) {
    return { ok: false, error: error instanceof Error && error.name === 'AbortError' ? 'jobs_bridge_timeout' : 'jobs_bridge_unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

export async function dispatchLifeMovieRender(input: {
  tenantId: string;
  userId: string;
  idempotencyKey: string;
  payload: JobsLifeMovieRenderPayload;
}) {
  return callBridge({ action: 'create', ...input });
}

export async function getLifeMovieRenderStatus(input: { tenantId: string; userId: string; jobId: string }) {
  return callBridge({ action: 'status', ...input });
}

export async function cancelLifeMovieRender(input: { tenantId: string; userId: string; jobId: string }) {
  return callBridge({ action: 'cancel', ...input });
}
