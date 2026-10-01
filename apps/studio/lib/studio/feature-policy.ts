import { createHash } from 'node:crypto';

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
  | 'future-marketplace'
  | 'life-movies-render'
  | 'synthetic-voice-execution'
  | 'digital-human-performance';

export type StudioFeaturePolicy = {
  id: StudioFeatureId;
  state: StudioFeatureState;
  hardOff: boolean;
  activationAuthorized: boolean;
  source: 'server-default' | 'server-environment';
  updatedBy: 'system';
};

export type StudioFeatureActivationAuthority = {
  source: 'protected-admin-governance';
  featureId: StudioFeatureId;
  requestedState: 'live';
  actorUid: string;
  actorRole: 'owner' | 'admin';
  authorityRef: string;
  issuedAt: string;
  expiresAt: string;
  receiptDigest: string;
};

export type StudioFeatureTransitionReceipt = {
  receiptVersion: 1;
  featureId: StudioFeatureId;
  from: StudioFeatureState;
  to: StudioFeatureState;
  actorRef: string;
  authorityRef: string;
  requestedAt: string;
  allowed: boolean;
  reason: string;
  receiptHash: string;
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
  'life-movies-render',
  'synthetic-voice-execution',
  'digital-human-performance',
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
  'life-movies-render',
  'synthetic-voice-execution',
  'digital-human-performance',
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
    activationAuthorized: false,
    source: requested ? 'server-environment' : 'server-default',
    updatedBy: 'system',
  };
}

export function studioFeaturePolicies(
  env: Record<string, string | undefined> = process.env,
): StudioFeaturePolicy[] {
  return STUDIO_FEATURE_IDS.map((id) => resolveStudioFeaturePolicy(id, env));
}

function isValidActivationAuthority(
  policy: StudioFeaturePolicy,
  authority: StudioFeatureActivationAuthority | undefined,
  now = new Date(),
) {
  if (!authority) return false;
  if (policy.hardOff) return false;
  if (policy.state !== 'live') return false;
  if (authority.source !== 'protected-admin-governance') return false;
  if (authority.featureId !== policy.id || authority.requestedState !== 'live') return false;
  if (!['owner', 'admin'].includes(authority.actorRole)) return false;
  if (!authority.actorUid.trim() || !authority.authorityRef.trim()) return false;
  if (!/^sha256:[a-f0-9]{64}$/.test(authority.receiptDigest)) return false;
  const issuedAt = Date.parse(authority.issuedAt);
  const expiresAt = Date.parse(authority.expiresAt);
  if (Number.isNaN(issuedAt) || Number.isNaN(expiresAt)) return false;
  if (issuedAt > now.getTime() || expiresAt <= now.getTime() || expiresAt <= issuedAt) return false;
  return true;
}

export function authorizeStudioFeaturePolicy(
  policy: StudioFeaturePolicy,
  authority: StudioFeatureActivationAuthority | undefined,
  now = new Date(),
): StudioFeaturePolicy {
  return isValidActivationAuthority(policy, authority, now)
    ? { ...policy, activationAuthorized: true }
    : { ...policy, activationAuthorized: false };
}

export function canExecuteStudioFeature(
  id: StudioFeatureId,
  env: Record<string, string | undefined> = process.env,
  authority?: StudioFeatureActivationAuthority,
  now = new Date(),
): boolean {
  const policy = authorizeStudioFeaturePolicy(resolveStudioFeaturePolicy(id, env), authority, now);
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


function transitionReceiptHash(
  featureId: StudioFeatureId,
  from: StudioFeatureState,
  to: StudioFeatureState,
  actorRef: string,
  authorityRef: string,
  requestedAt: string,
  allowed: boolean,
  reason: string,
) {
  return createHash('sha256')
    .update([featureId, from, to, actorRef, authorityRef, requestedAt, String(allowed), reason].join('\u0000'))
    .digest('hex');
}

export function createFeatureTransitionReceipt(input: {
  current: StudioFeaturePolicy;
  next: StudioFeatureState;
  actorRef: string;
  authorityRef: string;
  requestedAt: string;
}): StudioFeatureTransitionReceipt {
  if (!input.actorRef.trim()) throw new Error('studio_feature_actor_ref_required');
  if (!input.authorityRef.trim()) throw new Error('studio_feature_authority_ref_required');
  if (Number.isNaN(Date.parse(input.requestedAt))) throw new Error('studio_feature_requested_at_invalid');

  const decision = validateFeatureTransition(input.current, input.next);
  return {
    receiptVersion: 1,
    featureId: input.current.id,
    from: input.current.state,
    to: input.next,
    actorRef: input.actorRef,
    authorityRef: input.authorityRef,
    requestedAt: input.requestedAt,
    allowed: decision.allowed,
    reason: decision.reason,
    receiptHash: transitionReceiptHash(
      input.current.id,
      input.current.state,
      input.next,
      input.actorRef,
      input.authorityRef,
      input.requestedAt,
      decision.allowed,
      decision.reason,
    ),
  };
}
