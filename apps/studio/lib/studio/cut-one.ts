export type CutOneStage =
  | 'narrative'
  | 'script'
  | 'scene'
  | 'asset'
  | 'approval'
  | 'export'
  | 'staging'
  | 'release';

export type CutOneRecord = {
  schemaVersion: 1;
  id: string;
  stage: CutOneStage;
  sourceAuthorityRefs: string[];
  sceneId?: string;
  assetRefs: string[];
  approvalRefs: string[];
  exportRefs: string[];
  stagingEvidenceRefs: string[];
  releaseEvidenceRefs: string[];
  productProofRef?: string;
  state: 'blocked' | 'draft' | 'review' | 'approved';
  providerExecutionAuthorized: false;
  publicReleaseAuthorized: false;
};

export function createCutOneRecord(
  input: Omit<CutOneRecord, 'schemaVersion' | 'providerExecutionAuthorized' | 'publicReleaseAuthorized'>,
): CutOneRecord {
  if (input.sourceAuthorityRefs.length === 0) throw new Error('cut_one_source_authority_required');
  return {
    schemaVersion: 1,
    ...input,
    providerExecutionAuthorized: false,
    publicReleaseAuthorized: false,
  };
}
