import { NextResponse } from 'next/server';

import { createStudioExport, runtimeStoreStatus } from '@/lib/studio-runtime-store';
import type { StudioExportKind } from '@/lib/urai-system-contract';

export const dynamic = 'force-dynamic';

const isProduction = process.env.NODE_ENV === 'production';

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(
    { ...body, timestamp: new Date().toISOString() },
    {
      status,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean) : [];
}

export async function GET() {
  return json({
    ok: true,
    status: 'ready',
    service: 'urai-studio',
    endpoint: '/api/studio/exports',
    store: runtimeStoreStatus(),
    requiredFields: ['projectId', 'kind'],
    tenantScoped: true,
  });
}

export async function POST(req: Request) {
  const rawBody = await req.json().catch(() => null);
  if (!rawBody) {
    return json({ ok: false, status: 'invalid_json', error: { code: 'invalid_json', message: 'Request body must be valid JSON.' } }, 400);
  }

  const body = asRecord(rawBody);
  const projectId = text(body.projectId);
  const jobId = text(body.jobId);
  const tenantId = text(body.tenantId, 'public-studio');
  const userId = text(body.userId, 'anonymous-studio-user');
  const kind = text(body.kind, 'json') as StudioExportKind;
  const assetIds = stringArray(body.assetIds);

  if (!projectId) {
    return json({ ok: false, status: 'invalid_project', error: { code: 'invalid_project', message: 'projectId is required.' } }, 400);
  }

  const result = await createStudioExport({
    projectId,
    jobId: jobId || undefined,
    assetIds,
    kind,
    tenantId,
    userId,
  });

  if (!result.ok) {
    return json(
      {
        ok: !isProduction,
        status: result.error ?? 'runtime_store_unconfigured',
        persisted: false,
        store: runtimeStoreStatus(),
        data: !isProduction
          ? {
              contractOnly: true,
              projectId,
              jobId: jobId || undefined,
              assetIds,
              kind,
              tenantId,
              userId,
              tenantScoped: true,
            }
          : undefined,
        error: isProduction ? { code: result.error, message: 'Studio export persistence is unavailable.' } : undefined,
      },
      isProduction ? 503 : 202,
    );
  }

  return json({ ok: true, status: 'queued', persisted: true, store: runtimeStoreStatus(), data: result.data });
}
