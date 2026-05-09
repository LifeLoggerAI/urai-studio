export type AssetFactoryStatus = 'live' | 'fallback' | 'disconnected';

export interface AssetFactoryPingResult {
  ok: boolean;
  status: AssetFactoryStatus;
  reason?: string;
  data?: unknown;
  http?: number;
  url?: string;
}

const timeoutMs = 3000;

function baseUrl(): string | null {
  const value = process.env.ASSET_FACTORY_INTERNAL_URL || process.env.NEXT_PUBLIC_ASSET_FACTORY_URL;
  return typeof value === 'string' && value.trim().length > 0 ? value.replace(/\/$/, '') : null;
}

function errorReason(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function ping(path: string): Promise<AssetFactoryPingResult> {
  const base = baseUrl();
  if (!base) return { ok: false, status: 'disconnected', reason: 'url_unconfigured' };

  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });
    const data = await response.json().catch(() => null);

    return {
      ok: response.ok,
      status: response.ok ? 'live' : 'fallback',
      data,
      http: response.status,
      url,
    };
  } catch (error) {
    return { ok: false, status: 'disconnected', reason: errorReason(error), url };
  } finally {
    clearTimeout(timeout);
  }
}

export function getAssetFactoryHealth(): Promise<AssetFactoryPingResult> {
  return ping('/api/system/health');
}

export function getAssetFactoryManifest(): Promise<AssetFactoryPingResult> {
  return ping('/api/system/manifest');
}
