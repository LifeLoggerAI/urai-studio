export const STUDIO_SPATIAL_HANDOFF_VERSION = '0.1.0' as const;
export const STUDIO_SPATIAL_HANDOFF_CONTRACT_VERSION = STUDIO_SPATIAL_HANDOFF_VERSION;

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

export type UraiSpatialRuntimeTarget =
  | 'web-spatial'
  | 'webxr-disabled'
  | 'quest-vr-disabled'
  | 'visionos-disabled'
  | 'ar-handheld-disabled';

export type UraiSpatialAssetKind =
  | 'texture'
  | 'mesh'
  | 'audio'
  | 'subtitle'
  | 'scene-json'
  | 'shader'
  | 'sprite'
  | 'particle-config';

export type UraiSpatialAssetScope = 'public-demo' | 'tenant-scoped' | 'user-scoped';
export type UraiSpatialRequiredLanguage = 'none' | 'uncertainty' | 'pattern_support_not_diagnosis';
export type UraiSpatialWorldType = 'genesis-home' | 'life-map' | 'memory-theater' | 'mirror' | 'legacy-scroll';

export const DEFAULT_STUDIO_SPATIAL_RUNTIME_MATRIX = [
  'web-spatial',
  'webxr-disabled',
  'quest-vr-disabled',
  'visionos-disabled',
  'ar-handheld-disabled',
] as const satisfies readonly UraiSpatialRuntimeTarget[];

export const STUDIO_SPATIAL_UNSUPPORTED_RUNTIME_TARGETS = [
  'webxr',
  'quest-vr',
  'visionos',
  'ar-handheld',
] as const;

export const STUDIO_SPATIAL_EVIDENCE_REQUIRED_TARGETS = ['web-spatial'] as const;

export const STUDIO_SPATIAL_GLTF_MIME_TYPES = {
  glb: 'model/gltf-binary',
  gltf: 'model/gltf+json',
} as const;

export type StudioSpatialModelFormat = keyof typeof STUDIO_SPATIAL_GLTF_MIME_TYPES;

export interface UraiSpatialSceneManifest {
  sceneId: string;
  title: string;
  worldType: UraiSpatialWorldType | string;
  cameraRig: { mode: string };
  lightingProfile: { profile: string };
  groundLayer: { assetId: string };
  skyLayer: { profile: string };
  orbLayer: { profile: string };
  weatherLayer: { profile: string };
  memoryStarLayers: Array<{ assetId: string }>;
  fallbackState: { renderer: 'fallback_cards' };
}

export interface UraiSpatialAssetManifestItem {
  assetId: string;
  kind: UraiSpatialAssetKind;
  uri: string;
  mimeType: string;
  checksum: string;
  scope: UraiSpatialAssetScope;
  fallbackUri?: string;
}

export interface UraiSpatialConsentReceipt {
  receiptId: string;
  tenantId: string;
  userId: string;
  purpose: string;
  grantedCategories: string[];
  createdAt: string;
  retentionPolicyId: string;
}

export interface UraiSpatialSafetyBoundary {
  layer: string;
  requiredLanguage: UraiSpatialRequiredLanguage;
  humanReviewRequired?: boolean;
}

export interface StudioSpatialReleaseEvidence {
  studioBuildSha: string;
  spatialBuildSha: string;
  validatorName: string;
  validatorVersion: string;
  validatedAt: string;
  liveSmokeUrl: string;
}

