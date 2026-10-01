export type LifeMediaFilmType =
  | 'life-movie'
  | 'documentary'
  | 'memory-film'
  | 'life-chapter-film'
  | 'people-film'
  | 'place-film'
  | 'pet-companion-film'
  | 'legacy-film'
  | 'storytime-film'
  | 'replay-cinematic'
  | 'life-map-memory-star-media'
  | 'short-form-recap'
  | 'feature-length-assembly';

export type LifeMediaAcceptanceState =
  | 'not-reviewed'
  | 'incomplete'
  | 'failed'
  | 'accepted';

export type LifeMediaAcceptanceRecord = {
  schemaVersion: 1;
  productionId: string;
  filmType: LifeMediaFilmType;
  candidateSha: string;
  renderArtifactRefs: string[];
  sourceManifestRef: string;
  visualQuality: LifeMediaAcceptanceState;
  audioQuality: LifeMediaAcceptanceState;
  editorialQuality: LifeMediaAcceptanceState;
  identityContinuity: LifeMediaAcceptanceState;
  provenanceTruth: LifeMediaAcceptanceState;
  privacySecurity: LifeMediaAcceptanceState;
  accessibility: LifeMediaAcceptanceState;
  devicePlayback: LifeMediaAcceptanceState;
  exportPlayback: LifeMediaAcceptanceState;
  userControls: LifeMediaAcceptanceState;
  performance: LifeMediaAcceptanceState;
  failureRecovery: LifeMediaAcceptanceState;
  visualEvidenceRefs: string[];
  audioEvidenceRefs: string[];
  accessibilityEvidenceRefs: string[];
  privacyEvidenceRefs: string[];
  deviceEvidenceRefs: string[];
  exportEvidenceRefs: string[];
  reviewRefs: string[];
  independentAcceptanceRef?: string;
  blockerRefs: string[];
  providerSpendAuthorized: false;
  publicReleaseAuthorized: false;
};

const SHA40 = /^[a-f0-9]{40}$/;

export const LIFE_MEDIA_FILM_TYPES: readonly LifeMediaFilmType[] = [
  'life-movie',
  'documentary',
  'memory-film',
  'life-chapter-film',
  'people-film',
  'place-film',
  'pet-companion-film',
  'legacy-film',
  'storytime-film',
  'replay-cinematic',
  'life-map-memory-star-media',
  'short-form-recap',
  'feature-length-assembly',
];

export const LIFE_MEDIA_AAA_ACCEPTANCE_DIMENSIONS = [
  'visualQuality',
  'audioQuality',
  'editorialQuality',
  'identityContinuity',
  'provenanceTruth',
  'privacySecurity',
  'accessibility',
  'devicePlayback',
  'exportPlayback',
  'userControls',
  'performance',
  'failureRecovery',
] as const;

type AcceptanceDimension = typeof LIFE_MEDIA_AAA_ACCEPTANCE_DIMENSIONS[number];

function requireRefs(refs: readonly string[], error: string, blockers: string[]) {
  if (refs.length === 0 || refs.some((ref) => !ref.trim())) blockers.push(error);
}

export function lifeMediaAcceptanceBlockers(record: LifeMediaAcceptanceRecord): string[] {
  const blockers: string[] = [];

  if (!record.productionId.trim()) blockers.push('life_media_production_id_required');
  if (!LIFE_MEDIA_FILM_TYPES.includes(record.filmType)) blockers.push('life_media_film_type_invalid');
  if (!SHA40.test(record.candidateSha)) blockers.push('life_media_exact_candidate_sha_required');
  if (!record.sourceManifestRef.trim()) blockers.push('life_media_source_manifest_required');

  requireRefs(record.renderArtifactRefs, 'life_media_render_artifact_required', blockers);
  requireRefs(record.visualEvidenceRefs, 'life_media_visual_evidence_required', blockers);
  requireRefs(record.audioEvidenceRefs, 'life_media_audio_evidence_required', blockers);
  requireRefs(record.accessibilityEvidenceRefs, 'life_media_accessibility_evidence_required', blockers);
  requireRefs(record.privacyEvidenceRefs, 'life_media_privacy_evidence_required', blockers);
  requireRefs(record.deviceEvidenceRefs, 'life_media_device_evidence_required', blockers);
  requireRefs(record.exportEvidenceRefs, 'life_media_export_evidence_required', blockers);
  requireRefs(record.reviewRefs, 'life_media_review_receipt_required', blockers);

  for (const dimension of LIFE_MEDIA_AAA_ACCEPTANCE_DIMENSIONS) {
    if (record[dimension] !== 'accepted') blockers.push(`life_media_${dimension}_not_accepted`);
  }

  if (!record.independentAcceptanceRef?.trim()) blockers.push('life_media_independent_acceptance_required');
  if (record.blockerRefs.length > 0) blockers.push('life_media_blockers_present');
  if (record.providerSpendAuthorized !== false) blockers.push('life_media_provider_spend_must_not_self_authorize');
  if (record.publicReleaseAuthorized !== false) blockers.push('life_media_public_release_must_not_self_authorize');

  return blockers;
}

export function lifeMediaCanClaimAaaPlusPlusPlus(record: LifeMediaAcceptanceRecord) {
  return lifeMediaAcceptanceBlockers(record).length === 0;
}

export function acceptanceSummary(record: LifeMediaAcceptanceRecord) {
  const dimensions = Object.fromEntries(
    LIFE_MEDIA_AAA_ACCEPTANCE_DIMENSIONS.map((dimension: AcceptanceDimension) => [dimension, record[dimension]]),
  );
  const blockers = lifeMediaAcceptanceBlockers(record);
  return {
    productionId: record.productionId,
    filmType: record.filmType,
    candidateSha: record.candidateSha,
    dimensions,
    blockers,
    status: blockers.length === 0 ? 'AAA+++ VERIFIED' : 'NOT AAA+++ VERIFIED',
  } as const;
}

export const LIFE_MEDIA_AAA_ACCEPTANCE_AUTHORITY = {
  owner: 'URAI Studio',
  scope: 'Life Movies, films, documentaries, soundtrack, voice, speech, cinematic audio and memory-story media',
  exactHeadEvidenceRequired: true,
  literalVisualInspectionRequired: true,
  literalAudioInspectionRequired: true,
  devicePlaybackEvidenceRequired: true,
  exportPlaybackEvidenceRequired: true,
  provenanceEvidenceRequired: true,
  privacySecurityEvidenceRequired: true,
  accessibilityEvidenceRequired: true,
  failureRecoveryEvidenceRequired: true,
  independentAcceptanceRequired: true,
  metadataAloneIsNotQualityEvidence: true,
  passingCiAloneIsNotQualityEvidence: true,
  generatedButUnusedIsNotIntegrated: true,
  providerExecutionAuthorized: false,
  publicReleaseAuthorized: false,
} as const;
