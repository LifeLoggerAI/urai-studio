export type DigitalHumanVoiceMode =
  | 'original-recording'
  | 'authorized-synthetic'
  | 'authorized-voice-clone'
  | 'provider-neutral-tts'
  | 'none';

export type DigitalHumanPerformanceProvenance =
  | 'recorded-performance'
  | 'manual-animation'
  | 'generated'
  | 'reconstructed'
  | 'runtime-authored';

export type DigitalHumanIdentityAuthority = {
  subjectId: string;
  subjectConsentRef: string;
  likenessRightsRef: string;
  voiceRightsRef?: string;
  revocationAuthorityRef: string;
  minorsOrDependentSubject: boolean;
  guardianAuthorityRef?: string;
};

export type DigitalHumanVoicePlan = {
  mode: DigitalHumanVoiceMode;
  sourceRefs: string[];
  consentRef?: string;
  rightsRef?: string;
  providerId?: string;
  modelOrVoiceId?: string;
  language: string;
  captionsRequired: true;
  transcriptRequired: true;
  disclosureRequired: boolean;
  revocable: true;
};

export type DigitalHumanPerformancePlan = {
  schemaVersion: 1;
  performanceId: string;
  productionId: string;
  identity: DigitalHumanIdentityAuthority;
  voice: DigitalHumanVoicePlan;
  provenance: DigitalHumanPerformanceProvenance;
  faceRig: 'none' | 'blendshape' | 'facs-compatible';
  visemeSet: 'none' | 'provider' | 'custom';
  lipSyncMode: 'none' | 'offline-timed' | 'streaming';
  gazeMode: 'none' | 'scripted' | 'speaker-aware' | 'scene-aware';
  eyeContactEnabled: boolean;
  blinkModel: 'none' | 'procedural' | 'recorded';
  bodyMotion: 'none' | 'manual' | 'recorded' | 'generated';
  hairSimulation: 'none' | 'baked' | 'runtime';
  clothSimulation: 'none' | 'baked' | 'runtime';
  reducedMotionEquivalentRef: string;
  nonVisualEquivalentRef: string;
  latencyBudgetMs: {
    speechStart: number;
    interruptionResponse: number;
    lipSyncOffsetAbs: number;
    gazeResponse: number;
  };
  finalLikenessApproved: false;
  finalVoiceApproved: false;
  finalPerformanceCertified: false;
  providerExecutionAuthorized: false;
  publicReleaseAuthorized: false;
};

export const DIGITAL_HUMAN_LAUNCH_AUTHORITY = {
  owner: 'URAI Studio',
  runtimeOwners: ['URAI Spatial', 'URAI Studio renderer', 'governed provider adapter'],
  voiceCloneRequiresExplicitConsent: true,
  likenessRequiresExplicitRights: true,
  captionsRequired: true,
  transcriptRequired: true,
  reducedMotionEquivalentRequired: true,
  nonVisualEquivalentRequired: true,
  providerExecutionAuthorized: false,
  publicReleaseAuthorized: false,
  finalPhotorealPerformanceCertified: false,
} as const;

const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function requiredRef(value: string | undefined, code: string, errors: string[]) {
  if (!value?.trim()) errors.push(code);
}

function validLatency(value: number, min: number, max: number) {
  return Number.isFinite(value) && value >= min && value <= max;
}

export function validateDigitalHumanPerformancePlan(plan: DigitalHumanPerformancePlan): string[] {
  const errors: string[] = [];

  if (!SEGMENT.test(plan.performanceId)) errors.push('digital_human_performance_id_invalid');
  if (!SEGMENT.test(plan.productionId)) errors.push('digital_human_production_id_invalid');
  if (!SEGMENT.test(plan.identity.subjectId)) errors.push('digital_human_subject_id_invalid');

  requiredRef(plan.identity.subjectConsentRef, 'digital_human_subject_consent_required', errors);
  requiredRef(plan.identity.likenessRightsRef, 'digital_human_likeness_rights_required', errors);
  requiredRef(plan.identity.revocationAuthorityRef, 'digital_human_revocation_authority_required', errors);

  if (plan.identity.minorsOrDependentSubject && !plan.identity.guardianAuthorityRef?.trim()) {
    errors.push('digital_human_guardian_authority_required');
  }

  if (!plan.voice.language.trim()) errors.push('digital_human_voice_language_required');
  if (plan.voice.captionsRequired !== true) errors.push('digital_human_captions_must_be_required');
  if (plan.voice.transcriptRequired !== true) errors.push('digital_human_transcript_must_be_required');
  if (plan.voice.revocable !== true) errors.push('digital_human_voice_must_be_revocable');

  if (plan.voice.mode === 'authorized-voice-clone') {
    requiredRef(plan.voice.consentRef, 'digital_human_voice_clone_consent_required', errors);
    requiredRef(plan.voice.rightsRef, 'digital_human_voice_clone_rights_required', errors);
    requiredRef(plan.identity.voiceRightsRef, 'digital_human_identity_voice_rights_required', errors);
    if (plan.voice.sourceRefs.length === 0) errors.push('digital_human_voice_clone_source_required');
    if (!plan.voice.disclosureRequired) errors.push('digital_human_voice_clone_disclosure_required');
  }

  if (plan.voice.mode === 'authorized-synthetic' || plan.voice.mode === 'provider-neutral-tts') {
    requiredRef(plan.voice.consentRef, 'digital_human_synthetic_voice_consent_required', errors);
  }

  if (plan.voice.mode !== 'none' && plan.voice.sourceRefs.length === 0 && plan.voice.mode !== 'provider-neutral-tts') {
    errors.push('digital_human_voice_source_required');
  }

  if (plan.lipSyncMode !== 'none' && plan.visemeSet === 'none') {
    errors.push('digital_human_viseme_set_required_for_lipsync');
  }
  if (plan.eyeContactEnabled && plan.gazeMode === 'none') {
    errors.push('digital_human_gaze_required_for_eye_contact');
  }

  requiredRef(plan.reducedMotionEquivalentRef, 'digital_human_reduced_motion_equivalent_required', errors);
  requiredRef(plan.nonVisualEquivalentRef, 'digital_human_nonvisual_equivalent_required', errors);

  if (!validLatency(plan.latencyBudgetMs.speechStart, 50, 5000)) errors.push('digital_human_speech_latency_budget_invalid');
  if (!validLatency(plan.latencyBudgetMs.interruptionResponse, 50, 3000)) errors.push('digital_human_interruption_latency_budget_invalid');
  if (!validLatency(plan.latencyBudgetMs.lipSyncOffsetAbs, 0, 500)) errors.push('digital_human_lipsync_offset_budget_invalid');
  if (!validLatency(plan.latencyBudgetMs.gazeResponse, 0, 3000)) errors.push('digital_human_gaze_latency_budget_invalid');

  if (plan.finalLikenessApproved !== false) errors.push('digital_human_likeness_must_start_unapproved');
  if (plan.finalVoiceApproved !== false) errors.push('digital_human_voice_must_start_unapproved');
  if (plan.finalPerformanceCertified !== false) errors.push('digital_human_performance_must_start_uncertified');
  if (plan.providerExecutionAuthorized !== false) errors.push('digital_human_provider_execution_must_start_off');
  if (plan.publicReleaseAuthorized !== false) errors.push('digital_human_public_release_must_start_off');

  return errors;
}
