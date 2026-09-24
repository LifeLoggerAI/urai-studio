import { createHash } from 'node:crypto';

import { canExecuteStudioFeature } from './feature-policy';

export type StudioProviderStatus = 'disabled' | 'configured' | 'ready' | 'running' | 'paused' | 'failed';
export type StudioProviderMediaType = 'image' | 'video' | 'audio' | 'voice' | 'music' | '3d' | 'render' | 'translation' | 'transcription';

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
  artifact?: StudioProviderArtifactReceipt;
  errorCode?: string;
};

export type StudioProviderAdapter = {
  id: string;
  execute(request: StudioProviderRequest, signal: AbortSignal): Promise<{
    providerJobId: string;
    bytes: Uint8Array;
    mimeType: string;
    sourceRefs: string[];
  }>;
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
    errorCode,
  };
}

export async function executeStudioProvider(
  request: StudioProviderRequest,
  adapter?: StudioProviderAdapter,
  env: Record<string, string | undefined> = process.env,
): Promise<StudioProviderExecutionReceipt> {
  validateProviderRequest(request);

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
