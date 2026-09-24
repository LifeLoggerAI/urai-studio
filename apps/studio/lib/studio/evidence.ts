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

export type StudioVersionComparisonMetadata = {
  schemaVersion: 3;
  tenantId: string;
  projectId: string;
  baseVersionId: string;
  candidateVersionId: string;
  baseContentHash: string;
  candidateContentHash: string;
  comparisonDimensions: string[];
  createdAt: string;
};

export type StudioReviewQueueEntry = {
  schemaVersion: 3;
  tenantId: string;
  projectId: string;
  versionId: string;
  contentHash: string;
  requestedByUid: string;
  assignedReviewerUid?: string;
  state: 'queued' | 'in-review' | 'changes-requested' | 'approved' | 'rejected' | 'superseded';
  requestedAt: string;
};

export type StudioVersionLifecycleAction = 'supersede' | 'rollback' | 'promote' | 'final-accept';

export type StudioVersionLifecycleReceipt = {
  receiptVersion: 1;
  action: StudioVersionLifecycleAction;
  tenantId: string;
  projectId: string;
  targetVersionId: string;
  targetContentHash: string;
  actorUid: string;
  actorRole: StudioReviewRole;
  approvalReceiptHash?: string;
  createdAt: string;
  immutableReceiptHash: string;
};

export type StudioVersionAcceptanceDecision = {
  accepted: boolean;
  blockers: string[];
};

const APPROVER_ROLES = new Set<StudioReviewRole>(['owner', 'admin', 'reviewer']);
const EDITOR_ROLES = new Set<StudioReviewRole>(['owner', 'admin', 'editor']);

export function canApproveStudioVersion(role: StudioReviewRole) {
  return APPROVER_ROLES.has(role);
}

export function canEditStudioVersion(role: StudioReviewRole) {
  return EDITOR_ROLES.has(role);
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

export function createVersionComparisonMetadata(
  base: StudioVersionRecord,
  candidate: StudioVersionRecord,
  comparisonDimensions: string[],
  createdAt: string,
): StudioVersionComparisonMetadata {
  if (base.tenantId !== candidate.tenantId || base.projectId !== candidate.projectId) {
    throw new Error('studio_version_comparison_scope_mismatch');
  }
  if (base.id === candidate.id) throw new Error('studio_version_comparison_requires_distinct_versions');
  if (comparisonDimensions.length === 0 || comparisonDimensions.some((value) => !value.trim())) {
    throw new Error('studio_version_comparison_dimensions_required');
  }
  if (Number.isNaN(Date.parse(createdAt))) throw new Error('studio_version_comparison_timestamp_invalid');
  return {
    schemaVersion: 3,
    tenantId: candidate.tenantId,
    projectId: candidate.projectId,
    baseVersionId: base.id,
    candidateVersionId: candidate.id,
    baseContentHash: base.contentHash,
    candidateContentHash: candidate.contentHash,
    comparisonDimensions: [...comparisonDimensions],
    createdAt,
  };
}

export function createReviewQueueEntry(input: Omit<StudioReviewQueueEntry, 'schemaVersion' | 'state'>): StudioReviewQueueEntry {
  if (!/^[a-f0-9]{64}$/.test(input.contentHash)) throw new Error('invalid_content_hash');
  if (Number.isNaN(Date.parse(input.requestedAt))) throw new Error('studio_review_requested_at_invalid');
  return { schemaVersion: 3, ...input, state: 'queued' };
}

export function createVersionLifecycleReceipt(input: {
  action: StudioVersionLifecycleAction;
  version: StudioVersionRecord;
  actorUid: string;
  actorRole: StudioReviewRole;
  createdAt: string;
  approval?: StudioApprovalReceipt;
}): StudioVersionLifecycleReceipt {
  if (!input.actorUid.trim()) throw new Error('studio_lifecycle_actor_required');
  if (Number.isNaN(Date.parse(input.createdAt))) throw new Error('studio_lifecycle_timestamp_invalid');
  if (input.action === 'supersede' && !canEditStudioVersion(input.actorRole)) {
    throw new Error('studio_lifecycle_edit_role_required');
  }
  if (input.action === 'rollback' && !['owner', 'admin'].includes(input.actorRole)) {
    throw new Error('studio_lifecycle_admin_role_required');
  }
  if (input.action === 'promote' || input.action === 'final-accept') {
    if (!input.approval || !approvalMatchesVersion(input.approval, input.version)) {
      throw new Error('studio_lifecycle_exact_approval_required');
    }
    if (!canApproveStudioVersion(input.actorRole)) throw new Error('studio_lifecycle_approval_role_required');
  }
  const approvalReceiptHash = input.approval?.immutableReceiptHash;
  const canonical = [
    input.action,
    input.version.tenantId,
    input.version.projectId,
    input.version.id,
    input.version.contentHash,
    input.actorUid,
    input.actorRole,
    approvalReceiptHash ?? '',
    input.createdAt,
  ].join('\u0000');
  return {
    receiptVersion: 1,
    action: input.action,
    tenantId: input.version.tenantId,
    projectId: input.version.projectId,
    targetVersionId: input.version.id,
    targetContentHash: input.version.contentHash,
    actorUid: input.actorUid,
    actorRole: input.actorRole,
    approvalReceiptHash,
    createdAt: input.createdAt,
    immutableReceiptHash: createHash('sha256').update(canonical).digest('hex'),
  };
}

export function evaluateVersionAcceptance(input: {
  version: StudioVersionRecord;
  review: StudioReviewRecord;
  approval: StudioApprovalReceipt;
  rights: StudioRightsPolicy;
  accessibility: StudioAccessibilityPackage;
  supersededBy?: string;
}): StudioVersionAcceptanceDecision {
  const blockers: string[] = [];
  if (input.supersededBy) blockers.push('version_superseded');
  if (input.review.tenantId !== input.version.tenantId || input.review.versionId !== input.version.id || input.review.contentHash !== input.version.contentHash) {
    blockers.push('review_not_bound_to_exact_version');
  }
  if (input.review.state !== 'approved') blockers.push('review_not_approved');
  if (!approvalMatchesVersion(input.approval, input.version)) blockers.push('approval_not_bound_to_exact_version');
  if (!rightsReadyForRelease(input.rights)) blockers.push('rights_incomplete');
  if (!accessibilityReadyForRelease(input.accessibility)) blockers.push('accessibility_incomplete');
  return { accepted: blockers.length === 0, blockers };
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
