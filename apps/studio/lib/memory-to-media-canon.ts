export type MemoryTruthClass =
  | 'RECORDED_SOURCE_TRUTH'
  | 'SOURCE_SUPPORTED_RECONSTRUCTION'
  | 'ATTRIBUTED_RECOLLECTION'
  | 'INTERPRETIVE_RECREATION'
  | 'UNKNOWN';

export type MemoryToMediaFailureCode =
  | 'IDENTITY_FAIL'
  | 'AGE_FAIL'
  | 'ROLE_FAIL'
  | 'ERA_FAIL'
  | 'EYEWEAR_FAIL'
  | 'WARDROBE_FAIL'
  | 'UNIFORM_FAIL'
  | 'VEHICLE_FAIL'
  | 'OBJECT_FAIL'
  | 'ENVIRONMENT_FAIL'
  | 'GEOGRAPHY_FAIL'
  | 'ARCHITECTURE_FAIL'
  | 'TIME_OF_DAY_FAIL'
  | 'WEATHER_FAIL'
  | 'VOICE_FAIL'
  | 'DIALOGUE_FAIL'
  | 'CONTINUITY_FAIL'
  | 'PROVENANCE_FAIL'
  | 'TRUTH_CLASS_FAIL'
  | 'ANACHRONISM_FAIL'
  | 'GENERICIZATION_FAIL'
  | 'VISUAL_QUALITY_FAIL'
  | 'AUDIO_QUALITY_FAIL'
  | 'MOTION_FAIL'
  | 'LIPSYNC_FAIL';

export type CanonConfidence = 'confirmed' | 'high' | 'medium' | 'low' | 'unknown';

export type ScenePersonBinding = {
  personKey: string;
  ageEraKey: string;
  identityReferenceKeys: string[];
  roleKey: string | null;
  identifiable: boolean;
  eyewear: 'present' | 'absent' | 'unknown';
  wardrobeReferenceKeys: string[];
};

export type SceneTruthPacket = {
  schemaVersion: '1.0.0';
  sceneId: string;
  projectId: string;
  memoryKey: string;
  dateOrDateRange: string;
  dateConfidence: CanonConfidence;
  locationKey: string;
  locationConfidence: CanonConfidence;
  environmentClass: string;
  persons: ScenePersonBinding[];
  vehicles: string[];
  objects: string[];
  architecture: string[];
  weather: string;
  season: string;
  timeOfDay: string;
  vegetationLandscape: string[];
  cameraSourceReferenceKeys: string[];
  voiceReferenceKeys: string[];
  dialogueSourceKeys: string[];
  ambienceSourceKeys: string[];
  musicStatus: string;
  knownFacts: string[];
  attributedRecollections: string[];
  reconstructableDetails: string[];
  interpretiveDetails: string[];
  unknownDetails: string[];
  prohibitedInventions: string[];
  provenanceKeys: string[];
  confidence: CanonConfidence;
  continuityDependencies: string[];
  unresolvedContradictions: string[];
  criticalUnknownFields: string[];
};

export type ShotQualityDimension =
  | 'PHOTOREALISM'
  | 'IDENTITY_FIDELITY'
  | 'BIOGRAPHICAL_FIDELITY'
  | 'PLACE_FIDELITY'
  | 'ERA_FIDELITY'
  | 'OBJECT_VEHICLE_FIDELITY'
  | 'ROLE_FIDELITY'
  | 'CONTINUITY'
  | 'EMOTIONAL_FIDELITY'
  | 'CINEMATIC_QUALITY';

export type ShotQualityObservation = {
  dimension: ShotQualityDimension;
  state: 'pass' | 'fail' | 'not-reviewed';
  evidenceKey: string | null;
};

export type ShotReview = {
  shotId: string;
  sceneId: string;
  candidateAssetKey: string;
  sceneTruthPacketKey: string;
  provenanceKeys: string[];
  failureCodes: MemoryToMediaFailureCode[];
  qualityDimensions: ShotQualityObservation[];
  continuityReceiptKey: string | null;
  humanVisibleEvidenceKeys: string[];
  reviewState: 'machine-reviewed' | 'human-reviewed' | 'human-and-machine-reviewed';
};

