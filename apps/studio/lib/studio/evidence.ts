import { createHash } from 'node:crypto';

export type StudioReviewRole = 'owner' | 'admin' | 'editor' | 'reviewer' | 'viewer';
export type StudioReviewState = 'draft' | 'in-review' | 'changes-requested' | 'approved' | 'rejected' | 'superseded';
export type StudioRightsState = 'unknown' | 'not-applicable' | 'granted' | 'restricted' | 'denied';

export type StudioRightsPolicy = {
  ownership: StudioRightsState;
  license: StudioRightsState;
  thirdPartyCopyright: StudioRightsState;
  trademarkArchive: StudioRightsState;
  humanLikeness: StudioRightsState;
  voiceLikeness: StudioRightsState;
  familyAdvisorLikeness: StudioRightsState;
  minors: StudioRightsState;
  providerTrainingPermission: StudioRightsState;
  providerRetention: StudioRightsState;
  derivativeRights: StudioRightsState;
  publicationAuthority: StudioRightsState;
  privateMemoryUse: StudioRightsState;
  geographicUse?: string[];
};

export type StudioAccessibilityPackage = {
  captions: 'not-required' | 'required' | 'present';
  srt: 'not-required' | 'required' | 'present';
  transcript: 'not-required' | 'required' | 'present';
  audioDescription: 'not-required' | 'required' | 'present';
  textlessMaster: 'not-required' | 'required' | 'present';
  soundOff: 'not-required' | 'required' | 'present';
  reducedMotion: 'not-required' | 'required' | 'present';
  sensorySafe: 'not-required' | 'required' | 'present';
  haptics: 'not-required' | 'required' | 'present';
  altDescription: 'not-required' | 'required' | 'present';
  sourceLanguage: string;
  locale: string;
  translationAuthorityRef?: string;
  reviewState: 'not-reviewed' | 'approved' | 'rejected';
};

export type StudioVersionRecord = {
  id: string;
  schemaVersion: 3;
  tenantId: string;
  projectId: string;
  subjectId: string;
  sourceVersionId?: string;
  contentHash: string;
  sourceRefs: string[];
  derivativeOf: string[];
  createdBy: string;
  createdAt: string;
};

export type StudioReviewRecord = {
  id: string;
  schemaVersion: 3;
  tenantId: string;
  versionId: string;
  contentHash: string;
  state: StudioReviewState;
  reviewerUid: string;
  reviewerRole: StudioReviewRole;
  note?: string;
  rejectionReason?: string;
  requestedChanges?: string[];
  createdAt: string;
};

export type StudioApprovalReceipt = {
  receiptVersion: 1;
  tenantId: string;
  versionId: string;
  contentHash: string;
  reviewerUid: string;
  reviewerRole: 'owner' | 'admin' | 'reviewer';
  state: 'approved';
  createdAt: string;
  immutableReceiptHash: string;
};

export type StudioProvenanceRecord = {
  schemaVersion: 3;
  tenantId: string;
  projectId: string;
  assetId: string;
  versionId: string;
  sourceAuthorityRefs: string[];
  providerOrTool?: string;
  toolOrModelVersion?: string;
  promptOrParameterRef?: string;
  humanEditRefs: string[];
  rights: StudioRightsPolicy;
  consentRefs: string[];
  contentHash: string;
  reviewRefs: string[];
  approvalReceiptRefs: string[];
  derivativeOf: string[];
  releaseRefs: string[];
  classification: 'private' | 'internal' | 'public-candidate' | 'public-approved';
};

const APPROVER_ROLES = new Set<StudioReviewRole>(['owner', 'admin', 'reviewer']);

export function canApproveStudioVersion(role: StudioReviewRole) {
  return APPROVER_ROLES.has(role);
}

export function contentHash(bytes: Uint8Array) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function createApprovalReceipt(input: Omit<StudioApprovalReceipt, 'receiptVersion' | 'state' | 'immutableReceiptHash'>): StudioApprovalReceipt {
  if (!canApproveStudioVersion(input.reviewerRole)) throw new Error('studio_review_role_cannot_approve');
  if (!/^[a-f0-9]{64}$/.test(input.contentHash)) throw new Error('invalid_content_hash');

  const canonical = [
    input.tenantId,
    input.versionId,
    input.contentHash,
    input.reviewerUid,
    input.reviewerRole,
    input.createdAt,
  ].join('\u0000');

  return {
    receiptVersion: 1,
    ...input,
    state: 'approved',
    immutableReceiptHash: createHash('sha256').update(canonical).digest('hex'),
  };
}

export function approvalMatchesVersion(receipt: StudioApprovalReceipt, version: StudioVersionRecord) {
  return (
    receipt.tenantId === version.tenantId &&
    receipt.versionId === version.id &&
    receipt.contentHash === version.contentHash
  );
}

export function rightsReadyForRelease(rights: StudioRightsPolicy) {
  const required = Object.entries(rights)
    .filter(([key]) => key !== 'geographicUse')
    .map(([, value]) => value as StudioRightsState);
  return required.every((state) => state === 'granted' || state === 'not-applicable');
}

export function accessibilityReadyForRelease(pkg: StudioAccessibilityPackage) {
  const variantStates = [
    pkg.captions,
    pkg.srt,
    pkg.transcript,
    pkg.audioDescription,
    pkg.textlessMaster,
    pkg.soundOff,
    pkg.reducedMotion,
    pkg.sensorySafe,
    pkg.haptics,
    pkg.altDescription,
  ];
  return variantStates.every((state) => state === 'present' || state === 'not-required') && pkg.reviewState === 'approved';
}
