import { randomUUID } from 'node:crypto';

import { studioIntegrations, type StudioIntegrationDiagnostic } from './integrations';

export type StudioObservedIntegrationState =
  | 'missing'
  | 'configured'
  | 'unreachable'
  | 'unauthorized'
  | 'degraded'
  | 'healthy'
  | 'blocked'
  | 'hard-off';

export type StudioReadinessProfileId =
  | 'PUBLIC_SITE'
  | 'FULL_STUDIO_PLATFORM'
  | 'PROVIDER_EXECUTION'
  | 'SPATIAL_HANDOFF'
  | 'MEDIA_PRODUCTION';

export type StudioObservedIntegration = {
  id: string;
  required: boolean;
  configured: boolean;
  observed: boolean;
  state: StudioObservedIntegrationState;
  httpStatus?: number;
  attempts: number;
  correlationId: string;
  checkedAt: string;
};

export type StudioReadinessProfile = {
  id: StudioReadinessProfileId;
  ok: boolean;
  activationAuthorized: false;
  hardOff: boolean;
  requiredIntegrations: string[];
  blockers: string[];
  checks: StudioObservedIntegration[];
};

const PROFILE_REQUIREMENTS: Record<StudioReadinessProfileId, { required: string[]; hardOff: boolean }> = {
  PUBLIC_SITE: { required: [], hardOff: false },
  FULL_STUDIO_PLATFORM: { required: ['asset-factory', 'spatial', 'analytics', 'admin', 'privacy'], hardOff: false },
  PROVIDER_EXECUTION: { required: ['asset-factory'], hardOff: true },
  SPATIAL_HANDOFF: { required: ['spatial'], hardOff: true },
  MEDIA_PRODUCTION: { required: ['asset-factory', 'spatial'], hardOff: true },
};

const timeoutMs = 2200;
const maxAttempts = 2;

function serverBearerEnvKey(id: string) {
  return `URAI_STUDIO_HEALTH_BEARER_${id.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
}

function healthUrl(integration: StudioIntegrationDiagnostic) {
  if (!integration.url) return null;
  const base = integration.url.replace(/\/$/, '');
  return `${base}/api/system/health`;
}

function observedState(response: Response, body: unknown): StudioObservedIntegrationState {
  if (response.status === 401 || response.status === 403) return 'unauthorized';
  if (!response.ok) return 'degraded';
  if (body && typeof body === 'object' && !Array.isArray(body) && (body as Record<string, unknown>).ok === false) {
    return 'degraded';
  }
  return 'healthy';
}

export async function observeStudioIntegration(
  integration: StudioIntegrationDiagnostic,
): Promise<StudioObservedIntegration> {
  const correlationId = randomUUID();
  const checkedAt = new Date().toISOString();

  if (!integration.url) {
    return {
      id: integration.id,
      required: integration.required,
      configured: false,
      observed: false,
      state: 'missing',
      attempts: 0,
      correlationId,
      checkedAt,
    };
  }

  const url = healthUrl(integration);
  if (!url) {
    return {
      id: integration.id,
      required: integration.required,
      configured: false,
      observed: false,
      state: 'missing',
      attempts: 0,
      correlationId,
      checkedAt,
    };
  }

  const token = process.env[serverBearerEnvKey(integration.id)];
  let lastState: StudioObservedIntegrationState = 'unreachable';
  let lastHttpStatus: number | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'X-URAI-Correlation-ID': correlationId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      lastHttpStatus = response.status;
      const body = await response.json().catch(() => null);
      const state = observedState(response, body);
      if (state === 'healthy' || state === 'unauthorized') {
        return {
          id: integration.id,
          required: integration.required,
          configured: true,
          observed: true,
          state,
          httpStatus: response.status,
          attempts: attempt,
          correlationId,
          checkedAt,
        };
      }
      lastState = state;
    } catch {
      lastState = 'unreachable';
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    id: integration.id,
    required: integration.required,
    configured: true,
    observed: true,
    state: lastState,
    httpStatus: lastHttpStatus,
    attempts: maxAttempts,
    correlationId,
    checkedAt,
  };
}

export async function observeAllStudioIntegrations() {
  return Promise.all(studioIntegrations.map((integration) => observeStudioIntegration(integration)));
}

export function buildReadinessProfile(
  id: StudioReadinessProfileId,
  observations: StudioObservedIntegration[],
): StudioReadinessProfile {
  const config = PROFILE_REQUIREMENTS[id];
  const required = new Set(config.required);
  const checks = observations.filter((observation) => required.has(observation.id));
  const blockers = checks
    .filter((check) => check.state !== 'healthy')
    .map((check) => `${check.id}:${check.state}`);

  const missingChecks = config.required
    .filter((requiredId) => !checks.some((check) => check.id === requiredId))
    .map((requiredId) => `${requiredId}:missing_observation`);

  blockers.push(...missingChecks);

  return {
    id,
    ok: !config.hardOff && blockers.length === 0,
    activationAuthorized: false,
    hardOff: config.hardOff,
    requiredIntegrations: config.required,
    blockers,
    checks,
  };
}

export function buildAllReadinessProfiles(observations: StudioObservedIntegration[]) {
  return (Object.keys(PROFILE_REQUIREMENTS) as StudioReadinessProfileId[]).map((id) =>
    buildReadinessProfile(id, observations),
  );
}

export function parseReadinessProfile(value: string | null): StudioReadinessProfileId {
  const normalized = value?.trim().toUpperCase().replace(/-/g, '_');
  if (normalized && normalized in PROFILE_REQUIREMENTS) return normalized as StudioReadinessProfileId;
  return 'PUBLIC_SITE';
}