// This receipt is not accepted from the wire payload. The server-side caller
// must obtain it from the protected deployment and Spatial acceptance
// authorities, then pass it separately to the emitter.
export interface StudioSpatialTrustedReleaseAuthority {
  source: 'protected-deployment-and-spatial-acceptance';
  studioBuildSha: string;
  spatialBuildSha: string;
  liveSmokeUrl: string;
  studioDeploymentReceiptId: string;
  spatialAcceptanceReceiptId: string;
  receiptDigest: string;
  verifiedAt: string;
  validatorName: string;
  validatorVersion: string;
  validatedAt: string;
  consentAuthority: {
    source: 'protected-consent-registry';
    status: 'active';
    receiptId: string;
    tenantId: string;
    userId: string;
    purpose: string;
    grantedCategories: string[];
    createdAt: string;
    retentionPolicyId: string;
    verifiedAt: string;
    receiptDigest: string;
  };
  assetAuthority: {
    source: 'protected-tenant-asset-registry';
    tenantId: string;
    verifiedAt: string;
    receiptDigest: string;
    assetRecords: Array<{
      assetId: string;
      kind: UraiSpatialAssetKind;
      uri: string;
      fallbackUri?: string;
      mimeType: string;
      checksum: string;
      scope: UraiSpatialAssetScope;
      userId?: string;
    }>;
  };
  safetyAuthority: {
    source: 'protected-safety-policy-registry';
    policyId: string;
    verifiedAt: string;
    receiptDigest: string;
    boundaries: UraiSpatialSafetyBoundary[];
  };
}

// The core fields match the current urai-spatial 0.1.0 consumer contract.
// Studio requires the releaseEvidence extension before emitting a wire payload.
export interface StudioSpatialExport {
  contractVersion: typeof STUDIO_SPATIAL_HANDOFF_CONTRACT_VERSION;
  producer: 'urai-studio';
  consumer: 'urai-spatial';
  exportId: string;
  projectId: string;
  tenantId: string;
  createdAt: string;
  sceneManifest: UraiSpatialSceneManifest;
  assetManifest: UraiSpatialAssetManifestItem[];
  consentReceipt: UraiSpatialConsentReceipt;
  safetyBoundaries: UraiSpatialSafetyBoundary[];
  runtimeTargets: UraiSpatialRuntimeTarget[];
  releaseEvidence: StudioSpatialReleaseEvidence;
}

export interface StudioSpatialValidationResult {
  ok: boolean;
  acceptedRuntimeTargets: UraiSpatialRuntimeTarget[];
  rejectedRuntimeTargets: string[];
  warnings: string[];
  errors: string[];
}

export type StudioSpatialEmissionResult =
  | { ok: true; export: StudioSpatialExport; validation: StudioSpatialValidationResult }
  | { ok: false; export: null; validation: StudioSpatialValidationResult };

export const STUDIO_SPATIAL_HANDOFF_GUARDRAILS = {
  requiredGateRegistry: STUDIO_SPATIAL_HANDOFF_REQUIRED_GATES,
  tenantScoped: true,
  adFreeCoreExperience: true,
  externalMarketingLayerEnabled: false,
  wireContract: 'urai-spatial/0.1.0',
  emissionPolicy: 'trusted-release-authority-only',
  fallbackRenderer: 'fallback_cards',
} as const;

const allowedRuntimeTargets = new Set<string>(DEFAULT_STUDIO_SPATIAL_RUNTIME_MATRIX);
const allowedAssetKinds = new Set<UraiSpatialAssetKind>([
  'texture',
  'mesh',
  'audio',
  'subtitle',
  'scene-json',
  'shader',
  'sprite',
  'particle-config',
]);
const allowedAssetScopes = new Set<UraiSpatialAssetScope>(['public-demo', 'tenant-scoped', 'user-scoped']);
const gltfMimeTypes = new Set<string>(Object.values(STUDIO_SPATIAL_GLTF_MIME_TYPES));
const requiredSceneRecords = [
  'cameraRig',
  'lightingProfile',
  'groundLayer',
  'skyLayer',
  'orbLayer',
  'weatherLayer',
  'fallbackState',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoDate(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!match || Number.isNaN(Date.parse(value))) return false;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const maxDay = month >= 1 && month <= 12 ? new Date(Date.UTC(year, month, 0)).getUTCDate() : 0;
  return day >= 1
    && day <= maxDay
    && Number(hourText) <= 23
    && Number(minuteText) <= 59
    && Number(secondText) <= 59
    && (offsetHourText === undefined || Number(offsetHourText) <= 23)
    && (offsetMinuteText === undefined || Number(offsetMinuteText) <= 59);
}

function rejectUnknownKeys(value: Record<string, unknown>, allowed: readonly string[], path: string, errors: string[]) {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) errors.push(`${path}.${key} is not declared by the wire contract`);
  }
}

function isCommitSha(value: unknown): value is string {
  return isNonEmptyString(value) && /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(value);
}

