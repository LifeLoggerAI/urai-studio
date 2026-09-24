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
  rightsState: 'unknown' | 'blocked' | 'cleared';
  accessibilityState: 'not-reviewed' | 'incomplete' | 'ready';
  providerState: 'hard-off' | 'configured' | 'authorized';
  costState: 'unapproved' | 'bounded' | 'receipted';
  renderState: 'not-started' | 'proof' | 'candidate' | 'accepted';
  masterState: 'not-started' | 'candidate' | 'accepted';
  releaseState: 'private-only' | 'blocked' | 'approved';
  evidenceRefs: string[];
  providerSpendAuthorized: false;
  publicReleaseAuthorized: false;
};

export function createFilmFoundryControl(
  input: Omit<FilmFoundryControlRecord, 'schemaVersion' | 'providerSpendAuthorized' | 'publicReleaseAuthorized'>,
): FilmFoundryControlRecord {
  return {
    schemaVersion: 1,
    ...input,
    providerSpendAuthorized: false,
    publicReleaseAuthorized: false,
  };
}

export function filmFoundryCanAdvance(record: FilmFoundryControlRecord) {
  return (
    record.state === 'approved' &&
    record.rightsState === 'cleared' &&
    record.accessibilityState === 'ready' &&
    record.reviewRefs.length > 0 &&
    record.approvalRefs.length > 0 &&
    record.blockerRefs.length === 0 &&
    record.evidenceRefs.length > 0
  );
}
