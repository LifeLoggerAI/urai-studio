export const STUDIO_DATA_MODEL_VERSION = 3 as const;

export const STUDIO_CANONICAL_COLLECTIONS = {
  studios: 'studios',
  projects: 'studioProjects',
  briefs: 'studioBriefs',
  jobs: 'studioJobs',
  assets: 'studioAssets',
  exports: 'studioExports',
  reviews: 'studioReviews',
  versions: 'studioVersions',
  evidence: 'studioEvidence',
  featurePolicies: 'studioFeaturePolicies',
  operationRequests: 'studioOperationRequests',
  auditLogs: 'auditLogs',
} as const;

export const STUDIO_LEGACY_ONLY_COLLECTIONS = [
  'studioScenes',
  'assetJobs',
  'assetCollections',
  'studioScrolls',
  'narratorScripts',
  'subtitles',
  'voiceoverJobs',
  'exportJobs',
  'studioEvents',
  'xrSessions',
  'vrSessions',
] as const;

export const STUDIO_DUAL_SHAPE_COLLECTIONS = ['studioProjects', 'studioAssets'] as const;

export type StudioDataModelVersion = typeof STUDIO_DATA_MODEL_VERSION;
export type StudioCanonicalCollection = (typeof STUDIO_CANONICAL_COLLECTIONS)[keyof typeof STUDIO_CANONICAL_COLLECTIONS];
export type StudioLegacyCollection = (typeof STUDIO_LEGACY_ONLY_COLLECTIONS)[number] | (typeof STUDIO_DUAL_SHAPE_COLLECTIONS)[number];

export type CanonicalStudioRecordAuthority = {
  schemaVersion: StudioDataModelVersion;
  tenantId: string;
  userId: string;
};

export const STUDIO_WRITER_AUTHORITY = {
  canonicalRecords: 'trusted-server-only',
  membershipRecords: 'trusted-server-only',
  legacyRecords: 'frozen-no-new-writes',
  publicIntake: 'trusted-server-route-only',
} as const;

export const STUDIO_MIGRATION_POLICY = {
  destructiveMigrationAllowed: false,
  liveMigrationAuthorizedBySource: false,
  legacyWritesAllowed: false,
  compatibilityReadOnly: true,
  rollbackRequired: true,
  migrationRequiresExactHeadReview: true,
} as const;

function nonEmptyDocumentId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.trim() === value &&
    value !== '.' &&
    value !== '..' &&
    !value.includes('/') &&
    Buffer.byteLength(value, 'utf8') <= 256
  );
}

export function isCanonicalStudioRecord(value: unknown): value is CanonicalStudioRecordAuthority {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    record.schemaVersion === STUDIO_DATA_MODEL_VERSION &&
    nonEmptyDocumentId(record.tenantId) &&
    nonEmptyDocumentId(record.userId)
  );
}

export function requireCanonicalStudioRecord(value: unknown): CanonicalStudioRecordAuthority {
  if (!isCanonicalStudioRecord(value)) {
    throw new Error('studio_record_not_canonical_v3');
  }
  return value;
}

export function isLegacyStudioRecord(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.schemaVersion !== STUDIO_DATA_MODEL_VERSION && typeof record.uid === 'string';
}

export function canonicalMembershipPath(studioId: string, uid: string) {
  if (!nonEmptyDocumentId(studioId) || !nonEmptyDocumentId(uid)) {
    throw new Error('invalid_studio_membership_path');
  }
  return `studios/${studioId}/members/${uid}`;
}
