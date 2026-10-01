export const ASSET_FACTORY_API_CONTRACT_VERSION = 'asset-factory-api-v1' as const;

export const ASSET_FACTORY_CANONICAL_ROUTES = {
  health: 'GET /api/system/health',
  createAsset: 'POST /api/assets',
  readAsset: 'GET /api/assets/:assetId',
  generate: 'POST /api/generate',
  materialize: 'POST /api/jobs/:jobId/materialize',
  publish: 'POST /api/jobs/:jobId/publish',
  approve: 'POST /api/jobs/:jobId/approve',
} as const;

export const ASSET_FACTORY_CANONICAL_HEADERS = {
  authorization: 'Authorization',
  apiKey: 'x-asset-factory-api-key',
  idempotency: 'Idempotency-Key',
  requestId: 'x-request-id',
} as const;

export type AssetFactoryCanonicalAssetType = 'graphic' | 'model3d' | 'audio' | 'bundle';

export type StudioAssetFactoryRequest = {
  contractVersion: typeof ASSET_FACTORY_API_CONTRACT_VERSION;
  studioTenantId: string;
  studioProjectId: string;
  studioVersionId: string;
  studioContentHash: string;
  requestId: string;
  idempotencyKey: string;
  assetSpec: {
    assetType: AssetFactoryCanonicalAssetType;
    format: string;
    promptRef: string;
    prompt?: string;
    tags: string[];
    dimensions?: { width: number; height: number };
  };
  providerExecutionAuthorized: false;
  promotionAuthorized: false;
};

export type StudioAssetFactoryReceipt = {
  contractVersion: typeof ASSET_FACTORY_API_CONTRACT_VERSION;
  requestId: string;
  assetFactoryAssetId: string;
  assetFactoryQueueId?: string;
  lifecycleState: 'requested' | 'queued' | 'processing' | 'rendered' | 'stored' | 'published' | 'failed' | 'archived';
  providerJobRef?: string;
  generationResultRef?: string;
  provenanceReceiptRef?: string;
  contentHash?: string;
  validationState: 'not-validated' | 'valid' | 'invalid';
  reviewState: 'not-reviewed' | 'approved' | 'rejected';
  promotionState: 'review-required' | 'promoted' | 'rejected';
  costState: 'unavailable' | 'estimated' | 'receipted';
};

export function createStudioAssetFactoryRequest(
  input: Omit<StudioAssetFactoryRequest, 'contractVersion' | 'providerExecutionAuthorized' | 'promotionAuthorized'>,
): StudioAssetFactoryRequest {
  return {
    contractVersion: ASSET_FACTORY_API_CONTRACT_VERSION,
    ...input,
    providerExecutionAuthorized: false,
    promotionAuthorized: false,
  };
}

export function canStudioTreatAssetAsPromoted(receipt: StudioAssetFactoryReceipt) {
  return (
    receipt.validationState === 'valid' &&
    receipt.reviewState === 'approved' &&
    receipt.promotionState === 'promoted' &&
    typeof receipt.provenanceReceiptRef === 'string' &&
    receipt.provenanceReceiptRef.length > 0 &&
    typeof receipt.contentHash === 'string' &&
    /^[a-f0-9]{64}$/.test(receipt.contentHash)
  );
}


export type AssetFactoryCreateAssetBody = {
  projectId: string;
  assetType: AssetFactoryCanonicalAssetType;
  format: string;
  prompt?: string;
  tags: string[];
  dimensions?: { width: number; height: number };
  source: 'urai-studio';
};

export type AssetFactoryCreateAssetEnvelope = {
  method: 'POST';
  path: '/api/assets';
  headers: {
    'Idempotency-Key': string;
    'x-request-id': string;
  };
  body: AssetFactoryCreateAssetBody;
  tenantIdentitySource: 'verified-auth-claim';
  providerExecutionAuthorized: false;
  promotionAuthorized: false;
};

export function toAssetFactoryCreateAssetEnvelope(
  request: StudioAssetFactoryRequest,
): AssetFactoryCreateAssetEnvelope {
  if (request.contractVersion !== ASSET_FACTORY_API_CONTRACT_VERSION) {
    throw new Error('asset_factory_contract_version_mismatch');
  }
  if (!request.requestId.trim() || !request.idempotencyKey.trim()) {
    throw new Error('asset_factory_request_identity_required');
  }
  if (!request.studioProjectId.trim()) throw new Error('asset_factory_project_required');
  if (!request.assetSpec.format.trim()) throw new Error('asset_factory_format_required');
  if (!request.assetSpec.promptRef.trim()) throw new Error('asset_factory_prompt_authority_required');

  return {
    method: 'POST',
    path: '/api/assets',
    headers: {
      'Idempotency-Key': request.idempotencyKey,
      'x-request-id': request.requestId,
    },
    body: {
      projectId: request.studioProjectId,
      assetType: request.assetSpec.assetType,
      format: request.assetSpec.format,
      ...(request.assetSpec.prompt ? { prompt: request.assetSpec.prompt } : {}),
      tags: request.assetSpec.tags,
      ...(request.assetSpec.dimensions ? { dimensions: request.assetSpec.dimensions } : {}),
      source: 'urai-studio',
    },
    tenantIdentitySource: 'verified-auth-claim',
    providerExecutionAuthorized: false,
    promotionAuthorized: false,
  };
}

export function assertAssetFactoryEnvelopeDoesNotSelfAssertTenant(
  envelope: AssetFactoryCreateAssetEnvelope,
) {
  if ('tenantId' in envelope.body || 'userId' in envelope.body || 'anonymousSessionId' in envelope.body) {
    throw new Error('asset_factory_identity_must_come_from_verified_auth');
  }
  return envelope;
}
