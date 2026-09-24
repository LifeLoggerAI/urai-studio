import { createHash } from 'node:crypto';

import { canExecuteStudioFeature } from './feature-policy';

export type StudioProviderStatus = 'disabled' | 'configured' | 'ready' | 'running' | 'paused' | 'failed' | 'dead-lettered' | 'canceled';
export type StudioProviderMediaType = 'image' | 'video' | 'audio' | 'voice' | 'music' | '3d' | 'render' | 'translation' | 'transcription';

export const STUDIO_PROVIDER_MEDIA_TYPES = [
  'image',
  'video',
  'audio',
  'voice',
  'music',
  '3d',
  'render',
  'translation',
  'transcription',
] as const satisfies readonly StudioProviderMediaType[];

const studioProviderMediaTypes = new Set<string>(STUDIO_PROVIDER_MEDIA_TYPES);

export type StudioProviderDataPolicy = {
  retention: 'none' | 'bounded' | 'provider-default' | 'unknown';
  trainingUse: 'prohibited' | 'opt-out-confirmed' | 'permitted' | 'unknown';
  privateMemoryAllowed: boolean;
  likenessAllowed: boolean;
  minorsAllowed: boolean;
};

export type StudioProviderRequest = {
  requestId: string;
  idempotencyKey: string;
  tenantId: string;
  userId: string;
  providerId: string;
  toolOrModel: string;
  mediaType: StudioProviderMediaType;
  maxAttempts: number;
  timeoutMs: number;
  estimatedSpendCents: number;
  spendCeilingCents: number;
  sourceRefs: string[];
  dataPolicy: StudioProviderDataPolicy;
  executionControl: {
    paused: boolean;
    killSwitchActive: boolean;
    cancelRequested: boolean;
  };
};

export type StudioProviderArtifactReceipt = {
  providerJobId: string;
  contentHash: string;
  mimeType: string;
  sizeBytes: number;
  sourceRefs: string[];
  providerId: string;
  toolOrModel: string;
  requestId: string;
  humanApprovalState: 'not-reviewed' | 'approved' | 'rejected';
  readyForExternalUse: false;
};

export type StudioProviderExecutionReceipt = {
  ok: boolean;
  status: StudioProviderStatus;
  requestId: string;
  idempotencyKey: string;
  attempts: number;
  spendAuthorized: false;
  providerCalled: boolean;
  deadLettered: boolean;
  cancelRequested: boolean;
  killSwitchActive: boolean;
  artifact?: StudioProviderArtifactReceipt;
  errorCode?: string;
};

export type StudioProviderIdempotencyRecord = {
  tenantId: string;
  idempotencyKey: string;
  requestHash: string;
  requestId: string;
  status: 'reserved' | 'completed' | 'failed' | 'dead-lettered' | 'canceled';
  artifactContentHash?: string;
};

export type StudioProviderIdempotencyDecision = {
  action: 'execute' | 'reuse' | 'conflict';
  requestHash: string;
  reason: string;
};

export type StudioProviderArtifactCandidate = {
  providerJobId: string;
  bytes: Uint8Array;
  mimeType: string;
  sourceRefs: string[];
};

export type StudioProviderArtifactExpectation = {
  allowedMimeTypes: string[];
  maxSizeBytes: number;
  expectedContentHash?: string;
  requiredSourceRefs?: string[];
};

export type StudioProviderArtifactValidation = {
  contentHash: string;
  mimeType: string;
  sizeBytes: number;
  sourceRefs: string[];
};

export type StudioProviderFailureKind =
  | 'timeout'
  | 'network'
  | 'rate-limit'
  | 'provider-5xx'
  | 'provider-4xx'
  | 'artifact-mismatch';

export type StudioProviderAdapter = {
  id: string;
  execute(request: StudioProviderRequest, signal: AbortSignal): Promise<StudioProviderArtifactCandidate>;
  cancel?(providerJobId: string): Promise<void>;
};

function documentSegment(value: string, field: string) {
  if (!value || value.trim() !== value || value.includes('/') || Buffer.byteLength(value, 'utf8') > 256) {
    throw new Error(`invalid_${field}`);
  }
  return value;
}

export function validateProviderRequest(request: StudioProviderRequest) {
  documentSegment(request.requestId, 'request_id');
  documentSegment(request.idempotencyKey, 'idempotency_key');
  documentSegment(request.tenantId, 'tenant_id');
  documentSegment(request.userId, 'user_id');
  documentSegment(request.providerId, 'provider_id');

  if (!studioProviderMediaTypes.has(request.mediaType)) throw new Error('provider_unsupported_media');

  if (!Number.isInteger(request.maxAttempts) || request.maxAttempts < 1 || request.maxAttempts > 3) {
    throw new Error('invalid_max_attempts');
  }
  if (!Number.isInteger(request.timeoutMs) || request.timeoutMs < 500 || request.timeoutMs > 120000) {
    throw new Error('invalid_timeout_ms');
  }
  if (!Number.isInteger(request.estimatedSpendCents) || request.estimatedSpendCents < 0) {
    throw new Error('invalid_estimated_spend');
  }
  if (!Number.isInteger(request.spendCeilingCents) || request.spendCeilingCents < 0) {
    throw new Error('invalid_spend_ceiling');
  }
  if (request.estimatedSpendCents > request.spendCeilingCents) throw new Error('provider_budget_rejected');

  if (
    request.dataPolicy.retention === 'unknown' ||
    request.dataPolicy.trainingUse === 'unknown'
  ) {
    throw new Error('provider_data_policy_unresolved');
  }

  return request;
}

