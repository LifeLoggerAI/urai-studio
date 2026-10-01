export type FilmFoundryPhase =
  | 'canon'
  | 'story'
  | 'continuity'
  | 'shots'
  | 'assets'
  | 'animatic'
  | 'render'
  | 'editorial'
  | 'accessibility'
  | 'review'
  | 'master'
  | 'release';

export type FilmFoundryState =
  | 'blocked'
  | 'draft'
  | 'ready-for-review'
  | 'approved'
  | 'rejected'
  | 'superseded';

export type FilmFoundryGateState = 'unknown' | 'blocked' | 'ready';

export type FilmFoundryControlRecord = {
  schemaVersion: 1;
  productionId: string;
  privateAuthorityRef: string;
  phase: FilmFoundryPhase;
  state: FilmFoundryState;
  sequenceId?: string;
  sceneId?: string;
  shotId?: string;
  assetRefs: string[];
  versionRefs: string[];
  reviewRefs: string[];
  approvalRefs: string[];
  blockerRefs: string[];
  evidenceRefs: string[];
  canonState: FilmFoundryGateState;
  consentState: FilmFoundryGateState;
  continuityState: FilmFoundryGateState;
  factualConfidenceState: FilmFoundryGateState;
  rightsState: 'unknown' | 'blocked' | 'cleared';
  accessibilityState: 'not-reviewed' | 'incomplete' | 'ready';
  providerState: 'hard-off' | 'configured' | 'authorized';
  costState: 'unapproved' | 'bounded' | 'receipted';
  renderState: 'not-started' | 'proof' | 'candidate' | 'accepted';
  masterState: 'not-started' | 'candidate' | 'accepted';
  releaseState: 'private-only' | 'blocked' | 'approved';
  providerSpendAuthorized: false;
  publicReleaseAuthorized: false;
};

export function createFilmFoundryControl(
  input: Omit<FilmFoundryControlRecord, 'schemaVersion' | 'providerSpendAuthorized' | 'publicReleaseAuthorized'>,
): FilmFoundryControlRecord {
  if (!input.productionId.trim()) throw new Error('film_foundry_production_id_required');
  if (!input.privateAuthorityRef.trim()) throw new Error('film_foundry_private_authority_required');
  return {
    schemaVersion: 1,
    ...input,
    providerSpendAuthorized: false,
    publicReleaseAuthorized: false,
  };
}

export function filmFoundryAdvanceBlockers(record: FilmFoundryControlRecord): string[] {
  const blockers: string[] = [];
  if (record.state !== 'approved') blockers.push('film_foundry_record_not_approved');
  if (record.canonState !== 'ready') blockers.push('film_foundry_canon_not_ready');
  if (record.consentState !== 'ready') blockers.push('film_foundry_consent_not_ready');
  if (record.continuityState !== 'ready') blockers.push('film_foundry_continuity_not_ready');
  if (record.factualConfidenceState !== 'ready') blockers.push('film_foundry_factual_confidence_not_ready');
  if (record.rightsState !== 'cleared') blockers.push('film_foundry_rights_not_cleared');
  if (record.accessibilityState !== 'ready') blockers.push('film_foundry_accessibility_not_ready');
  if (record.costState === 'unapproved') blockers.push('film_foundry_budget_not_bounded');
  if (record.reviewRefs.length === 0) blockers.push('film_foundry_review_receipt_required');
  if (record.approvalRefs.length === 0) blockers.push('film_foundry_approval_receipt_required');
  if (record.blockerRefs.length > 0) blockers.push('film_foundry_blockers_present');
  if (record.evidenceRefs.length === 0) blockers.push('film_foundry_evidence_required');
  return blockers;
}

export function filmFoundryCanAdvance(record: FilmFoundryControlRecord) {
  return filmFoundryAdvanceBlockers(record).length === 0;
}
