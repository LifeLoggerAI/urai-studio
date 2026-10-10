import { getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

const EXPORT_MAX_BYTES = 16 * 1024 * 1024;
export async function fetchAuthorizedStudioExport(args: {
  url: string; projectId: string; getIdToken: () => Promise<string>; assertCurrentSession: () => void; fetcher?: typeof fetch;
}): Promise<Blob> {
  let endpoint: URL;
  try { endpoint = new URL(args.url); } catch { throw new Error('studio_export_endpoint_invalid'); }
  if (!/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(args.projectId) || endpoint.protocol !== 'https:'
    || endpoint.hostname !== `us-central1-${args.projectId}.cloudfunctions.net` || endpoint.port
    || endpoint.pathname !== '/downloadStudioDataExport' || endpoint.username || endpoint.password || endpoint.hash
    || [...endpoint.searchParams.keys()].length !== 3
    || [...endpoint.searchParams.keys()].some(key => !['requestId', 'expiresAt', 'authorityHash'].includes(key))
    || !/^[A-Za-z0-9_-]{1,160}$/.test(endpoint.searchParams.get('requestId') || '')
    || !/^[a-f0-9]{64}$/.test(endpoint.searchParams.get('authorityHash') || '')) throw new Error('studio_export_endpoint_invalid');
  const expiresAt = Number(endpoint.searchParams.get('expiresAt'));
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now() || expiresAt > Date.now() + 300_000) throw new Error('studio_export_download_expired');
  args.assertCurrentSession();
  const token = await args.getIdToken();
  args.assertCurrentSession();
  if (!token || expiresAt <= Date.now()) throw new Error('studio_export_download_expired');
  const response = await (args.fetcher ?? fetch)(endpoint.toString(), {
    method: 'GET', headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', credentials: 'omit',
    redirect: 'error', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(Math.max(1, expiresAt - Date.now())),
  });
  if (!response.ok || !response.headers.get('content-type')?.startsWith('application/json') || !response.body) {
    await response.body?.cancel(); throw new Error('studio_export_download_unavailable');
  }
  const reader = response.body.getReader(), chunks: Uint8Array[] = []; let bytes = 0;
  try {
    while (true) {
      args.assertCurrentSession();
      const next = await reader.read(); args.assertCurrentSession(); if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > EXPORT_MAX_BYTES || Date.now() >= expiresAt) { await reader.cancel(); throw new Error('studio_export_download_unavailable'); }
      chunks.push(next.value);
    }
    args.assertCurrentSession();
    if (!bytes || Date.now() >= expiresAt) throw new Error('studio_export_download_unavailable');
    return new Blob(chunks as BlobPart[], { type: 'application/json' });
  } catch { await reader.cancel().catch(() => {}); throw new Error('studio_export_download_unavailable'); }
  finally { reader.releaseLock(); }
}

/** Existing current Firebase identity and canonical consent must authorize both
 * the callable descriptor and the subsequent HTTP byte request. */
export async function downloadStudioDataExport(requestId: string): Promise<Blob> {
  const app = getApp(), auth = getAuth(app), user = auth.currentUser, projectId = app.options.projectId;
  if (!user || !projectId) throw new Error('studio_export_authentication_required');
  const assertCurrentSession = () => { if (auth.currentUser !== user) throw new Error('studio_export_authentication_required'); };
  const result = await httpsCallable<{ requestId: string }, { requiresAuthorization?: boolean; requestId?: string; url?: string }>(
    getFunctions(app), 'getStudioDataExportDownload')({ requestId });
  assertCurrentSession();
  if (result.data.requiresAuthorization !== true || result.data.requestId !== requestId || !result.data.url) {
    throw new Error('studio_export_download_unavailable');
  }
  return fetchAuthorizedStudioExport({ url: result.data.url, projectId, getIdToken: () => user.getIdToken(true), assertCurrentSession });
}
