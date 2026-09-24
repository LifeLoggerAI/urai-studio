export type CutOneStage =
  | 'narrative'
  | 'script'
  | 'scene'
  | 'asset'
  | 'approval'
  | 'export'
  | 'staging'
  | 'release';

export type CutOneState = 'blocked' | 'draft' | 'review' | 'approved';

export type CutOneRecord = {
  schemaVersion: 1;
  id: string;
  stage: CutOneStage;
  sourceAuthorityRefs: string[];
  sceneId?: string;
  assetRefs: string[];
  approvalRefs: string[];
  exportRefs: string[];
  stagingEvidenceRefs: string[];
  releaseEvidenceRefs: string[];
  productProofRef?: string;
  state: CutOneState;
  providerExecutionAuthorized: false;
  publicReleaseAuthorized: false;
};

export const CUT_ONE_REQUIRED_SCENES = [
  'pressure',
  'open-app',
  'orb-chat',
  'self-status',
  'ground-operations',
  'council',
  'ascent',
  'life-map',
  'relationship-legacy',
  'focus',
  'replay',
  'mirror',
  'passport',
  'ar-xr-vr',
  'cta',
] as const;

export type CutOneSceneId = (typeof CUT_ONE_REQUIRED_SCENES)[number];

export type CutOneSceneRecord = {
  id: CutOneSceneId;
  title: string;
  state: CutOneState;
  sourceAuthorityRefs: string[];
  scriptRefs: string[];
  assetRefs: string[];
  approvalRefs: string[];
  exportRefs: string[];
  stagingEvidenceRefs: string[];
  releaseEvidenceRefs: string[];
  productProofRef?: string;
};

export type CutOneProductionBoard = {
  schemaVersion: 1;
  productionId: string;
  sourceAuthorityRefs: string[];
  scenes: CutOneSceneRecord[];
  scriptTrackerRefs: string[];
  assetTrackerRefs: string[];
  approvalTrackerRefs: string[];
  exportTrackerRefs: string[];
  stagingChecklistRefs: string[];
  releaseChecklistRefs: string[];
  providerExecutionAuthorized: false;
  publicReleaseAuthorized: false;
};

export type CutOneBoardReadiness = {
  sourceReady: boolean;
  blockers: string[];
  providerExecutionAuthorized: false;
  publicReleaseAuthorized: false;
};

export function createCutOneRecord(
  input: Omit<CutOneRecord, 'schemaVersion' | 'providerExecutionAuthorized' | 'publicReleaseAuthorized'>,
): CutOneRecord {
  if (input.sourceAuthorityRefs.length === 0) throw new Error('cut_one_source_authority_required');
  return {
    schemaVersion: 1,
    ...input,
    providerExecutionAuthorized: false,
    publicReleaseAuthorized: false,
  };
}

function assertCutOneScenes(scenes: CutOneSceneRecord[]) {
  const ids = scenes.map((scene) => scene.id);
  if (new Set(ids).size !== ids.length) throw new Error('cut_one_duplicate_scene');
  for (const required of CUT_ONE_REQUIRED_SCENES) {
    if (!ids.includes(required)) throw new Error(`cut_one_required_scene_missing:${required}`);
  }
}

export function createCutOneProductionBoard(
  input: Omit<CutOneProductionBoard, 'schemaVersion' | 'providerExecutionAuthorized' | 'publicReleaseAuthorized'>,
): CutOneProductionBoard {
  if (!input.productionId.trim()) throw new Error('cut_one_production_id_required');
  if (input.sourceAuthorityRefs.length === 0) throw new Error('cut_one_source_authority_required');
  assertCutOneScenes(input.scenes);
  return {
    schemaVersion: 1,
    ...input,
    providerExecutionAuthorized: false,
    publicReleaseAuthorized: false,
  };
}

export function evaluateCutOneBoardReadiness(board: CutOneProductionBoard): CutOneBoardReadiness {
  const blockers: string[] = [];
  if (board.scriptTrackerRefs.length === 0) blockers.push('cut_one_script_tracker_required');
  if (board.assetTrackerRefs.length === 0) blockers.push('cut_one_asset_tracker_required');
  if (board.approvalTrackerRefs.length === 0) blockers.push('cut_one_approval_tracker_required');
  if (board.exportTrackerRefs.length === 0) blockers.push('cut_one_export_tracker_required');
  if (board.stagingChecklistRefs.length === 0) blockers.push('cut_one_staging_checklist_required');
  if (board.releaseChecklistRefs.length === 0) blockers.push('cut_one_release_checklist_required');

  for (const scene of board.scenes) {
    if (scene.sourceAuthorityRefs.length === 0) blockers.push(`cut_one_scene_source_required:${scene.id}`);
    if (scene.scriptRefs.length === 0) blockers.push(`cut_one_scene_script_required:${scene.id}`);
    if (scene.assetRefs.length === 0) blockers.push(`cut_one_scene_asset_required:${scene.id}`);
    if (scene.approvalRefs.length === 0) blockers.push(`cut_one_scene_approval_required:${scene.id}`);
    if (scene.state !== 'approved') blockers.push(`cut_one_scene_not_approved:${scene.id}`);
  }

  return {
    sourceReady: blockers.length === 0,
    blockers,
    providerExecutionAuthorized: false,
    publicReleaseAuthorized: false,
  };
}
