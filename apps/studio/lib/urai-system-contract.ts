export const URAI_SYSTEM_CONTRACT_VERSION = '0.1.0' as const;

export type UraiId = string;
export type UraiIsoDate = string;
export type UraiVersionId = 'v1' | 'v2' | 'v3' | 'v4' | 'v5';

export type UraiSystemName =
  | 'urai-app'
  | 'urai-studio'
  | 'urai-spatial'
  | 'urai-privacy'
  | 'urai-foundation'
  | 'urai-analytics'
  | 'asset-factory'
  | 'urai-passport'
  | 'urai-council';

export type UraiCapabilityKey =
  | 'V1_GENESIS_HOME'
  | 'V1_ORB_CHAT'
  | 'V1_GROUND_SKY_MOOD_WEATHER'
  | 'V1_PASSPORT_PERMISSIONS'
  | 'V2_COGNITIVE_MIRROR'
  | 'V2_EMOTIONAL_TIMELINE'
  | 'V2_MOOD_FORECAST'
  | 'V2_RECOVERY_TIMELINE'
  | 'V3_SOCIAL_WELLNESS'
  | 'V3_PATTERN_REFLECTION'
  | 'V3_MENTAL_LOAD_INTELLIGENCE'
  | 'V4_SPATIAL_WORLD'
  | 'V4_WEBXR_HANDOFF'
  | 'V4_AR_VR_PORTALS'
  | 'V5_MIRROR_OF_BECOMING'
  | 'V5_LEGACY_SCROLLS'
  | 'V5_COMPANION_EVOLUTION'
  | 'V5_MYTHIC_PATTERN_INDEX';

export type StudioJobStatus =
  | 'draft'
  | 'queued'
  | 'running'
  | 'waiting_for_consent'
  | 'waiting_for_payment'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export type StudioJobKind =
  | 'image_generation'
  | 'video_generation'
  | 'music_generation'
  | 'voice_generation'
  | 'motion_spec_generation'
  | 'three_scene_generation'
  | 'webxr_scene_generation'
  | 'pitch_export'
  | 'scroll_export'
  | 'asset_bundle_export';

export type StudioAssetKind =
  | 'image'
  | 'video'
  | 'audio'
  | 'subtitle'
  | 'script'
  | 'storyboard'
  | 'scene_manifest'
  | 'three_component'
  | 'rive_or_lottie_spec'
  | 'firebase_bundle'
  | 'pitch_document'
  | 'brand_kit';

export type StudioExportKind =
  | 'png'
  | 'svg'
  | 'webp'
  | 'mp4'
  | 'wav'
  | 'mp3'
  | 'srt'
  | 'json'
  | 'pdf'
  | 'zip'
  | 'firebase_bundle'
  | 'react_component'
  | 'three_scene'
  | 'webxr_manifest';

export type ConsentSignalCategory =
  | 'account'
  | 'profile'
  | 'audio'
  | 'transcription'
  | 'location'
  | 'device_activity'
  | 'calendar'
  | 'communications_metadata'
  | 'health'
  | 'sleep'
  | 'social_interaction'
  | 'facial_analysis'
  | 'environmental_audio'
  | 'generated_assets'
  | 'analytics'
  | 'third_party_export';

export type ConsentState = 'not_requested' | 'granted' | 'denied' | 'revoked' | 'expired';

export interface TenantScopedRecord {
  id: UraiId;
  tenantId: UraiId;
  userId: UraiId;
  createdAt: UraiIsoDate;
  updatedAt: UraiIsoDate;
}

export interface ConsentRequirement {
  category: ConsentSignalCategory;
  stateRequired: 'granted';
  purpose: string;
  retentionPolicyId: string;
}

export interface SafetyBoundary {
  requiredLanguage: 'none' | 'uncertainty' | 'pattern_support_not_diagnosis';
  humanReviewRequired: boolean;
  policyId?: string;
}