function isSha256Checksum(value: unknown): value is string {
  return isNonEmptyString(value) && /^sha256:[a-f0-9]{64}$/i.test(value);
}

function uriIsSafe(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  if (value.startsWith('gs://')) return true;
  try {
    return ['https:', 'ipfs:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function mimeTypeMatchesAssetKind(kind: UraiSpatialAssetKind, value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  switch (kind) {
    case 'texture':
    case 'sprite':
      return /^image\/[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]*$/.test(value);
    case 'mesh':
      return gltfMimeTypes.has(value);
    case 'audio':
      return /^audio\/[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]*$/.test(value);
    case 'subtitle':
      return ['text/vtt', 'application/x-subrip', 'text/plain'].includes(value);
    case 'scene-json':
    case 'particle-config':
      return value === 'application/json';
    case 'shader':
      return ['text/plain', 'text/x-glsl', 'application/x-glsl'].includes(value);
  }
  return false;
}

function validateReleaseEvidence(value: unknown, errors: string[]) {
  if (!isRecord(value)) {
    errors.push('releaseEvidence is required');
    return;
  }
  rejectUnknownKeys(value, ['studioBuildSha', 'spatialBuildSha', 'validatorName', 'validatorVersion', 'validatedAt', 'liveSmokeUrl'], 'releaseEvidence', errors);
  if (!isCommitSha(value.studioBuildSha)) errors.push('releaseEvidence.studioBuildSha must be an exact commit SHA');
  if (!isCommitSha(value.spatialBuildSha)) errors.push('releaseEvidence.spatialBuildSha must be an exact commit SHA');
  if (!isNonEmptyString(value.validatorName)) errors.push('releaseEvidence.validatorName is required');
  if (!isNonEmptyString(value.validatorVersion)) errors.push('releaseEvidence.validatorVersion is required');
  if (!isIsoDate(value.validatedAt)) errors.push('releaseEvidence.validatedAt must be an ISO timestamp');
  if (!uriIsSafe(value.liveSmokeUrl) || !String(value.liveSmokeUrl).startsWith('https://')) {
    errors.push('releaseEvidence.liveSmokeUrl must use https');
  }
}

function validateTrustedReleaseAuthority(
  wire: StudioSpatialExport,
  evidence: StudioSpatialReleaseEvidence,
  authority: StudioSpatialTrustedReleaseAuthority | undefined,
  errors: string[],
) {
  if (!authority) {
    errors.push('trusted release authority is required before emission');
    return;
  }
  if (authority.source !== 'protected-deployment-and-spatial-acceptance') {
    errors.push('trusted release authority source is invalid');
  }
  if (!isCommitSha(authority.studioBuildSha) || authority.studioBuildSha !== evidence.studioBuildSha) {
    errors.push('trusted Studio deployment SHA does not match release evidence');
  }
  if (!isCommitSha(authority.spatialBuildSha) || authority.spatialBuildSha !== evidence.spatialBuildSha) {
    errors.push('trusted Spatial acceptance SHA does not match release evidence');
  }
  if (!isNonEmptyString(authority.studioDeploymentReceiptId)) {
    errors.push('trusted Studio deployment receipt is required');
  }
  if (!isNonEmptyString(authority.spatialAcceptanceReceiptId)) {
    errors.push('trusted Spatial acceptance receipt is required');
  }
  if (!isSha256Checksum(authority.receiptDigest)) {
    errors.push('trusted release authority receipt digest must be sha256');
  }
  if (!isIsoDate(authority.verifiedAt)) errors.push('trusted release authority verifiedAt must be an ISO timestamp');
  for (const field of ['validatorName', 'validatorVersion', 'validatedAt'] as const) {
    if (authority[field] !== evidence[field]) errors.push(`trusted ${field} does not match release evidence`);
  }
  if (!isIsoDate(authority.validatedAt)) errors.push('trusted release authority validatedAt must be an ISO timestamp');
  if (authority.liveSmokeUrl !== evidence.liveSmokeUrl) {
    errors.push('trusted live smoke URL does not match release evidence');
  }
  const consent = authority.consentAuthority;
  if (!consent || consent.source !== 'protected-consent-registry' || consent.status !== 'active') {
    errors.push('active protected consent authority is required');
  } else {
    const wireConsent = wire.consentReceipt;
    for (const field of ['receiptId', 'tenantId', 'userId', 'purpose', 'createdAt', 'retentionPolicyId'] as const) {
      if (consent[field] !== wireConsent[field]) errors.push(`trusted consent ${field} does not match wire receipt`);
    }
    const trustedCategories = Array.isArray(consent.grantedCategories) ? [...new Set(consent.grantedCategories)].sort() : [];
    const wireCategories = [...new Set(wireConsent.grantedCategories)].sort();
    if (!Array.isArray(consent.grantedCategories) || trustedCategories.length !== consent.grantedCategories.length || JSON.stringify(trustedCategories) !== JSON.stringify(wireCategories)) {
      errors.push('trusted consent categories do not match wire receipt');
    }
    if (!isIsoDate(consent.verifiedAt) || !isSha256Checksum(consent.receiptDigest)) {
      errors.push('trusted consent verification evidence is incomplete');
    }
  }

  const assetAuthority = authority.assetAuthority;
  if (!assetAuthority || assetAuthority.source !== 'protected-tenant-asset-registry' || assetAuthority.tenantId !== wire.tenantId) {
    errors.push('protected tenant asset authority is required');
  } else {
    if (!isIsoDate(assetAuthority.verifiedAt) || !isSha256Checksum(assetAuthority.receiptDigest)) {
      errors.push('trusted asset verification evidence is incomplete');
    }
    const assetRecords = Array.isArray(assetAuthority.assetRecords)
      ? assetAuthority.assetRecords.filter(isRecord)
      : [];
    if (!Array.isArray(assetAuthority.assetRecords) || assetRecords.length !== assetAuthority.assetRecords.length) {
      errors.push('trusted asset authority records must be well-formed objects');
    }
    const trustedAssets = new Map(assetRecords.map((asset) => [asset.assetId, asset]));
    for (const asset of wire.assetManifest) {
      const trusted = trustedAssets.get(asset.assetId);
      if (
        !trusted
        || trusted.uri !== asset.uri
        || trusted.fallbackUri !== asset.fallbackUri
        || trusted.kind !== asset.kind
        || trusted.mimeType !== asset.mimeType
        || trusted.checksum !== asset.checksum
        || trusted.scope !== asset.scope
      ) {
        errors.push(`trusted asset ownership and loader metadata do not match ${asset.assetId}`);
      } else if (asset.scope === 'user-scoped' && trusted.userId !== wire.consentReceipt.userId) {
        errors.push(`trusted user ownership does not match ${asset.assetId}`);
      }
    }
    if (trustedAssets.size !== wire.assetManifest.length) errors.push('trusted asset authority must match the complete wire asset set');
  }

  const safetyAuthority = authority.safetyAuthority;
  if (!safetyAuthority || safetyAuthority.source !== 'protected-safety-policy-registry') {
    errors.push('protected safety policy authority is required');
  } else {
    if (!isNonEmptyString(safetyAuthority.policyId)
      || !isIsoDate(safetyAuthority.verifiedAt)
      || !isSha256Checksum(safetyAuthority.receiptDigest)) {
      errors.push('trusted safety policy verification evidence is incomplete');
    }
    const trustedBoundaries = Array.isArray(safetyAuthority.boundaries) ? safetyAuthority.boundaries : [];
    const normalizeBoundary = (boundary: UraiSpatialSafetyBoundary) => ({
      layer: boundary.layer,
      requiredLanguage: boundary.requiredLanguage,
      humanReviewRequired: boundary.humanReviewRequired ?? false,
    });
    const trustedByLayer = new Map(trustedBoundaries.map((boundary) => [boundary.layer, normalizeBoundary(boundary)]));
    for (const boundary of wire.safetyBoundaries) {
      const trusted = trustedByLayer.get(boundary.layer);
      if (!trusted || JSON.stringify(trusted) !== JSON.stringify(normalizeBoundary(boundary))) {
        errors.push(`trusted safety boundary does not match ${boundary.layer}`);
      }
    }
    if (trustedByLayer.size !== wire.safetyBoundaries.length) {
      errors.push('trusted safety authority must match the complete wire boundary set');
    }
  }
}

export function spatialModelKind(format: StudioSpatialModelFormat): UraiSpatialAssetKind {
  if (!(format in STUDIO_SPATIAL_GLTF_MIME_TYPES)) throw new TypeError(`Unsupported spatial model format: ${format}`);
  return 'mesh';
}

export function spatialModelMimeType(format: StudioSpatialModelFormat): string {
  const mimeType = STUDIO_SPATIAL_GLTF_MIME_TYPES[format];
  if (!mimeType) throw new TypeError(`Unsupported spatial model format: ${format}`);
  return mimeType;
}

export function validateStudioSpatialExport(input: unknown): StudioSpatialValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const acceptedRuntimeTargets: UraiSpatialRuntimeTarget[] = [];
  const rejectedRuntimeTargets: string[] = [];

  if (!isRecord(input)) {
    return { ok: false, acceptedRuntimeTargets, rejectedRuntimeTargets, warnings, errors: ['handoff payload must be an object'] };
  }

  rejectUnknownKeys(input, ['contractVersion', 'producer', 'consumer', 'exportId', 'projectId', 'tenantId', 'createdAt', 'sceneManifest', 'assetManifest', 'consentReceipt', 'safetyBoundaries', 'runtimeTargets', 'releaseEvidence'], 'handoff', errors);

  if (input.contractVersion !== STUDIO_SPATIAL_HANDOFF_CONTRACT_VERSION) {
    errors.push(`unsupported contractVersion: ${String(input.contractVersion)}`);
  }
  if (input.producer !== 'urai-studio') errors.push('producer must be urai-studio');
  if (input.consumer !== 'urai-spatial') errors.push('consumer must be urai-spatial');
  for (const key of ['exportId', 'projectId', 'tenantId'] as const) {
    if (!isNonEmptyString(input[key])) errors.push(`${key} is required`);
  }
  if (!isIsoDate(input.createdAt)) errors.push('createdAt must be an ISO timestamp');

  const runtimeTargets = Array.isArray(input.runtimeTargets) ? input.runtimeTargets : [];
  if (runtimeTargets.length === 0) errors.push('runtimeTargets must include web-spatial');
  for (const target of runtimeTargets) {
    if (typeof target !== 'string' || !allowedRuntimeTargets.has(target)) {
      rejectedRuntimeTargets.push(String(target));
    } else if (!acceptedRuntimeTargets.includes(target as UraiSpatialRuntimeTarget)) {
      acceptedRuntimeTargets.push(target as UraiSpatialRuntimeTarget);
    } else {
      errors.push(`duplicate runtime target: ${target}`);
    }
  }
  if (!acceptedRuntimeTargets.includes('web-spatial')) errors.push('runtimeTargets must include web-spatial');
  for (const rejected of rejectedRuntimeTargets) errors.push(`unsupported runtime target: ${rejected}`);

  if (!isRecord(input.sceneManifest)) {
    errors.push('sceneManifest is required');
  } else {
    rejectUnknownKeys(input.sceneManifest, ['sceneId', 'title', 'worldType', 'cameraRig', 'lightingProfile', 'groundLayer', 'skyLayer', 'orbLayer', 'weatherLayer', 'memoryStarLayers', 'fallbackState'], 'sceneManifest', errors);
    for (const key of ['sceneId', 'title', 'worldType'] as const) {
      if (!isNonEmptyString(input.sceneManifest[key])) errors.push(`sceneManifest.${key} is required`);
    }
    for (const key of requiredSceneRecords) {
      if (!isRecord(input.sceneManifest[key])) errors.push(`sceneManifest.${key} is required`);
    }
    const sceneRecords = [
      ['cameraRig', 'mode'],
      ['lightingProfile', 'profile'],
      ['groundLayer', 'assetId'],
      ['skyLayer', 'profile'],
      ['orbLayer', 'profile'],
      ['weatherLayer', 'profile'],
      ['fallbackState', 'renderer'],
    ] as const;
    for (const [recordName, requiredField] of sceneRecords) {
      const record = input.sceneManifest[recordName];
      if (!isRecord(record)) continue;
      rejectUnknownKeys(record, [requiredField], `sceneManifest.${recordName}`, errors);
      if (!isNonEmptyString(record[requiredField])) errors.push(`sceneManifest.${recordName}.${requiredField} is required`);
    }
    if (isRecord(input.sceneManifest.fallbackState) && input.sceneManifest.fallbackState.renderer !== 'fallback_cards') {
      errors.push('sceneManifest.fallbackState.renderer must be fallback_cards');
    }
    if (!Array.isArray(input.sceneManifest.memoryStarLayers)) {
      errors.push('sceneManifest.memoryStarLayers must be an array');
    } else {
      input.sceneManifest.memoryStarLayers.forEach((layer, index) => {
        if (!isRecord(layer)) {
          errors.push(`sceneManifest.memoryStarLayers[${index}] must be an object`);
          return;
        }
        rejectUnknownKeys(layer, ['assetId'], `sceneManifest.memoryStarLayers[${index}]`, errors);
        if (!isNonEmptyString(layer.assetId)) errors.push(`sceneManifest.memoryStarLayers[${index}].assetId is required`);
      });
    }
  }

  const assetIds = new Set<string>();
  if (!Array.isArray(input.assetManifest) || input.assetManifest.length === 0) {
    errors.push('assetManifest must contain at least one complete asset');
  } else {
    input.assetManifest.forEach((asset, index) => {
      if (!isRecord(asset)) {
        errors.push(`assetManifest[${index}] must be an object`);
        return;
      }
      rejectUnknownKeys(asset, ['assetId', 'kind', 'uri', 'mimeType', 'checksum', 'scope', 'fallbackUri'], `assetManifest[${index}]`, errors);
      if (!isNonEmptyString(asset.assetId)) {
        errors.push(`assetManifest[${index}].assetId is required`);
      } else if (assetIds.has(asset.assetId)) {
        errors.push(`assetManifest[${index}].assetId must be unique`);
      } else {
        assetIds.add(asset.assetId);
      }
      const assetKind = asset.kind as UraiSpatialAssetKind;
      if (!isNonEmptyString(asset.kind) || !allowedAssetKinds.has(assetKind)) {
        errors.push(`assetManifest[${index}].kind is not allowed`);
      }
      if (!uriIsSafe(asset.uri)) errors.push(`assetManifest[${index}].uri must use https, ipfs, or gs`);
      if (allowedAssetKinds.has(assetKind) && !mimeTypeMatchesAssetKind(assetKind, asset.mimeType)) {
        errors.push(`assetManifest[${index}] ${assetKind} must use a compatible MIME type`);
      }
      if (!isSha256Checksum(asset.checksum)) {
        errors.push(`assetManifest[${index}].checksum must be a sha256 digest`);
      }
      if (!isNonEmptyString(asset.scope) || !allowedAssetScopes.has(asset.scope as UraiSpatialAssetScope)) {
        errors.push(`assetManifest[${index}].scope is not allowed`);
      }
      if (asset.fallbackUri !== undefined && !uriIsSafe(asset.fallbackUri)) {
        errors.push(`assetManifest[${index}].fallbackUri must use https, ipfs, or gs`);
      }
      if (asset.scope === 'user-scoped') {
        warnings.push(`assetManifest[${index}] is user-scoped; renderer must require authenticated user context`);
      }
    });
  }
  if (isRecord(input.sceneManifest)) {
    const referencedAssetIds = [
      isRecord(input.sceneManifest.groundLayer) ? input.sceneManifest.groundLayer.assetId : undefined,
      ...(Array.isArray(input.sceneManifest.memoryStarLayers)
        ? input.sceneManifest.memoryStarLayers.map((layer) => isRecord(layer) ? layer.assetId : undefined)
        : []),
    ].filter(isNonEmptyString);
    for (const assetId of referencedAssetIds) {
      if (!assetIds.has(assetId)) errors.push(`sceneManifest references missing asset ${assetId}`);
    }
  }

  if (!isRecord(input.consentReceipt)) {
    errors.push('consentReceipt is required');
  } else {
    rejectUnknownKeys(input.consentReceipt, ['receiptId', 'tenantId', 'userId', 'purpose', 'grantedCategories', 'createdAt', 'retentionPolicyId'], 'consentReceipt', errors);
    for (const key of ['receiptId', 'tenantId', 'userId', 'purpose', 'retentionPolicyId'] as const) {
      if (!isNonEmptyString(input.consentReceipt[key])) errors.push(`consentReceipt.${key} is required`);
    }
    if (input.consentReceipt.tenantId !== input.tenantId) errors.push('consentReceipt.tenantId must match tenantId');
    if (!isIsoDate(input.consentReceipt.createdAt)) errors.push('consentReceipt.createdAt must be an ISO timestamp');
    if (!Array.isArray(input.consentReceipt.grantedCategories) || input.consentReceipt.grantedCategories.length === 0) {
      errors.push('consentReceipt.grantedCategories must be a non-empty array');
    } else if (!input.consentReceipt.grantedCategories.every(isNonEmptyString)) {
      errors.push('consentReceipt.grantedCategories must contain non-empty strings');
    }
  }

  if (!Array.isArray(input.safetyBoundaries) || input.safetyBoundaries.length === 0) {
    errors.push('safetyBoundaries must contain at least one boundary');
  } else {
    input.safetyBoundaries.forEach((boundary, index) => {
      if (!isRecord(boundary)) {
        errors.push(`safetyBoundaries[${index}] must be an object`);
        return;
      }
      rejectUnknownKeys(boundary, ['layer', 'requiredLanguage', 'humanReviewRequired'], `safetyBoundaries[${index}]`, errors);
      if (!isNonEmptyString(boundary.layer)) errors.push(`safetyBoundaries[${index}].layer is required`);
      if (!['none', 'uncertainty', 'pattern_support_not_diagnosis'].includes(String(boundary.requiredLanguage))) {
        errors.push(`safetyBoundaries[${index}].requiredLanguage is invalid`);
      }
      if (boundary.humanReviewRequired !== undefined && typeof boundary.humanReviewRequired !== 'boolean') {
        errors.push(`safetyBoundaries[${index}].humanReviewRequired must be boolean`);
      }
    });
  }

  validateReleaseEvidence(input.releaseEvidence, errors);

  return { ok: errors.length === 0, acceptedRuntimeTargets, rejectedRuntimeTargets, warnings, errors };
}

