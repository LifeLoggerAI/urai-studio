export const STUDIO_SPATIAL_HANDOFF_REQUIRED_GATES = [
  'StudioProject',
  'StudioBrief',
  'StudioJob',
  'StudioAsset',
  'StudioExport',
  'UraiPassport',
  'PassportPermission',
  'ConsentRequirement',
  'SafetyBoundary',
  'V1_GENESIS_HOME',
  'V2_COGNITIVE_MIRROR',
  'V3_PATTERN_REFLECTION',
  'V4_WEBXR_HANDOFF',
  'V5_MIRROR_OF_BECOMING',
  'adFreeCoreExperience',
  'externalMarketingLayerEnabled',
] as const;

export type StudioSpatialHandoffRequiredGate =
  (typeof STUDIO_SPATIAL_HANDOFF_REQUIRED_GATES)[number];

export const STUDIO_SPATIAL_HANDOFF_GUARDRAILS = {
  requiredGateRegistry: STUDIO_SPATIAL_HANDOFF_REQUIRED_GATES,
  adFreeCoreExperience: true,
  externalMarketingLayerEnabled: false,
  notes:
    'Studio exports remain fallback-only until consent, release evidence, safety boundaries, and runtime gate checks are present.',
} as const;

export const STUDIO_SPATIAL_HANDOFF_VERSION = '0.1.0' as const;

export type StudioSpatialExportStatus =
  | 'draft'
  | 'queued'
  | 'generated'
  | 'ready_for_spatial_validation'
  | 'accepted_by_spatial'
  | 'rejected_by_spatial'
  | 'fallback_only';

export type SpatialRuntimeTarget =
  | 'web_2d_fallback'
  | 'three_scene'
  | 'webxr_manifest'
  | 'quest_vr'
  | 'visionos'
  | 'handheld_ar';

export type SpatialCapabilityState =
  | 'verified'
  | 'fallback_only'
  | 'requires_release_evidence'
  | 'roadmap'
  | 'unsupported';

export interface StudioSpatialAssetRef {
  id: string;
  kind: 'image' | 'video' | 'audio' | 'scene_manifest' | 'three_component' | 'firebase_bundle' | 'json';
  storagePath?: string;
  mimeType?: string;
  checksum?: string;
  tenantScoped: true;
}

export interface StudioSpatialExportManifest {
  schemaVersion: typeof STUDIO_SPATIAL_HANDOFF_VERSION;
  producerSystem: 'urai-studio';
  consumerSystem: 'urai-spatial';
  exportId: string;
  projectId: string;
  jobId?: string;
  tenantId: string;
  userId: string;
  status: StudioSpatialExportStatus;
  createdAt: string;
  updatedAt: string;
  targetRuntimes: Record<SpatialRuntimeTarget, SpatialCapabilityState>;
  assets: StudioSpatialAssetRef[];
  scene: {
    title: string;
    description?: string;
    renderer: 'fallback_cards' | 'three_scene' | 'webxr_manifest';
    entryNodeId?: string;
    moodWeather?: 'none' | 'symbolic' | 'verified_runtime';
    grounding: 'none' | 'symbolic_demo' | 'consented_user_data';
  };
  consent: {
    requiredCategories: string[];
    receiptIds: string[];
    missingConsentBlocksExport: boolean;
  };
  safety: {
    containsPrivateRawData: false;
    requiresUncertaintyLanguage: boolean;
    humanReviewRequired: boolean;
  };
  releaseEvidence: {
    studioBuildSha?: string;
    spatialBuildSha?: string;
    validatorName?: string;
    validatorVersion?: string;
    validatedAt?: string;
    liveSmokeUrl?: string;
  };
}

export interface StudioSpatialValidationResult {
  ok: boolean;
  errors: string[];
  blockedClaims: string[];
}

export const STUDIO_SPATIAL_UNSUPPORTED_RUNTIME_TARGETS: SpatialRuntimeTarget[] = [
  'quest_vr',
  'visionos',
  'handheld_ar',
];

export const STUDIO_SPATIAL_EVIDENCE_REQUIRED_TARGETS: SpatialRuntimeTarget[] = [
  'three_scene',
  'webxr_manifest',
];

export const DEFAULT_STUDIO_SPATIAL_RUNTIME_MATRIX: Record<
  SpatialRuntimeTarget,
  SpatialCapabilityState
> = {
  web_2d_fallback: 'verified',
  three_scene: 'requires_release_evidence',
  webxr_manifest: 'requires_release_evidence',
  quest_vr: 'unsupported',
  visionos: 'unsupported',
  handheld_ar: 'unsupported',
};

