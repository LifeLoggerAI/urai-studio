import 'server-only';
import { createHash } from 'node:crypto';

import { StudioLongformError, readStudioLongformJson, STUDIO_LONGFORM_JOBS_CONTRACT, type StudioLongformRequest } from './studio-life-movie-longform-contract';

function validateUrl(raw: string): URL {
  let url;
  try { url = new URL(raw); } catch { throw new StudioLongformError('longform_bridge_url_invalid', 503); }
  if (url.username || url.password || url.search || url.hash) throw new StudioLongformError('longform_bridge_url_invalid', 503);
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && local && url.protocol === 'http:')) {
    throw new StudioLongformError('longform_bridge_url_not_approved', 503);
  }
  return url;
}

export function studioLongformBridgeStatus() {
  const enabled = process.env.URAI_STUDIO_LONGFORM_DISPATCH_ENABLED === 'true';
  const rawUrl = String(process.env.URAI_JOBS_LONGFORM_BRIDGE_URL || '').trim();
  const token = String(process.env.URAI_STUDIO_JOBS_BRIDGE_TOKEN || '').trim();
  let urlConfigured = false;
  try { if (rawUrl) { validateUrl(rawUrl); urlConfigured = true; } } catch { /* fail closed */ }
  const tokenConfigured = Boolean(token);
  return {
    enabled, urlConfigured, tokenConfigured,
    configured: urlConfigured && tokenConfigured,
    dispatchAvailable: enabled && urlConfigured && tokenConfigured,
    reason: !enabled ? 'longform_dispatch_disabled' : !urlConfigured ? 'longform_bridge_url_unconfigured_or_invalid' : !tokenConfigured ? 'longform_bridge_token_missing' : undefined,
  };
}

export async function callStudioLongformBridge(input: StudioLongformRequest): Promise<Record<string, unknown>> {
  const status = studioLongformBridgeStatus();
  if (!status.dispatchAvailable) throw new StudioLongformError(status.reason || 'longform_bridge_unavailable', 503);
  const url = validateUrl(String(process.env.URAI_JOBS_LONGFORM_BRIDGE_URL || '').trim());
  const token = String(process.env.URAI_STUDIO_JOBS_BRIDGE_TOKEN || '').trim();
  const encoded = JSON.stringify(input);
  // Server-owned identity, digests and flags add bytes to the caller's body.
  // Apply Jobs' bound to the actual transmitted UTF-8 envelope as well.
  if (Buffer.byteLength(encoded, 'utf8') > STUDIO_LONGFORM_JOBS_CONTRACT.maxRequestBytes) {
    throw new StudioLongformError('longform_request_too_large', 413);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json' },
      cache: 'no-store', signal: controller.signal, body: encoded,
      redirect: 'error',
    });
    let body;
    try { body = await readStudioLongformJson(response, 2 * 1024 * 1024, controller.signal); }
    catch { throw new StudioLongformError('longform_bridge_invalid_response', 502); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new StudioLongformError('longform_bridge_invalid_response', 502);
    const result = body as Record<string, unknown>;
    if (!response.ok || result.ok !== true) {
      const code = typeof result.error === 'string' && /^[a-z0-9_]{1,120}$/.test(result.error) ? result.error : 'longform_bridge_rejected';
      throw new StudioLongformError(code, response.status >= 400 && response.status <= 599 ? response.status : 502);
    }
    return result;
  } catch (error) {
    // The JSON reader hides transport details. Check the operation's deadline
    // before that sanitized parsing failure becomes an invalid-response error.
    if (controller.signal.aborted) throw new StudioLongformError('longform_bridge_timeout', 504);
    if (error instanceof StudioLongformError) throw error;
    throw new StudioLongformError(error instanceof Error && error.name === 'AbortError' ? 'longform_bridge_timeout' : 'longform_bridge_unavailable', error instanceof Error && error.name === 'AbortError' ? 504 : 502);
  } finally { clearTimeout(timer); }
}



/** Authenticated service-to-service final artifact transport, NOT a public URL.
 * Only a separately verified, owner-scoped Jobs playback descriptor may supply
 * the generation and checksum. Limit memory to one bounded pilot artifact.
 * No media bytes are released to the caller until all bytes match the hash. */
