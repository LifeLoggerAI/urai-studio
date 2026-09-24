export const STUDIO_FEATURE_POLICY_VERSION = 1 as const;

export type StudioFeatureState =
  | 'disabled'
  | 'demo'
  | 'configured'
  | 'ready'
  | 'live'
  | 'paused';

export type StudioFeatureId =
  | 'callables'
  | 'uploads'
  | 'exports'
  | 'xr-preview'
  | 'demo-seed'
  | 'provider-execution'
  | 'asset-factory-execution'
  | 'product-capture'
  | 'film-foundry-execution'
  | 'public-publish'
  | 'external-delivery'
  | 'brain-map-private'
  | 'collaboration-review'
  | 'future-marketplace';

export type StudioFeaturePolicy = {
  id: StudioFeatureId;
  state: StudioFeatureState;
  hardOff: boolean;
  activationAuthorized: boolean;
  source: 'server-default' | 'server-environment';
  updatedBy: 'system';
};

const FEATURE_ENV_PREFIX = 'URAI_STUDIO_FEATURE_';

const HARD_OFF_FEATURES = new Set<StudioFeatureId>([
  'xr-preview',
  'provider-execution',
  'asset-factory-execution',
  'product-capture',
  'film-foundry-execution',
  'public-publish',
  'external-delivery',
  'brain-map-private',
  'collaboration-review',
  'future-marketplace',
]);

export const STUDIO_FEATURE_IDS: readonly StudioFeatureId[] = [
  'callables',
  'uploads',
  'exports',
  'xr-preview',
  'demo-seed',
  'provider-execution',
  'asset-factory-execution',
  'product-capture',
  'film-foundry-execution',
  'public-publish',
  'external-delivery',
  'brain-map-private',
  'collaboration-review',
  'future-marketplace',
] as const;

function envKey(id: StudioFeatureId) {
  return FEATURE_ENV_PREFIX + id.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function parseState(value: unknown): StudioFeatureState | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return ['disabled', 'demo', 'configured', 'ready', 'live', 'paused'].includes(normalized)
    ? (normalized as StudioFeatureState)
    : null;
}

export function resolveStudioFeaturePolicy(
  id: StudioFeatureId,
  env: Record<string, string | undefined> = process.env,
): StudioFeaturePolicy {
  const requested = parseState(env[envKey(id)]);
  const hardOff = HARD_OFF_FEATURES.has(id);

  if (hardOff) {
    return {
      id,
      state: requested === 'paused' ? 'paused' : 'disabled',
      hardOff: true,
      activationAuthorized: false,
      source: requested ? 'server-environment' : 'server-default',
      updatedBy: 'system',
    };
  }

  const state = requested ?? 'disabled';
  return {
    id,
    state,
    hardOff: false,
    activationAuthorized: state === 'live',
    source: requested ? 'server-environment' : 'server-default',
    updatedBy: 'system',
  };
}

export function studioFeaturePolicies(
  env: Record<string, string | undefined> = process.env,
): StudioFeaturePolicy[] {
  return STUDIO_FEATURE_IDS.map((id) => resolveStudioFeaturePolicy(id, env));
}

export function canExecuteStudioFeature(
  id: StudioFeatureId,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const policy = resolveStudioFeaturePolicy(id, env);
  return policy.state === 'live' && policy.activationAuthorized && !policy.hardOff;
}

export function assertStudioFeatureExecution(
  id: StudioFeatureId,
  env: Record<string, string | undefined> = process.env,
) {
  const policy = resolveStudioFeaturePolicy(id, env);
  if (!canExecuteStudioFeature(id, env)) {
    throw new Error(`studio_feature_hard_off:${id}:${policy.state}`);
  }
  return policy;
}

export function validateFeatureTransition(
  current: StudioFeaturePolicy,
  next: StudioFeatureState,
): { allowed: boolean; reason: string } {
  if (current.hardOff && next === 'live') return { allowed: false, reason: 'hard_off_requires_separate_authority' };
  if (current.state === 'paused' && next === 'live') return { allowed: false, reason: 'paused_requires_reauthorization' };
  return { allowed: true, reason: 'source_transition_only' };
}
