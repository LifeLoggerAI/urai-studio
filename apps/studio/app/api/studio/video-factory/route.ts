import { NextResponse } from 'next/server';

import { requireStudioAuth } from '@/lib/studio-auth';
import { createStudioJob, runtimeStoreStatus } from '@/lib/studio-runtime-store';
import {
  DEFAULT_VIDEO_FACTORY_TEMPLATE_ID,
  URAI_VIDEO_FACTORY_TEMPLATES,
  buildVideoFactoryJobRequest,
  getVideoFactoryTemplate,
  validateVideoFactoryManifest,
} from '@/lib/studio-video-factory';

export const dynamic = 'force-dynamic';

const isProduction = process.env.NODE_ENV === 'production';

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json({ ...body, timestamp: new Date().toISOString() }, { status, headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function optionalText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function authErrorResponse(auth: Awaited<ReturnType<typeof requireStudioAuth>>) {
  return json({ ok: false, status: auth.error?.code ?? 'unauthorized', error: auth.error, authMode: auth.authMode }, 401);
}

export async function GET(req: Request) {
  const auth = await requireStudioAuth(req);
  if (!auth.ok) return authErrorResponse(auth);

  return json({
    ok: true,
    status: 'listed',
    authMode: auth.authMode,
    tenantId: auth.tenantId,
    defaultTemplateId: DEFAULT_VIDEO_FACTORY_TEMPLATE_ID,
    templates: URAI_VIDEO_FACTORY_TEMPLATES.map((template) => ({
      id: template.id,
      templateId: template.templateId,
      title: template.title,
      durationSeconds: template.durationSeconds,
      jobKind: template.jobKind,
      requestedExports: template.requestedExports,
      routes: template.routeCaptures.map((capture) => capture.route),
      validation: validateVideoFactoryManifest(template),
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireStudioAuth(req);
  if (!auth.ok) return authErrorResponse(auth);

  const rawBody = await req.json().catch(() => null);
  const body = asRecord(rawBody);
  const templateId = optionalText(body.templateId) ?? DEFAULT_VIDEO_FACTORY_TEMPLATE_ID;
  const template = getVideoFactoryTemplate(templateId);

  if (!template) {
    return json({ ok: false, status: 'unknown_template', availableTemplateIds: URAI_VIDEO_FACTORY_TEMPLATES.map((item) => item.templateId) }, 404);
  }

  const validation = validateVideoFactoryManifest(template);
  if (!validation.ok) {
    return json({ ok: false, status: 'invalid_manifest', templateId, validation }, 500);
  }

  const jobRequest = buildVideoFactoryJobRequest({
    templateId,
    projectId: optionalText(body.projectId),
    prompt: optionalText(body.prompt),
  });

  const result = await createStudioJob({
    projectId: jobRequest.projectId,
    kind: jobRequest.kind,
    prompt: jobRequest.prompt,
    requestedExports: jobRequest.requestedExports,
    tenantId: auth.tenantId,
    userId: auth.uid,
  });

  if (!result.ok) {
    return json(
      {
        ok: !isProduction,
        status: result.error ?? 'runtime_store_unconfigured',
        persisted: false,
        authMode: auth.authMode,
        tenantId: auth.tenantId,
        store: runtimeStoreStatus(),
        data: !isProduction
          ? {
              contractOnly: true,
              templateId: template.templateId,
              manifestId: template.id,
              kind: jobRequest.kind,
              requestedExports: jobRequest.requestedExports,
              validation,
            }
          : undefined,
      },
      isProduction ? 503 : 202,
    );
  }

  return json({
    ok: true,
    status: 'queued',
    persisted: true,
    authMode: auth.authMode,
    tenantId: auth.tenantId,
    store: runtimeStoreStatus(),
    templateId: template.templateId,
    manifestId: template.id,
    validation,
    data: result.data,
  });
}
