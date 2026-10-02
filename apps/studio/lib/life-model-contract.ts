import type { SceneTruthPacket } from './memory-to-media-canon';

export const LIFE_MODEL_SCHEMA_VERSION = 'urai-life-model-v1' as const;

export type EvidenceClass =
  | 'SOURCE_CAPTURED'
  | 'SOURCE_DERIVED'
  | 'DIRECT_SUBJECT_TESTIMONY'
  | 'ATTRIBUTED_TESTIMONY'
  | 'CORROBORATED_INFERENCE'
  | 'CONTEXTUAL_RESEARCH'
  | 'UNKNOWN';

export type PresentationClass =
  | 'ARCHIVAL'
  | 'RECONSTRUCTED'
  | 'INTERPRETIVE'
  | 'SIMULATED'
  | 'COUNTERFACTUAL';

export type SceneDecision = 'READY' | 'READY_WITH_OCCLUSION' | 'READY_INTERPRETIVE' | 'BLOCKED';

export type CanonicalSceneTruthEnvelope = {
  lifeModelSchemaVersion: typeof LIFE_MODEL_SCHEMA_VERSION;
  sceneId: string;
  presentationClass: PresentationClass;
  evidenceClasses: EvidenceClass[];
  sourceKeys: string[];
  unknowns: string[];
  contradictions: string[];
  prohibitedInventions: string[];
  decision: SceneDecision;
  syntheticOutputMayBecomeHistoricalSource: false;
};

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

export function evidenceClassesForScene(packet: SceneTruthPacket): EvidenceClass[] {
  const values: EvidenceClass[] = [];
  if (packet.cameraSourceReferenceKeys.length || packet.voiceReferenceKeys.length || packet.dialogueSourceKeys.length) {
    values.push('SOURCE_CAPTURED');
  }
  if (packet.knownFacts.length) values.push('SOURCE_DERIVED');
  if (packet.attributedRecollections.length) values.push('ATTRIBUTED_TESTIMONY');
  if (packet.reconstructableDetails.length) values.push('CORROBORATED_INFERENCE');
  if (packet.interpretiveDetails.length) values.push('CONTEXTUAL_RESEARCH');
  if (packet.unknownDetails.length) values.push('UNKNOWN');
  return unique(values.length ? values : ['UNKNOWN']);
}

export function canonicalizeSceneTruth(
  packet: SceneTruthPacket,
  presentationClass: PresentationClass,
): CanonicalSceneTruthEnvelope {
  const contradictions = unique(packet.unresolvedContradictions);
  const criticalUnknowns = unique(packet.criticalUnknownFields);
  const unknowns = unique(packet.unknownDetails);

  let decision: SceneDecision;
  if (contradictions.length || criticalUnknowns.length) decision = 'BLOCKED';
  else if (presentationClass === 'INTERPRETIVE') decision = 'READY_INTERPRETIVE';
  else if (unknowns.length) decision = 'READY_WITH_OCCLUSION';
  else decision = 'READY';

  return {
    lifeModelSchemaVersion: LIFE_MODEL_SCHEMA_VERSION,
    sceneId: packet.sceneId,
    presentationClass,
    evidenceClasses: evidenceClassesForScene(packet),
    sourceKeys: unique([
      ...packet.provenanceKeys,
      ...packet.cameraSourceReferenceKeys,
      ...packet.voiceReferenceKeys,
      ...packet.dialogueSourceKeys,
      ...packet.ambienceSourceKeys,
    ]),
    unknowns,
    contradictions,
    prohibitedInventions: unique(packet.prohibitedInventions),
    decision,
    syntheticOutputMayBecomeHistoricalSource: false,
  };
}

export function assertGeneratedAssetTruth(input: {
  generated: boolean;
  evidenceClass: EvidenceClass;
  presentationClass: PresentationClass;
}) {
  if (input.generated && input.evidenceClass === 'SOURCE_CAPTURED') {
    throw new Error('GENERATED_ASSET_CANNOT_BE_SOURCE_CAPTURED');
  }
  if (
    input.generated
    && (input.presentationClass === 'SIMULATED' || input.presentationClass === 'COUNTERFACTUAL')
    && input.evidenceClass !== 'UNKNOWN'
  ) {
    throw new Error('SIMULATION_CANNOT_CREATE_HISTORICAL_EVIDENCE');
  }
}
