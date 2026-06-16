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

export const isStudioSpatialManifestReleaseSafe = (
  manifest: StudioSpatialExportManifest,
): boolean => {
  if (manifest.producerSystem !== 'urai-studio') return false;
  if (manifest.consumerSystem !== 'urai-spatial') return false;
  if (manifest.safety.containsPrivateRawData !== false) return false;
  if (!manifest.tenantId || !manifest.userId || !manifest.projectId || !manifest.exportId) return false;

  const unsupportedTargets: SpatialRuntimeTarget[] = ['quest_vr', 'visionos', 'handheld_ar'];
  return unsupportedTargets.every((target) => manifest.targetRuntimes[target] !== 'verified');
};
