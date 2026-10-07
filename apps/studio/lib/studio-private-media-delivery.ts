import 'server-only';

type Identity = { uid: string; tenantId: string };
type Authority = Identity & { ok: boolean };
type Delivery = { action: 'deliver'; kind: 'mp4' | 'srt'; authorityHash: string; expiresAt: number; generation: string; disposition: 'inline' | 'attachment'; jobId?: string; planId?: string; artifact?: string };
const MAX_BYTES = 2 * 1024 * 1024 * 1024;
function fail(): never { throw new Error('private_media_delivery_unavailable'); }
function object(value: unknown, keys: string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail();
  const result = value as Record<string, unknown>;
  if (Object.keys(result).some(key => !keys.includes(key))) fail();
  return result;
}
export function parseStudioPrivateMedia(value: unknown) {
  const body = object(value, ['bridge', 'delivery']);
  if (body.bridge !== 'short' && body.bridge !== 'longform') fail();
  const d = object(body.delivery, ['schemaVersion', 'requiresAuthorization', 'action', 'kind', 'authorityHash', 'expiresAt', 'generation', 'disposition', 'jobId', 'planId', 'artifact']);
  if (d.schemaVersion !== 'urai-authenticated-private-media-v1' || d.requiresAuthorization !== true || d.action !== 'deliver'
    || typeof d.kind !== 'string' || !['mp4', 'srt'].includes(d.kind) || typeof d.authorityHash !== 'string' || !/^[a-f0-9]{64}$/.test(d.authorityHash)
    || typeof d.generation !== 'string' || !/^[1-9][0-9]*$/.test(d.generation) || typeof d.expiresAt !== 'number' || !Number.isSafeInteger(d.expiresAt)
    || d.expiresAt <= Date.now() || d.expiresAt > Date.now() + 300_000 || typeof d.disposition !== 'string' || !['inline', 'attachment'].includes(d.disposition)) fail();
  if (body.bridge === 'short') {
    if (typeof d.jobId !== 'string' || !/^[A-Za-z0-9_-]{10,64}$/.test(d.jobId) || d.planId !== undefined || d.artifact !== undefined) fail();
  } else if (typeof d.planId !== 'string' || !/^lmp_[A-Za-z0-9_-]{20,64}$/.test(d.planId)
    || typeof d.artifact !== 'string' || !/^(?:final|segment:(?:0|[1-9][0-9]{0,2}))$/.test(d.artifact) || d.jobId !== undefined) fail();
  const delivery: Delivery = { action: 'deliver', kind: d.kind as Delivery['kind'], authorityHash: d.authorityHash as string,
    expiresAt: d.expiresAt, generation: d.generation as string, disposition: d.disposition as Delivery['disposition'] };
  if (body.bridge === 'short') delivery.jobId = d.jobId as string;
  else { delivery.planId = d.planId as string; delivery.artifact = d.artifact as string; }
  return { bridge: body.bridge as 'short' | 'longform', delivery };
}

function configuration(bridge: 'short' | 'longform') {
  const long = bridge === 'longform';
  if (process.env[long ? 'URAI_STUDIO_LONGFORM_DISPATCH_ENABLED' : 'URAI_STUDIO_JOBS_DISPATCH_ENABLED'] !== 'true') fail();
  const rawUrl = String(process.env[long ? 'URAI_JOBS_LONGFORM_BRIDGE_URL' : 'URAI_JOBS_BRIDGE_URL'] || '').trim();
  const token = String(process.env.URAI_STUDIO_JOBS_BRIDGE_TOKEN || '').trim();
  let url: URL;
  try { url = new URL(rawUrl); } catch { return fail(); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (!token || url.username || url.password || url.search || url.hash
    || (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && local && url.protocol === 'http:'))) fail();
  return { url: url.href, token };
}

/** Identity is server-owned. Descriptors never grant access; every bounded read
 * repeats current revoked-token/edit-role/tenant authority and provisioning. */
export async function deliverStudioPrivateMedia(args: { value: unknown; identity: Identity; request: Request; authorize: () => Promise<Authority> }): Promise<Response> {
  const { bridge, delivery } = parseStudioPrivateMedia(args.value);
  const snapshot = configuration(bridge), expires = Math.min(delivery.expiresAt, Date.now() + 55_000);
  const controller = new AbortController();
  let stopped = false;
  const timer = setTimeout(() => { controller.abort(); cleanup(); void reader?.cancel().catch(() => {}); }, Math.max(1, expires - Date.now()));
  const abort = () => controller.abort();
  args.request.signal.addEventListener('abort', abort, { once: true });
  const cleanup = () => { if (stopped) return; stopped = true; clearTimeout(timer); args.request.signal.removeEventListener('abort', abort); };
  const check = async () => {
    if (controller.signal.aborted || args.request.signal.aborted || Date.now() >= expires) fail();
    const current = await args.authorize();
    const config = configuration(bridge);
    if (!current.ok || current.uid !== args.identity.uid || current.tenantId !== args.identity.tenantId
      || config.url !== snapshot.url || config.token !== snapshot.token || controller.signal.aborted || Date.now() >= expires) fail();
  };
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    await check();
    const response = await fetch(snapshot.url, { method: 'POST', headers: { authorization: `Bearer ${snapshot.token}`,
      'content-type': 'application/json', accept: delivery.kind === 'mp4' ? 'video/mp4' : 'application/x-subrip' },
      body: JSON.stringify({ ...delivery, tenantId: args.identity.tenantId, userId: args.identity.uid }),
      cache: 'no-store', redirect: 'error', signal: controller.signal });
    await check();
    const mime = delivery.kind === 'mp4' ? 'video/mp4' : 'application/x-subrip';
    const length = response.headers.get('content-length');
    if (!response.ok || !response.body || response.headers.get('content-type')?.split(';')[0].trim() !== mime
      || (length !== null && (!/^[0-9]+$/.test(length) || !Number.isSafeInteger(Number(length)) || Number(length) > MAX_BYTES))) {
      await response.body?.cancel(); fail();
    }
    reader = response.body.getReader();
    let pending: Uint8Array | undefined, offset = 0, bytes = 0;
    const stream = new ReadableStream<Uint8Array>({
      async pull(output) {
        try {
          await check();
          if (!pending || offset === pending.byteLength) {
            const next = await reader!.read();
            await check();
            if (next.done) {
              if (length !== null && bytes !== Number(length)) fail();
              cleanup(); reader!.releaseLock(); output.close(); return;
            }
            if (next.value.byteLength < 1 || next.value.byteLength > 1024 * 1024) fail();
            pending = next.value; offset = 0;
          }
          const part = pending.subarray(offset, offset + 64 * 1024);
          offset += part.byteLength; bytes += part.byteLength;
          if (bytes > MAX_BYTES || (length !== null && bytes > Number(length))) fail();
          await check(); output.enqueue(part);
        } catch {
          controller.abort(); cleanup(); await reader?.cancel().catch(() => {}); output.error(new Error('private_media_delivery_unavailable'));
        }
      },
      async cancel() { controller.abort(); cleanup(); await reader?.cancel().catch(() => {}); },
    }, { highWaterMark: 0 });
    return new Response(stream, { headers: { 'Content-Type': mime, 'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
      'Content-Disposition': `${delivery.disposition}; filename="urai-private-media.${delivery.kind}"` } });
  } catch {
    controller.abort(); cleanup(); await reader?.cancel().catch(() => {}); fail();
  }
}
