import 'server-only';

import { readStudioLongformJson } from './studio-life-movie-longform-contract';

export type StudioLifeMovieConsent = {
  purpose: 'life-movie.render';
  policyVersion: string;
  decisionReceiptId: string;
};

export type StudioJobsBridgeAction =
  | { action: 'create'; tenantId: string; userId: string; idempotencyKey: string; consent: StudioLifeMovieConsent; payload: Record<string, unknown> }
  | { action: 'status' | 'cancel' | 'playback' | 'download' | 'delete-output'; tenantId: string; userId: string; jobId: string };

export type StudioJobsBridgeStatus = {
  enabled: boolean;
  configured: boolean;
  urlConfigured: boolean;
  tokenConfigured: boolean;
  production: boolean;
  dispatchAvailable: boolean;
  reason?: string;
};

const DEFAULT_TIMEOUT_MS = 15_000;

function productionRuntime() {
  return process.env.NODE_ENV === 'production';
}

function dispatchEnabled() {
  return process.env.URAI_STUDIO_JOBS_DISPATCH_ENABLED === 'true';
}

function bridgeUrl() {
  return String(process.env.URAI_JOBS_BRIDGE_URL || '').trim();
}

function bridgeToken() {
  return String(process.env.URAI_STUDIO_JOBS_BRIDGE_TOKEN || '').trim();
}

function validateBridgeUrl(raw: string) {
  if (!raw) throw new Error('jobs_bridge_url_missing');
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('jobs_bridge_url_invalid');
  }

  if (url.username || url.password || url.search || url.hash) throw new Error('jobs_bridge_url_invalid');
  if (url.protocol === 'https:') return url;

  const loopback = ['127.0.0.1', 'localhost', '::1'].includes(url.hostname);
  if (!productionRuntime() && url.protocol === 'http:' && loopback) return url;

  throw new Error('jobs_bridge_url_not_approved');
}

export function studioJobsBridgeStatus(): StudioJobsBridgeStatus {
  const enabled = dispatchEnabled();
  const rawUrl = bridgeUrl();
  const token = bridgeToken();
  let urlValid = false;
  try {
    if (rawUrl) {
      validateBridgeUrl(rawUrl);
      urlValid = true;
    }
  } catch {
    urlValid = false;
  }

  const configured = urlValid && Boolean(token);
  return {
    enabled,
    configured,
    urlConfigured: urlValid,
    tokenConfigured: Boolean(token),
    production: productionRuntime(),
    dispatchAvailable: enabled && configured,
    reason: !enabled
      ? 'dispatch_disabled'
      : !urlValid
        ? 'bridge_url_unconfigured_or_invalid'
        : !token
          ? 'bridge_token_missing'
          : undefined,
  };
}

export async function callStudioJobsBridge(
  input: StudioJobsBridgeAction,
  options: { timeoutMs?: number } = {},
): Promise<Record<string, unknown>> {
  const status = studioJobsBridgeStatus();
  if (!status.dispatchAvailable) throw new Error(status.reason || 'jobs_bridge_unavailable');

  const url = validateBridgeUrl(bridgeUrl());
  const token = bridgeToken();
  if (!token) throw new Error('bridge_token_missing');

  const timeoutMs = Math.max(1_000, Math.min(30_000, options.timeoutMs ?? DEFAULT_TIMEOUT_MS));
  const encoded = JSON.stringify(input);
  if (Buffer.byteLength(encoded, 'utf8') > 512 * 1024) throw new Error('life_movie_request_too_large');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      cache: 'no-store',
      // Private plans and the bridge credential are bound to the configured
      // endpoint. A redirect must never replay them to another endpoint.
      redirect: 'error',
      signal: controller.signal,
      body: encoded,
    });

    const body = await readStudioLongformJson(response, 2 * 1024 * 1024).catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new Error('jobs_bridge_invalid_response');
    }

    if (!response.ok || (body as Record<string, unknown>).ok !== true) {
      const code = typeof (body as Record<string, unknown>).error === 'string'
        && /^[a-z0-9_]{1,120}$/.test(String((body as Record<string, unknown>).error))
        ? String((body as Record<string, unknown>).error)
        : `jobs_bridge_http_${response.status}`;
      throw new Error(code);
    }

    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('jobs_bridge_timeout');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

