import { NextResponse } from 'next/server';
import { requireStudioLongformAuth } from '@/lib/studio-life-movie-longform-auth';
import { readStudioLongformJson } from '@/lib/studio-life-movie-longform-contract';
import { deliverStudioPrivateMedia } from '@/lib/studio-private-media-delivery';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request) {
  const operationDeadline = Date.now() + 50_000;
  const auth = await requireStudioLongformAuth(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: 'private_media_verified_authority_required' },
    { status: 403, headers: { 'Cache-Control': 'no-store, max-age=0' } });
  try {
    const value = await readStudioLongformJson(request, 16 * 1024);
    return await deliverStudioPrivateMedia({ value, identity: { uid: auth.uid, tenantId: auth.tenantId }, request,
      authorize: () => requireStudioLongformAuth(request), operationDeadline });
  } catch {
    return NextResponse.json({ ok: false, error: 'private_media_delivery_unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store, max-age=0' } });
  }
}
