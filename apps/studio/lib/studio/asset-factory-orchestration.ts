export const ASSET_FACTORY_API_CONTRACT_VERSION = 'asset-factory-api-v1' as const;

export type StudioAssetFactoryRequest = {
  contractVersion: typeof ASSET_FACTORY_API_CONTRACT_VERSION;
  studioTenantId: string;
  studioProjectId: string;
  studioVersionId: string;
  studioContentHash: string;
  requestId: string;
  idempotencyKey: string;
  assetSpec: {
    assetType: string;
    format: string;
    promptRef: string;
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
