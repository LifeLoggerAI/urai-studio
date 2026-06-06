import { NextResponse } from 'next/server';

import { createStudioJob, listTenantJobs, runtimeStoreStatus } from '@/lib/studio-runtime-store';
import type { StudioExportKind, StudioJobKind } from '@/lib/urai-system-contract';

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

function optionalText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean) : [];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') ?? 'public-studio';
  const result = await listTenantJobs(tenantId);

  if (!result.ok) {
    return json(
      {
        ok: !isProduction,
        status: result.error ?? 'runtime_store_unconfigured',
        persisted: false,
        store: runtimeStoreStatus(),
        data: !isProduction ? [] : undefined,
        error: isProduction ? { code: result.error, message: 'Studio job persistence is unavailable.' } : undefined,
      },
      isProduction ? 503 : 200,
    );
  }

  return json({ ok: true, status: 'listed', persisted: true, store: runtimeStoreStatus(), data: result.data });
}

export async function POST(req: Request) {
  const rawBody = await req.json().catch(() => null);
  if (!rawBody) {
    return json({ ok: false, status: 'invalid_json', error: { code: 'invalid_json', message: 'Request body must be valid JSON.' } }, 400);
  }

  const body = asRecord(rawBody);
  const prompt = text(body.prompt);
  const projectId = optionalText(body.projectId);
  const briefId = optionalText(body.briefId);
  const tenantId = text(body.tenantId, 'public-studio');
  const userId = text(body.userId, 'anonymous-studio-user');
  const kind = text(body.kind, 'asset_bundle_export') as StudioJobKind;
  const requestedExports = stringArray(body.requestedExports) as StudioExportKind[];

  if (prompt.length < 8) {
    return json({ ok: false, status: 'invalid_prompt', error: { code: 'invalid_prompt', message: 'Prompt must be at least 8 characters.' } }, 400);
  }

  const result = await createStudioJob({
    projectId,
    briefId,
    kind,
    prompt,
    requestedExports: requestedExports.length ? requestedExports : ['json'],
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
              kind,
              prompt,
              requestedExports: requestedExports.length ? requestedExports : ['json'],
              tenantId,
              userId,
            }
          : undefined,
        error: isProduction ? { code: result.error, message: 'Studio job persistence is unavailable.' } : undefined,
      },
      isProduction ? 503 : 202,
    );
  }

  return json({ ok: true, status: 'queued', persisted: true, store: runtimeStoreStatus(), data: result.data });
}
