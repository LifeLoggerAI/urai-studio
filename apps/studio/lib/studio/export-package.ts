import type {
  StudioAccessibilityPackage,
  StudioApprovalReceipt,
  StudioProvenanceRecord,
  StudioRightsPolicy,
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
  localization: Array<{
    locale: string;
    sourceLanguage: string;
    translationAuthorityRef?: string;
    reviewState: 'not-reviewed' | 'approved' | 'rejected';
  }>;
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
