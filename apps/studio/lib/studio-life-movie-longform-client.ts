import 'server-only';

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
    try { body = await readStudioLongformJson(response, 2 * 1024 * 1024); }
    catch { throw new StudioLongformError('longform_bridge_invalid_response', 502); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new StudioLongformError('longform_bridge_invalid_response', 502);
    const result = body as Record<string, unknown>;
    if (!response.ok || result.ok !== true) {
      const code = typeof result.error === 'string' && /^[a-z0-9_]{1,120}$/.test(result.error) ? result.error : 'longform_bridge_rejected';
      throw new StudioLongformError(code, response.status >= 400 && response.status <= 599 ? response.status : 502);
    }
    return result;
  } catch (error) {
    if (error instanceof StudioLongformError) throw error;
    throw new StudioLongformError(error instanceof Error && error.name === 'AbortError' ? 'longform_bridge_timeout' : 'longform_bridge_unavailable', error instanceof Error && error.name === 'AbortError' ? 504 : 502);
  } finally { clearTimeout(timer); }
}

