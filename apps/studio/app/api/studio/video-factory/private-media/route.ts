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
  // Request-body reads share the original operation budget. A stalled or
  // disconnected client must not keep this route alive before delivery starts.
  const inputController = new AbortController();
  const abortInput = () => inputController.abort();
  const remaining = operationDeadline - Date.now();
  const inputTimer = setTimeout(abortInput, Math.max(1, remaining));
  inputTimer.unref?.();
  if (request.signal.aborted || remaining <= 0) abortInput();
  else request.signal.addEventListener('abort', abortInput, { once: true });
  try {
    const value = await readStudioLongformJson(request, 16 * 1024, inputController.signal);
    return await deliverStudioPrivateMedia({ value, identity: { uid: auth.uid, tenantId: auth.tenantId }, request,
      authorize: () => requireStudioLongformAuth(request), operationDeadline });
  } catch {
    return NextResponse.json({ ok: false, error: 'private_media_delivery_unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } finally {
    clearTimeout(inputTimer);
    request.signal.removeEventListener('abort', abortInput);
  }
}