function providerRequestHash(request: StudioProviderRequest) {
  const canonical = JSON.stringify({
    tenantId: request.tenantId,
    userId: request.userId,
    providerId: request.providerId,
    toolOrModel: request.toolOrModel,
    mediaType: request.mediaType,
    maxAttempts: request.maxAttempts,
    timeoutMs: request.timeoutMs,
    estimatedSpendCents: request.estimatedSpendCents,
    spendCeilingCents: request.spendCeilingCents,
    sourceRefs: [...request.sourceRefs].sort(),
    dataPolicy: request.dataPolicy,
  });
  return createHash('sha256').update(canonical).digest('hex');
}

export function decideProviderIdempotency(
  request: StudioProviderRequest,
  existing?: StudioProviderIdempotencyRecord,
): StudioProviderIdempotencyDecision {
  validateProviderRequest(request);
  const requestHash = providerRequestHash(request);
  if (!existing) return { action: 'execute', requestHash, reason: 'idempotency_slot_available' };
  if (existing.tenantId !== request.tenantId || existing.idempotencyKey !== request.idempotencyKey) {
    return { action: 'conflict', requestHash, reason: 'idempotency_scope_mismatch' };
  }
  if (existing.requestHash !== requestHash) {
    return { action: 'conflict', requestHash, reason: 'idempotency_key_reused_for_different_request' };
  }
  return { action: 'reuse', requestHash, reason: 'duplicate_request_reuses_existing_receipt' };
}

export function providerAdapterConfigurationState(
  request: StudioProviderRequest,
  adapter?: StudioProviderAdapter,
): 'configured' | 'not-configured' | 'mismatch' {
  if (!adapter) return 'not-configured';
  return adapter.id === request.providerId ? 'configured' : 'mismatch';
}

export function validateProviderArtifactCandidate(
  request: StudioProviderRequest,
  candidate: StudioProviderArtifactCandidate,
  expectation: StudioProviderArtifactExpectation,
): StudioProviderArtifactValidation {
  validateProviderRequest(request);
  documentSegment(candidate.providerJobId, 'provider_job_id');
  if (!(candidate.bytes instanceof Uint8Array) || candidate.bytes.byteLength === 0) {
    throw new Error('provider_artifact_empty');
  }
  if (!Number.isInteger(expectation.maxSizeBytes) || expectation.maxSizeBytes < 1) {
    throw new Error('provider_artifact_max_size_invalid');
  }
  if (candidate.bytes.byteLength > expectation.maxSizeBytes) throw new Error('provider_artifact_too_large');
  if (!expectation.allowedMimeTypes.includes(candidate.mimeType)) throw new Error('provider_artifact_mime_mismatch');
  if (!Array.isArray(candidate.sourceRefs) || candidate.sourceRefs.some((ref) => typeof ref !== 'string' || !ref.trim())) {
    throw new Error('provider_artifact_source_refs_invalid');
  }
  const requiredSourceRefs = expectation.requiredSourceRefs ?? request.sourceRefs;
  const candidateRefs = new Set(candidate.sourceRefs);
  if (requiredSourceRefs.some((ref) => !candidateRefs.has(ref))) throw new Error('provider_artifact_source_mismatch');
  const contentHash = createHash('sha256').update(candidate.bytes).digest('hex');
  if (expectation.expectedContentHash !== undefined) {
    if (!/^[a-f0-9]{64}$/.test(expectation.expectedContentHash)) throw new Error('provider_expected_hash_invalid');
    if (expectation.expectedContentHash !== contentHash) throw new Error('provider_artifact_hash_mismatch');
  }
  return { contentHash, mimeType: candidate.mimeType, sizeBytes: candidate.bytes.byteLength, sourceRefs: [...candidate.sourceRefs] };
}

export function providerFailureIsRetryable(kind: StudioProviderFailureKind) {
  return kind === 'timeout' || kind === 'network' || kind === 'rate-limit' || kind === 'provider-5xx';
}

export function decideProviderFailure(input: {
  request: StudioProviderRequest;
  completedAttempts: number;
  kind: StudioProviderFailureKind;
}): StudioProviderAttemptDecision {
  return decideProviderAttempt({
    request: input.request,
    completedAttempts: input.completedAttempts,
    retryableFailure: providerFailureIsRetryable(input.kind),
  });
}

