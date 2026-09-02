import { NextResponse } from 'next/server';

import { requireStudioAuth } from '@/lib/studio-auth';
import { buildVideoFactoryRenderPackage } from '@/lib/studio-video-renderer';

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {status, headers: {'Cache-Control': 'no-store, max-age=0'}});
}

function authErrorResponse(auth: Awaited<ReturnType<typeof requireStudioAuth>>) {
  return json({ok: false, status: auth.error?.code ?? 'unauthorized', error: auth.error, authMode: auth.authMode}, auth.error?.code === 'studio_edit_role_required' ? 403 : 401);
}

export async function GET(request: Request) {
  const auth = await requireStudioAuth(request);
  if (!auth.ok) return authErrorResponse(auth);
  return json(buildVideoFactoryRenderPackage({mode: 'contract-only'}) as unknown as Record<string, unknown>);
}

export async function POST(request: Request) {
  const auth = await requireStudioAuth(request);
  if (!auth.ok) return authErrorResponse(auth);
  const body = await request.json().catch(() => ({}));
  const renderPackage = buildVideoFactoryRenderPackage({
    templateId: typeof body.templateId === 'string' ? body.templateId : undefined,
    prompt: typeof body.prompt === 'string' ? body.prompt : undefined,
    mode: body.mode === 'playwright-ffmpeg' ? 'playwright-ffmpeg' : 'contract-only',
  });
  return json(renderPackage as unknown as Record<string, unknown>);
}
