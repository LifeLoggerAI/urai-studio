import {
  accessibilityReadyForRelease,
  rightsReadyForRelease,
  type StudioAccessibilityPackage,
  type StudioApprovalReceipt,
  type StudioProvenanceRecord,
  type StudioRightsPolicy,
} from './evidence';

export type StudioExportArtifact = {
  id: string;
  contentHash: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationMs?: number;
  storagePath: string;
};

export type StudioReleaseState =
  | 'draft'
  | 'review'
  | 'approved-private'
  | 'approved-public'
  | 'revoked'
  | 'deleted';

export type StudioLocalizationVariant = {
  locale: string;
  sourceLanguage: string;
  translationAuthorityRef?: string;
  reviewState: 'not-reviewed' | 'approved' | 'rejected';
  accessibilityQaState?: 'not-reviewed' | 'approved' | 'rejected';
  rtlQaState?: 'not-required' | 'passed' | 'failed';
  textExpansionQaState?: 'not-required' | 'passed' | 'failed';
};

export type StudioExportPackage = {
  schemaVersion: 3;
  tenantId: string;
  projectId: string;
  exportId: string;
  versionId: string;
  artifacts: StudioExportArtifact[];
  provenance: StudioProvenanceRecord[];
  rights: StudioRightsPolicy;
  accessibility: StudioAccessibilityPackage;
  localizationAuthorityRef: string;
  localization: StudioLocalizationVariant[];
  approvals: StudioApprovalReceipt[];
  releaseState: StudioReleaseState;
  publicReleaseAuthorized: false;
  delivery: {
    enabled: false;
    expiresAt?: string;
    revokedAt?: string;
  };
  retention: {
    policyId: string;
    deletionRequestedAt?: string;
    deletedAt?: string;
  };
  auditRefs: string[];
};

export type StudioExportPreflightContext = {
  requesterTenantId: string;
  versionContentHash: string;
  now: string;
};

export type StudioExportPreflightResult = {
  sourceReady: boolean;
  deliverable: false;
  blockers: string[];
  activationBlockers: ['public_release_not_authorized', 'external_delivery_hard_off'];
};

export function evaluateExportPackagePreflight(
  pkg: StudioExportPackage,
  context: StudioExportPreflightContext,
): StudioExportPreflightResult {
  const blockers: string[] = [];
  if (pkg.tenantId !== context.requesterTenantId) blockers.push('tenant_not_authorized');
  if (!/^[a-f0-9]{64}$/.test(context.versionContentHash)) blockers.push('version_content_hash_invalid');
  if (Number.isNaN(Date.parse(context.now))) blockers.push('preflight_time_invalid');
  if (pkg.releaseState === 'revoked') blockers.push('export_revoked');
  if (pkg.releaseState === 'deleted') blockers.push('export_deleted');
  if (!['approved-private', 'approved-public'].includes(pkg.releaseState)) blockers.push('release_approval_required');
  if (pkg.retention.deletionRequestedAt) blockers.push('deletion_requested');
  if (pkg.retention.deletedAt) blockers.push('retention_deleted');
  if (pkg.delivery.revokedAt) blockers.push('delivery_revoked');
  if (pkg.delivery.expiresAt && !Number.isNaN(Date.parse(context.now)) && Date.parse(pkg.delivery.expiresAt) <= Date.parse(context.now)) {
    blockers.push('delivery_expired');
  }
  try {
    validateExportArtifacts(pkg.artifacts);
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : 'export_artifact_invalid');
  }
  if (!rightsReadyForRelease(pkg.rights)) blockers.push('rights_incomplete');
  if (!accessibilityReadyForRelease(pkg.accessibility)) blockers.push('accessibility_incomplete');
  if (pkg.localization.length === 0) blockers.push('localization_variant_required');
  for (const variant of pkg.localization) {
    const locale = variant.locale || 'unknown';
    if (!variant.locale.trim() || !variant.sourceLanguage.trim()) blockers.push(`localization_identity_invalid:${locale}`);
    if (variant.reviewState !== 'approved') blockers.push(`localization_review_required:${locale}`);
    if (variant.accessibilityQaState !== 'approved') blockers.push(`localization_accessibility_qa_required:${locale}`);
    if (variant.rtlQaState === 'failed') blockers.push(`localization_rtl_qa_failed:${locale}`);
    if (variant.textExpansionQaState === 'failed') blockers.push(`localization_text_expansion_qa_failed:${locale}`);
  }
  const exactApproval = pkg.approvals.some((approval) =>
    approval.tenantId === pkg.tenantId
    && approval.versionId === pkg.versionId
    && approval.contentHash === context.versionContentHash
    && approval.state === 'approved',
  );
  if (!exactApproval) blockers.push('exact_version_approval_required');
  return {
    sourceReady: blockers.length === 0,
    deliverable: false,
    blockers,
    activationBlockers: ['public_release_not_authorized', 'external_delivery_hard_off'],
  };
}

export function createHardOffExportPackage(
  input: Omit<StudioExportPackage, 'schemaVersion' | 'publicReleaseAuthorized' | 'delivery' | 'releaseState'>,
): StudioExportPackage {
  return {
    schemaVersion: 3,
    ...input,
    releaseState: 'draft',
    publicReleaseAuthorized: false,
    delivery: { enabled: false },
  };
}

export function exportPackageCanDeliver(_pkg: StudioExportPackage): false {
  // Public delivery is deliberately hard-off in the pre-launch source contract.
  return false;
}

export function validateExportArtifacts(artifacts: StudioExportArtifact[]) {
  if (artifacts.length === 0) throw new Error('export_artifacts_required');
  for (const artifact of artifacts) {
    if (!/^[a-f0-9]{64}$/.test(artifact.contentHash)) throw new Error('invalid_export_content_hash');
    if (!artifact.mimeType.includes('/')) throw new Error('invalid_export_mime_type');
    if (!Number.isInteger(artifact.sizeBytes) || artifact.sizeBytes < 0) throw new Error('invalid_export_size');
    if (!artifact.storagePath || artifact.storagePath.includes('..')) throw new Error('invalid_export_storage_path');
  }
  return artifacts;
}