export interface StudioProject extends TenantScopedRecord {
  name: string;
  description?: string;
  ownerSystem: 'urai-studio';
  linkedSystems: UraiSystemName[];
  capabilityKeys: UraiCapabilityKey[];
}

export interface StudioBrief extends TenantScopedRecord {
  projectId: UraiId;
  title: string;
  prompt: string;
  intendedOutputs: StudioAssetKind[];
  requestedExports: StudioExportKind[];
  consentRequirements: ConsentRequirement[];
  safetyBoundaries: SafetyBoundary[];
}

export interface StudioJob extends TenantScopedRecord {
  projectId: UraiId;
  briefId?: UraiId;
  kind: StudioJobKind;
  status: StudioJobStatus;
  provider?: string;
  model?: string;
  inputAssetIds: UraiId[];
  outputAssetIds: UraiId[];
  requestedExportIds: UraiId[];
  consentRequirements: ConsentRequirement[];
  safetyBoundaries: SafetyBoundary[];
  errorCode?: string;
  errorMessage?: string;
}

export interface StudioAsset extends TenantScopedRecord {
  projectId: UraiId;
  jobId?: UraiId;
  kind: StudioAssetKind;
  title: string;
  storagePath: string;
  mimeType: string;
  sizeBytes?: number;
  checksum?: string;
  generationMetadata?: Record<string, unknown>;
  consentRequirements: ConsentRequirement[];
  safetyBoundaries: SafetyBoundary[];
}

export interface StudioExport extends TenantScopedRecord {
  projectId: UraiId;
  jobId?: UraiId;
  assetIds: UraiId[];
  kind: StudioExportKind;
  status: StudioJobStatus;
  storagePath?: string;
  downloadUrl?: string;
  expiresAt?: UraiIsoDate;
  tenantScoped: true;
}

export interface PassportPermission {
  category: ConsentSignalCategory;
  state: ConsentState;
  purpose: string;
  grantedAt?: UraiIsoDate;
  revokedAt?: UraiIsoDate;
  expiresAt?: UraiIsoDate;
  retentionPolicyId: string;
}

export interface UraiPassport extends TenantScopedRecord {
  displayName: string;
  permissions: PassportPermission[];
  dataExportEnabled: boolean;
  deletionFlowEnabled: boolean;
  adFreeCoreExperience: true;
  externalMarketingLayerEnabled: false;
}

export interface UraiCapabilityContract {
  key: UraiCapabilityKey;
  version: UraiVersionId;
  systems: UraiSystemName[];
  dataDependencies: ConsentSignalCategory[];
  consentRequirements: ConsentRequirement[];
  rendererDependencies: string[];
  exportKinds: StudioExportKind[];
  safetyBoundaries: SafetyBoundary[];
  acceptanceTests: string[];
}

export interface UraiSystemContract {
  contractVersion: typeof URAI_SYSTEM_CONTRACT_VERSION;
  canonicalStudioAppPath: 'apps/studio';
  systems: UraiSystemName[];
  capabilities: UraiCapabilityContract[];
}

export const consentRequired = (
  category: ConsentSignalCategory,
  purpose: string,
  retentionPolicyId = `${category}_standard_retention`,
): ConsentRequirement => ({
  category,
  stateRequired: 'granted',
  purpose,
  retentionPolicyId,
});

