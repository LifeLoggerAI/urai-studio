import { getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

export async function fetchStudioPrivateMedia(args: {
  form: 'short' | 'long'; delivery: Record<string, unknown>; getIdToken: () => Promise<string>; assertCurrentSession: () => void; fetcher?: typeof fetch;
}): Promise<Blob> {
  const operationDeadline = Date.now() + 50_000;
  if (args.delivery.requiresAuthorization !== true || args.delivery.schemaVersion !== 'urai-authenticated-private-media-v1'
    || args.delivery.action !== 'deliver' || !['mp4', 'srt'].includes(String(args.delivery.kind))) throw new Error('studio_private_media_unavailable');
  const descriptorDeadline = Number(args.delivery.expiresAt);
  if (!Number.isSafeInteger(descriptorDeadline) || descriptorDeadline <= Date.now() || descriptorDeadline > Date.now() + 300_000) throw new Error('studio_private_media_unavailable');
  const deadline = Math.min(descriptorDeadline, operationDeadline);
  const endpoint = new URL('/api/studio/video-factory/private-media/', window.location.origin);
  args.assertCurrentSession();
  const token = await args.getIdToken(); args.assertCurrentSession();
  if (!token || Date.now() >= deadline) throw new Error('studio_private_media_authentication_required');
  const response = await (args.fetcher ?? fetch)(endpoint.toString(), { method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bridge: args.form === 'short' ? 'short' : 'longform', delivery: args.delivery }), cache: 'no-store', credentials: 'omit',
    redirect: 'error', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(Math.max(1, deadline - Date.now())) });
  const mimeType = args.delivery.kind === 'mp4' ? 'video/mp4' : 'application/x-subrip';
  if (!response.ok || !response.body || response.headers.get('content-type')?.split(';')[0] !== mimeType) {
    await response.body?.cancel(); throw new Error('studio_private_media_unavailable');
  }
  const reader = response.body.getReader(), chunks: Uint8Array[] = []; let bytes = 0;
  try {
    while (true) { args.assertCurrentSession(); const next = await reader.read(); args.assertCurrentSession(); if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > 2 * 1024 * 1024 * 1024 || Date.now() >= deadline) { await reader.cancel(); throw new Error(); }
      chunks.push(next.value);
    }
    args.assertCurrentSession();
    if (!bytes || Date.now() >= deadline) throw new Error();
    return new Blob(chunks as BlobPart[], { type: mimeType });
  } catch { await reader.cancel().catch(() => {}); throw new Error('studio_private_media_unavailable'); }
  finally { reader.releaseLock(); }
}

export async function downloadStudioPrivateMedia(form: 'short' | 'long', delivery: Record<string, unknown>): Promise<Blob> {
  const auth = getAuth(getApp()), user = auth.currentUser;
  if (!user) throw new Error('studio_private_media_authentication_required');
  const assertCurrentSession = () => { if (auth.currentUser !== user) throw new Error('studio_private_media_authentication_required'); };
  return fetchStudioPrivateMedia({ form, delivery, getIdToken: () => user.getIdToken(true), assertCurrentSession });
}