export async function callStudioLongformPrivateBytes(
  input: { action:'deliver'; tenantId:string; userId:string; planId:string;
    artifact:'final'; kind:'mp4'|'srt'; authorityHash:string; expiresAt:number;
    generation:string; disposition:'inline' },
  expected: { sha256:string; mimeType:'video/mp4'|'application/x-subrip'; signal?:AbortSignal },
): Promise<Buffer> {
  const status=studioLongformBridgeStatus();
  if(!status.dispatchAvailable) throw new StudioLongformError(status.reason || 'longform_bridge_unavailable',503);
  if(!/^[a-f0-9]{64}$/.test(expected.sha256) ||
     !/^[a-f0-9]{64}$/.test(input.authorityHash) ||
     !/^[1-9][0-9]*$/.test(input.generation) ||
     input.artifact!=='final' || input.action!=='deliver' || input.disposition!=='inline' ||
     (input.kind==='mp4'?'video/mp4':'application/x-subrip')!==expected.mimeType ||
     !Number.isSafeInteger(input.expiresAt) || input.expiresAt<=Date.now() ||
     input.expiresAt>Date.now()+5*60_000) {
    throw new StudioLongformError('longform_private_delivery_binding_invalid',403);
  }
  const url=validateUrl(String(process.env.URAI_JOBS_LONGFORM_BRIDGE_URL || '').trim());
  const token=String(process.env.URAI_STUDIO_JOBS_BRIDGE_TOKEN || '').trim();
  const encoded=JSON.stringify(input);
  if(Buffer.byteLength(encoded,'utf8')>STUDIO_LONGFORM_JOBS_CONTRACT.maxRequestBytes)
    throw new StudioLongformError('longform_request_too_large',413);
  const controller=new AbortController();
  const abort=()=>controller.abort();
  expected.signal?.addEventListener('abort',abort,{once:true});
  const deadline=Math.min(input.expiresAt,Date.now()+52_000);
  const timer=setTimeout(abort,Math.max(1,deadline-Date.now()));
  let reader:ReadableStreamDefaultReader<Uint8Array>|null=null;
  try {
    const response=await fetch(url,{
      method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json',
        accept:expected.mimeType},body:encoded,cache:'no-store',redirect:'error',
      signal:controller.signal,
    });
    const contentType=response.headers.get('content-type')?.split(';')[0];
    const disposition=response.headers.get('content-disposition');
    const encoding=response.headers.get('content-encoding');
    if(response.status!==200||!response.ok||!response.body ||
      contentType!==expected.mimeType ||
      !disposition?.startsWith('inline;') ||
      !response.headers.get('cache-control')?.includes('no-store') ||
      (encoding&&encoding.toLowerCase()!=='identity') ||
      response.headers.has('content-range')) {
      await response.body?.cancel().catch(()=>undefined);
      throw new StudioLongformError('longform_private_media_response_invalid',502);
    }
    const MAX_BYTES=64*1024*1024; // bounded local/nonproduction artifact admission
    const advertised=response.headers.get('content-length');
    if(advertised!==null && (!/^[1-9][0-9]*$/.test(advertised) || Number(advertised)>MAX_BYTES))
      throw new StudioLongformError('longform_private_media_too_large',413);
    reader=response.body.getReader();
    const chunks:Buffer[]=[];let total=0;
    const digest=createHash('sha256');
    while(true) {
      if(controller.signal.aborted||Date.now()>=deadline)
        throw new StudioLongformError('longform_private_media_timeout',504);
      const {done,value}=await reader.read();
      if(controller.signal.aborted||Date.now()>=deadline)
        throw new StudioLongformError('longform_private_media_timeout',504);
      if(done)break;
      total+=value.byteLength;
      if(total>MAX_BYTES)throw new StudioLongformError('longform_private_media_too_large',413);
      digest.update(value);chunks.push(Buffer.from(value));
    }
    if(total<1||digest.digest('hex')!==expected.sha256)
      throw new StudioLongformError('longform_private_media_hash_mismatch',502);
    return Buffer.concat(chunks,total);
  }catch(error){
    if(controller.signal.aborted)throw new StudioLongformError('longform_private_media_timeout',504);
    if(error instanceof StudioLongformError)throw error;
    throw new StudioLongformError('longform_private_media_unavailable',502);
  }finally{
    clearTimeout(timer);expected.signal?.removeEventListener('abort',abort);
    if(reader){await reader.cancel().catch(()=>undefined);reader.releaseLock();}
  }
}