export const URAI_V1_V5_CAPABILITIES: UraiCapabilityContract[] = [
  {
    key: 'V1_GENESIS_HOME',
    version: 'v1',
    systems: ['urai-app', 'urai-studio', 'urai-spatial', 'urai-passport', 'urai-council'],
    dataDependencies: ['profile', 'generated_assets', 'analytics'],
    consentRequirements: [consentRequired('profile', 'Render the personalized Genesis home world.')],
    rendererDependencies: ['true-3d-world', 'ground', 'orb', 'sky', 'mood-weather', 'soundscape'],
    exportKinds: ['json', 'three_scene', 'webxr_manifest'],
    safetyBoundaries: [{ requiredLanguage: 'none', humanReviewRequired: false }],
    acceptanceTests: ['Genesis world loads without internal labels.', 'Orb and ground render from typed scene state.'],
  },
  {
    key: 'V2_COGNITIVE_MIRROR',
    version: 'v2',
    systems: ['urai-app', 'urai-analytics', 'urai-privacy', 'urai-council'],
    dataDependencies: ['device_activity', 'transcription', 'analytics'],
    consentRequirements: [consentRequired('analytics', 'Build explainable reflection patterns.')],
    rendererDependencies: ['cognitive-mirror-panel', 'explainability-card'],
    exportKinds: ['json', 'pdf'],
    safetyBoundaries: [{ requiredLanguage: 'pattern_support_not_diagnosis', humanReviewRequired: false }],
    acceptanceTests: ['Every insight includes why-am-I-seeing-this explanation.'],
  },
  {
    key: 'V3_PATTERN_REFLECTION',
    version: 'v3',
    systems: ['urai-app', 'urai-privacy', 'urai-analytics', 'urai-council'],
    dataDependencies: ['social_interaction', 'transcription', 'communications_metadata'],
    consentRequirements: [consentRequired('social_interaction', 'Support relationship and behavior pattern reflection.')],
    rendererDependencies: ['social-constellation', 'uncertainty-copy'],
    exportKinds: ['json', 'pdf'],
    safetyBoundaries: [{ requiredLanguage: 'pattern_support_not_diagnosis', humanReviewRequired: true }],
    acceptanceTests: ['Pattern reflection features avoid objective certainty claims.'],
  },
  {
    key: 'V4_WEBXR_HANDOFF',
    version: 'v4',
    systems: ['urai-studio', 'urai-spatial', 'asset-factory'],
    dataDependencies: ['generated_assets'],
    consentRequirements: [consentRequired('generated_assets', 'Export generated spatial assets into WebXR.')],
    rendererDependencies: ['webxr-runtime', 'scene-manifest', 'camera-rig'],
    exportKinds: ['three_scene', 'webxr_manifest', 'json'],
    safetyBoundaries: [{ requiredLanguage: 'none', humanReviewRequired: false }],
    acceptanceTests: ['Studio scene manifest is loadable by URAI Spatial.'],
  },
  {
    key: 'V5_MIRROR_OF_BECOMING',
    version: 'v5',
    systems: ['urai-app', 'urai-studio', 'urai-council', 'urai-privacy'],
    dataDependencies: ['profile', 'transcription', 'analytics', 'generated_assets'],
    consentRequirements: [consentRequired('profile', 'Create long-range identity and legacy reflections.')],
    rendererDependencies: ['mirror-of-becoming-scene', 'legacy-scroll-exporter'],
    exportKinds: ['mp4', 'pdf', 'json', 'zip'],
    safetyBoundaries: [{ requiredLanguage: 'pattern_support_not_diagnosis', humanReviewRequired: false }],
    acceptanceTests: ['Legacy output is exportable and includes consent receipt metadata.'],
  },
];

export const URAI_SYSTEM_CONTRACT: UraiSystemContract = {
  contractVersion: URAI_SYSTEM_CONTRACT_VERSION,
  canonicalStudioAppPath: 'apps/studio',
  systems: [
    'urai-app',
    'urai-studio',
    'urai-spatial',
    'urai-privacy',
    'urai-foundation',
    'urai-analytics',
    'asset-factory',
    'urai-passport',
    'urai-council',
  ],
  capabilities: URAI_V1_V5_CAPABILITIES,
};

export const getCapability = (key: UraiCapabilityKey): UraiCapabilityContract => {
  const capability = URAI_V1_V5_CAPABILITIES.find((item) => item.key === key);
  if (!capability) {
    throw new Error(`Unknown URAI capability: ${key}`);
  }
  return capability;
};