export function createBlockedProviderReceipt(
  request: StudioProviderRequest,
  errorCode = 'provider_execution_hard_off',
): StudioProviderExecutionReceipt {
  validateProviderRequest(request);
  return {
    ok: false,
    status: 'disabled',
    requestId: request.requestId,
    idempotencyKey: request.idempotencyKey,
    attempts: 0,
    spendAuthorized: false,
    providerCalled: false,
    deadLettered: false,
    cancelRequested: request.executionControl.cancelRequested,
    killSwitchActive: request.executionControl.killSwitchActive,
    errorCode,
  };
}

export async function executeStudioProvider(
  request: StudioProviderRequest,
  adapter?: StudioProviderAdapter,
  env: Record<string, string | undefined> = process.env,
): Promise<StudioProviderExecutionReceipt> {
  validateProviderRequest(request);

  if (request.executionControl.killSwitchActive) {
    return createBlockedProviderReceipt(request, 'provider_kill_switch_active');
  }
  if (request.executionControl.paused) {
    return createBlockedProviderReceipt(request, 'provider_execution_paused');
  }
  if (request.executionControl.cancelRequested) {
    return {
      ok: false,
      status: 'canceled',
      requestId: request.requestId,
      idempotencyKey: request.idempotencyKey,
      attempts: 0,
      spendAuthorized: false,
      providerCalled: false,
      deadLettered: false,
      cancelRequested: true,
      killSwitchActive: false,
      errorCode: 'provider_cancel_requested',
    };
  }

  // Source architecture never authorizes paid/network provider execution.
  if (!canExecuteStudioFeature('provider-execution', env)) {
    return createBlockedProviderReceipt(request);
  }

  if (!adapter || adapter.id !== request.providerId) {
    return createBlockedProviderReceipt(request, 'provider_not_configured');
  }

  // This path remains unreachable while provider-execution is a hard-off feature.
  // It exists to make the future adapter boundary testable without choosing a provider.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), request.timeoutMs);
  try {
    const result = await adapter.execute(request, controller.signal);
    const contentHash = createHash('sha256').update(result.bytes).digest('hex');
    return {
      ok: true,
      status: 'running',
      requestId: request.requestId,
      idempotencyKey: request.idempotencyKey,
      attempts: 1,
      spendAuthorized: false,
      providerCalled: true,
      deadLettered: false,
      cancelRequested: request.executionControl.cancelRequested,
      killSwitchActive: request.executionControl.killSwitchActive,
      artifact: {
        providerJobId: result.providerJobId,
        contentHash,
        mimeType: result.mimeType,
        sizeBytes: result.bytes.byteLength,
        sourceRefs: result.sourceRefs,
        providerId: request.providerId,
        toolOrModel: request.toolOrModel,
        requestId: request.requestId,
        humanApprovalState: 'not-reviewed',
        readyForExternalUse: false,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}


export type StudioProviderAttemptDecision = {
  status: 'retry' | 'dead-letter' | 'cancel' | 'blocked';
  nextAttempt: number;
  deadLettered: boolean;
  reason: string;
};

export function decideProviderAttempt(input: {
  request: StudioProviderRequest;
  completedAttempts: number;
  retryableFailure: boolean;
}): StudioProviderAttemptDecision {
  const { request, completedAttempts, retryableFailure } = input;
  if (request.executionControl.killSwitchActive) {
    return { status: 'blocked', nextAttempt: completedAttempts, deadLettered: false, reason: 'provider_kill_switch_active' };
  }
  if (request.executionControl.cancelRequested) {
    return { status: 'cancel', nextAttempt: completedAttempts, deadLettered: false, reason: 'provider_cancel_requested' };
  }
  if (request.executionControl.paused) {
    return { status: 'blocked', nextAttempt: completedAttempts, deadLettered: false, reason: 'provider_execution_paused' };
  }
  if (!retryableFailure) {
    return { status: 'dead-letter', nextAttempt: completedAttempts, deadLettered: true, reason: 'provider_non_retryable_failure' };
  }
  if (completedAttempts >= request.maxAttempts) {
    return { status: 'dead-letter', nextAttempt: completedAttempts, deadLettered: true, reason: 'provider_retry_budget_exhausted' };
  }
  return { status: 'retry', nextAttempt: completedAttempts + 1, deadLettered: false, reason: 'provider_retry_authorized_by_contract' };
}

export function createDeadLetterReceipt(
  request: StudioProviderRequest,
  attempts: number,
  errorCode: string,
): StudioProviderExecutionReceipt {
  return {
    ok: false,
    status: 'dead-lettered',
    requestId: request.requestId,
    idempotencyKey: request.idempotencyKey,
    attempts,
    spendAuthorized: false,
    providerCalled: attempts > 0,
    deadLettered: true,
    cancelRequested: request.executionControl.cancelRequested,
    killSwitchActive: request.executionControl.killSwitchActive,
    errorCode,
  };
}