const REQUIRED_RUNTIME_TARGETS: SpatialRuntimeTarget[] = [
  'web_2d_fallback',
  'three_scene',
  'webxr_manifest',
  'quest_vr',
  'visionos',
  'handheld_ar',
];

export const createFallbackStudioSpatialManifest = (input: {
  exportId: string;
  projectId: string;
  jobId?: string;
  tenantId: string;
  userId: string;
  title: string;
  description?: string;
  createdAt?: string;
}): StudioSpatialExportManifest => {
  const timestamp = input.createdAt ?? new Date().toISOString();

  return {
    schemaVersion: STUDIO_SPATIAL_HANDOFF_VERSION,
    producerSystem: 'urai-studio',
    consumerSystem: 'urai-spatial',
    exportId: input.exportId,
    projectId: input.projectId,
    jobId: input.jobId,
    tenantId: input.tenantId,
    userId: input.userId,
    status: 'fallback_only',
    createdAt: timestamp,
    updatedAt: timestamp,
    targetRuntimes: DEFAULT_STUDIO_SPATIAL_RUNTIME_MATRIX,
    assets: [],
    scene: {
      title: input.title,
      description: input.description,
      renderer: 'fallback_cards',
      moodWeather: 'symbolic',
      grounding: 'none',
    },
    consent: {
      requiredCategories: [],
      receiptIds: [],
      missingConsentBlocksExport: true,
    },
    safety: {
      containsPrivateRawData: false,
      requiresUncertaintyLanguage: false,
      humanReviewRequired: false,
    },
    releaseEvidence: {},
  };
};

const hasValue = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export const listBlockedStudioSpatialClaims = (
  manifest: StudioSpatialExportManifest,
): string[] => {
  const blocked: string[] = [];

  for (const target of STUDIO_SPATIAL_UNSUPPORTED_RUNTIME_TARGETS) {
    if (manifest.targetRuntimes[target] === 'verified') {
      blocked.push(`unsupported-runtime:${target}`);
    }
  }

  for (const target of STUDIO_SPATIAL_EVIDENCE_REQUIRED_TARGETS) {
    if (manifest.targetRuntimes[target] === 'verified') {
      const hasReleaseEvidence =
        hasValue(manifest.releaseEvidence.studioBuildSha) &&
        hasValue(manifest.releaseEvidence.spatialBuildSha) &&
        hasValue(manifest.releaseEvidence.validatorName) &&
        hasValue(manifest.releaseEvidence.validatedAt);

      if (!hasReleaseEvidence) {
        blocked.push(`missing-release-evidence:${target}`);
      }
    }
  }

  if (manifest.scene.renderer !== 'fallback_cards' && manifest.status === 'fallback_only') {
    blocked.push('fallback-status-with-advanced-renderer');
  }

  if (manifest.consent.requiredCategories.length > 0 && manifest.consent.receiptIds.length === 0) {
    blocked.push('missing-consent-receipts');
  }

  return blocked;
};

export const validateStudioSpatialManifest = (
  manifest: StudioSpatialExportManifest,
): StudioSpatialValidationResult => {
  const errors: string[] = [];

  if (manifest.schemaVersion !== STUDIO_SPATIAL_HANDOFF_VERSION) {
    errors.push('schema-version-mismatch');
  }

  if (manifest.producerSystem !== 'urai-studio') {
    errors.push('producer-system-mismatch');
  }

  if (manifest.consumerSystem !== 'urai-spatial') {
    errors.push('consumer-system-mismatch');
  }

  for (const field of ['exportId', 'projectId', 'tenantId', 'userId', 'createdAt', 'updatedAt'] as const) {
    if (!hasValue(manifest[field])) {
      errors.push(`missing-${field}`);
    }
  }

  for (const target of REQUIRED_RUNTIME_TARGETS) {
    if (!manifest.targetRuntimes[target]) {
      errors.push(`missing-runtime-target:${target}`);
    }
  }

  if (!Array.isArray(manifest.assets)) {
    errors.push('assets-must-be-array');
  } else {
    for (const asset of manifest.assets) {
      if (asset.tenantScoped !== true) {
        errors.push(`asset-not-tenant-scoped:${asset.id || 'unknown'}`);
      }
    }
  }

  if (!hasValue(manifest.scene.title)) {
    errors.push('missing-scene-title');
  }

  if (manifest.safety.containsPrivateRawData !== false) {
    errors.push('unsafe-raw-data-flag');
  }

  const blockedClaims = listBlockedStudioSpatialClaims(manifest);

  return {
    ok: errors.length === 0 && blockedClaims.length === 0,
    errors,
    blockedClaims,
  };
};

export const isStudioSpatialManifestReleaseSafe = (
  manifest: StudioSpatialExportManifest,
): boolean => validateStudioSpatialManifest(manifest).ok;