export type SceneTruthValidation = {
  ok: boolean;
  errors: string[];
};

export type ShotAcceptanceReceipt = ShotReview & {
  accepted: boolean;
  rejectionReasons: string[];
};

const SAFE_KEY = /^[a-zA-Z0-9._:-]+$/;

function requireSafeKey(errors: string[], field: string, value: string) {
  if (!value || !SAFE_KEY.test(value)) {
    errors.push(`invalid_${field}`);
  }
}

export function validateSceneTruthPacket(packet: SceneTruthPacket): SceneTruthValidation {
  const errors: string[] = [];

  if (packet.schemaVersion !== '1.0.0') errors.push('unsupported_schema_version');
  requireSafeKey(errors, 'scene_id', packet.sceneId);
  requireSafeKey(errors, 'project_id', packet.projectId);
  requireSafeKey(errors, 'memory_key', packet.memoryKey);
  requireSafeKey(errors, 'location_key', packet.locationKey);

  if (!packet.dateOrDateRange.trim()) errors.push('missing_date_or_range');
  if (!packet.environmentClass.trim()) errors.push('missing_environment_class');
  if (!packet.provenanceKeys.length) errors.push('missing_provenance');
  if (!packet.prohibitedInventions.length) errors.push('missing_prohibited_inventions');

  if (packet.unresolvedContradictions.length) {
    errors.push('unresolved_critical_contradiction');
  }
  if (packet.criticalUnknownFields.length) {
    errors.push('critical_unknown_field');
  }

  for (const person of packet.persons) {
    requireSafeKey(errors, 'person_key', person.personKey);
    requireSafeKey(errors, 'age_era_key', person.ageEraKey);

    if (person.identifiable && !person.identityReferenceKeys.length) {
      errors.push(`missing_identity_reference:${person.personKey}`);
    }

    if (person.roleKey !== null && !person.roleKey.trim()) {
      errors.push(`invalid_role_binding:${person.personKey}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function buildShotAcceptanceReceipt(
  packet: SceneTruthPacket,
  review: ShotReview,
): ShotAcceptanceReceipt {
  const rejectionReasons: string[] = [];
  const packetValidation = validateSceneTruthPacket(packet);

  if (!packetValidation.ok) {
    rejectionReasons.push(...packetValidation.errors);
  }
  if (review.sceneId !== packet.sceneId) {
    rejectionReasons.push('scene_truth_packet_mismatch');
  }
  if (!review.provenanceKeys.length) {
    rejectionReasons.push('missing_shot_provenance');
  }
  if (review.failureCodes.length) {
    rejectionReasons.push(...review.failureCodes.map((code) => `material_failure:${code}`));
  }

  const hasIdentifiablePeople = packet.persons.some((person) => person.identifiable);
  if (hasIdentifiablePeople && !review.humanVisibleEvidenceKeys.length) {
    rejectionReasons.push('missing_human_visible_identity_evidence');
  }

  if (packet.continuityDependencies.length && !review.continuityReceiptKey) {
    rejectionReasons.push('missing_continuity_receipt');
  }

  if (
    review.qualityDimensions.some(
      (observation) => observation.state === 'fail' || observation.state === 'not-reviewed',
    )
  ) {
    rejectionReasons.push('quality_dimensions_not_fully_accepted');
  }

  return {
    ...review,
    accepted: rejectionReasons.length === 0,
    rejectionReasons,
  };
}

/**
 * Public-safe orchestration contract only.
 *
 * Private person names, Drive identifiers, raw media, exact addresses and
 * source identity assertions must stay behind the authenticated private canon
 * broker. Providers receive a canon-constrained packet, never the private
 * archive itself.
 */
export const MEMORY_TO_MEDIA_CANON_CONTRACT =
  'productions/media-master/memory-to-media-canon.contract.json' as const;