export function emitStudioSpatialExport(
  input: unknown,
  authority?: StudioSpatialTrustedReleaseAuthority,
): StudioSpatialEmissionResult {
  const validation = validateStudioSpatialExport(input);
  if (validation.ok) {
    validateTrustedReleaseAuthority(
      input as StudioSpatialExport,
      (input as StudioSpatialExport).releaseEvidence,
      authority,
      validation.errors,
    );
    validation.ok = validation.errors.length === 0;
  }
  return validation.ok
    ? { ok: true, export: input as StudioSpatialExport, validation }
    : { ok: false, export: null, validation };
}

export function createBlockedStudioSpatialHandoff(input: {
  exportId: string;
  projectId: string;
  tenantId: string;
  userId: string;
}) {
  return {
    ok: false,
    status: 'blocked',
    legacyStatus: 'fallback_only',
    contractVersion: STUDIO_SPATIAL_HANDOFF_CONTRACT_VERSION,
    producer: 'urai-studio',
    consumer: 'urai-spatial',
    exportId: input.exportId,
    projectId: input.projectId,
    tenantId: input.tenantId,
    userId: input.userId,
    reason: 'complete_spatial_handoff_evidence_required',
    missing: ['sceneManifest', 'assetManifest', 'consentReceipt', 'safetyBoundaries', 'releaseEvidence'],
    liveIntegrationClaimed: false,
  } as const;
}

export const validateStudioSpatialManifest = validateStudioSpatialExport;
export const listBlockedStudioSpatialClaims = (manifest: unknown): string[] =>
  validateStudioSpatialExport(manifest).errors;
export const isStudioSpatialManifestReleaseSafe = (
  manifest: unknown,
  authority?: StudioSpatialTrustedReleaseAuthority,
): manifest is StudioSpatialExport => emitStudioSpatialExport(manifest, authority).ok;
