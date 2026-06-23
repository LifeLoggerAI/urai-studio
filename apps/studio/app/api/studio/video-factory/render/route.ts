import { NextResponse } from 'next/server';

import { buildVideoFactoryRenderPackage } from '@/lib/studio-video-renderer';

export async function GET() {
  const renderPackage = buildVideoFactoryRenderPackage({ mode: 'contract-only' });
  return NextResponse.json(renderPackage);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const renderPackage = buildVideoFactoryRenderPackage({
    templateId: typeof body.templateId === 'string' ? body.templateId : undefined,
    prompt: typeof body.prompt === 'string' ? body.prompt : undefined,
    mode: body.mode === 'playwright-ffmpeg' ? 'playwright-ffmpeg' : 'contract-only',
  });

  return NextResponse.json(renderPackage);
}
