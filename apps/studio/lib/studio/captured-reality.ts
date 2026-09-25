import { createHash } from 'node:crypto';

export type CapturedRealityProjectState =
  | 'draft'
  | 'source-ready'
  | 'reconstructing'
  | 'qa-review'
  | 'accepted-private'
  | 'rejected'
  | 'blocked';

export type CapturedRealityProject = {
  schemaVersion: 'urai-studio-captured-reality-v1';
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  state: CapturedRealityProjectState;
  privateByDefault: true;
  sourceReceiptRefs: string[];
  requiredConsentPurposes: ['memory.storage', 'location.context'];
  reconstructionMethod: '3dgs' | 'photogrammetry' | 'nerf-derived' | 'hybrid';
  cameraSolveReceiptRef?: string;
  trainingReceiptRef?: string;
  sourceVsReconstructionReceiptRef?: string;
  archivalArtifactRef?: string;
  runtimeArtifactRef?: string;
  collisionArtifactRef?: string;
  assetFactoryPromotionReceiptRef?: string;
  spatialReplayBindingRef?: string;
  reviewRefs: string[];
  approvalRefs: string[];
  providerSpendAuthorized: false;
  publicReleaseAuthorized: false;
  xrReleaseAuthorized: false;
  createdAt: string;
};

export type CapturedRealityReviewReadiness = {
  ready: boolean;
  blockers: string[];
};

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function requireId(value: string, label: string) {
  if (!SAFE_ID.test(value)) throw new Error(`invalid_${label}`);
}

export function validateCapturedRealityProject(project: CapturedRealityProject) {
  requireId(project.id, 'captured_reality_project_id');
  requireId(project.tenantId, 'tenant_id');
  requireId(project.userId, 'user_id');
  if (!project.title.trim()) throw new Error('captured_reality_title_required');
  if (project.privateByDefault !== true) throw new Error('captured_reality_must_start_private');
  if (project.providerSpendAuthorized !== false) throw new Error('captured_reality_provider_spend_must_start_off');
  if (project.publicReleaseAuthorized !== false) throw new Error('captured_reality_public_release_must_start_off');
  if (project.xrReleaseAuthorized !== false) throw new Error('captured_reality_xr_release_must_start_off');
  if (project.sourceReceiptRefs.length === 0) throw new Error('captured_reality_source_receipt_required');
  if (project.requiredConsentPurposes.join('|') !== 'memory.storage|location.context') {
    throw new Error('captured_reality_memory_location_consent_required');
  }
  return project;
}

export function capturedRealityReviewReadiness(project: CapturedRealityProject): CapturedRealityReviewReadiness {
  validateCapturedRealityProject(project);
  const blockers: string[] = [];
  if (!project.cameraSolveReceiptRef) blockers.push('camera_solve_receipt_required');
  if (!project.trainingReceiptRef) blockers.push('training_receipt_required');
  if (!project.sourceVsReconstructionReceiptRef) blockers.push('source_vs_reconstruction_receipt_required');
  if (!project.archivalArtifactRef) blockers.push('archival_artifact_required');
  if (!project.runtimeArtifactRef) blockers.push('runtime_artifact_required');
  if (!project.collisionArtifactRef) blockers.push('collision_artifact_required');
  if (!project.assetFactoryPromotionReceiptRef) blockers.push('asset_factory_promotion_receipt_required');
  if (!project.spatialReplayBindingRef) blockers.push('spatial_replay_binding_required');
  if (project.reviewRefs.length === 0) blockers.push('review_receipt_required');
  if (project.approvalRefs.length === 0) blockers.push('approval_receipt_required');
  return { ready: blockers.length === 0, blockers };
}

export function createCapturedRealityProject(input: {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  sourceReceiptRefs: string[];
  reconstructionMethod: CapturedRealityProject['reconstructionMethod'];
  now?: string;
}) {
  return validateCapturedRealityProject({
    schemaVersion: 'urai-studio-captured-reality-v1',
    id: input.id,
    tenantId: input.tenantId,
    userId: input.userId,
    title: input.title.trim(),
    state: 'draft',
    privateByDefault: true,
    sourceReceiptRefs: input.sourceReceiptRefs,
    requiredConsentPurposes: ['memory.storage', 'location.context'],
    reconstructionMethod: input.reconstructionMethod,
    reviewRefs: [],
    approvalRefs: [],
    providerSpendAuthorized: false,
    publicReleaseAuthorized: false,
    xrReleaseAuthorized: false,
    createdAt: input.now ?? new Date().toISOString(),
  });
}

export function capturedRealityProjectDigest(project: CapturedRealityProject) {
  validateCapturedRealityProject(project);
  const canonical = JSON.stringify({
    schemaVersion: project.schemaVersion,
    id: project.id,
    tenantId: project.tenantId,
    userId: project.userId,
    sourceReceiptRefs: [...project.sourceReceiptRefs].sort(),
    requiredConsentPurposes: project.requiredConsentPurposes,
    reconstructionMethod: project.reconstructionMethod,
    cameraSolveReceiptRef: project.cameraSolveReceiptRef ?? null,
    trainingReceiptRef: project.trainingReceiptRef ?? null,
    sourceVsReconstructionReceiptRef: project.sourceVsReconstructionReceiptRef ?? null,
    archivalArtifactRef: project.archivalArtifactRef ?? null,
    runtimeArtifactRef: project.runtimeArtifactRef ?? null,
    collisionArtifactRef: project.collisionArtifactRef ?? null,
    assetFactoryPromotionReceiptRef: project.assetFactoryPromotionReceiptRef ?? null,
    spatialReplayBindingRef: project.spatialReplayBindingRef ?? null,
  });
  return createHash('sha256').update(canonical).digest('hex');
}

export const CAPTURED_REALITY_SYSTEM_OWNERSHIP = {
  sourceAuthority: 'URAI Privacy + private source owner',
  reconstructionExecution: 'URAI Jobs / authorized private reconstruction worker',
  assetGovernance: 'URAI Asset Factory',
  orchestrationAndReview: 'URAI Studio',
  runtimePresentation: 'URAI Spatial',
  providerSpendAuthorized: false,
  publicReleaseAuthorized: false,
  xrReleaseAuthorized: false,
} as const;
