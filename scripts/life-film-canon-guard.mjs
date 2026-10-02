import fs from 'node:fs';
import path from 'node:path';

const productionPath = path.resolve('productions/built-from-survival/built-from-survival.production.json');
const contractPath = path.resolve('apps/studio/lib/life-film-canon.ts');
const memoryToMediaContractPath = path.resolve('productions/media-master/memory-to-media-canon.contract.json');
const sourceEvidenceContractPath = path.resolve('productions/media-master/source-evidence.contract.json');

const productionText = fs.readFileSync(productionPath, 'utf8');
const contractText = fs.readFileSync(contractPath, 'utf8');
const memoryToMediaContractText = fs.readFileSync(memoryToMediaContractPath, 'utf8');
const sourceEvidenceContractText = fs.readFileSync(sourceEvidenceContractPath, 'utf8');
const memoryToMedia = JSON.parse(memoryToMediaContractText);
const sourceEvidence = JSON.parse(sourceEvidenceContractText);
const production = JSON.parse(productionText);

// Detect concrete private source pointers, not harmless prose that names a provider.
// Public production policy is allowed to say that Gmail/Drive pointers are forbidden.
const forbidden = [
  /drive\.google\.com/i,
  /docs\.google\.com/i,
  /mail\.google\.com/i,
  /gmailMessageId/i,
  /driveFileId/i,
  /driveFolderId/i,
  /driveContactSheetId/i,
  /13OiHavP9MSFgObm9GRANza9eCHAiWo0e/,
  /1luj263eAfUo4wzAhQDakBzRdaUJm6AMn/,
  /1D-ISJKQkSa9__ASzRUvUyOnXAVnAc77Y/,
];

const combinedPublicText = `${productionText}\n${contractText}\n${memoryToMediaContractText}\n${sourceEvidenceContractText}`;
for (const pattern of forbidden) {
  if (pattern.test(combinedPublicText)) {
    throw new Error(`private_life_film_pointer_leaked:${pattern}`);
  }
}

if (production?.sourceResolution?.mode !== 'private-canon-broker') {
  throw new Error('life_film_private_canon_broker_not_enabled');
}
if (production?.sourceResolution?.automatic !== true) {
  throw new Error('life_film_canon_resolution_not_automatic');
}
if (production?.sourceResolution?.manualUserUploadRequired !== false) {
  throw new Error('life_film_still_requires_manual_user_upload');
}
if (production?.sourceResolution?.unresolvedSourcesFailClosed !== true) {
  throw new Error('life_film_unresolved_sources_do_not_fail_closed');
}

const requiredKeys = [
  'ADAM-CURRENT-LIKENESS-001',
  'ADAM-AGE19-001',
  'ADAM-JACOB-MOTION-001',
];
for (const key of requiredKeys) {
  if (!production.sourceKeys.includes(key)) {
    throw new Error(`missing_canonical_life_film_source_key:${key}`);
  }
}

const requiredRuntimeCaptureKeys = [
  'URAI-HOME-RUNTIME-CAPTURE',
  'URAI-GROUND-RUNTIME-CAPTURE',
  'URAI-ORB-RUNTIME-CAPTURE',
  'URAI-LIFE-MAP-RUNTIME-CAPTURE',
  'URAI-FOCUS-RUNTIME-CAPTURE',
  'URAI-REPLAY-RUNTIME-CAPTURE',
  'URAI-PASSPORT-RUNTIME-CAPTURE',
  'URAI-STUDIO-RUNTIME-CAPTURE',
  'URAI-ASSET-FACTORY-RUNTIME-CAPTURE',
];
for (const key of requiredRuntimeCaptureKeys) {
  if (!production.sourceKeys.includes(key)) {
    throw new Error(`missing_life_film_runtime_capture_key:${key}`);
  }
}

if (memoryToMedia?.state !== 'fail-closed') {
  throw new Error('memory_to_media_contract_not_fail_closed');
}
if (memoryToMedia?.providerRole !== 'renderer-only') {
  throw new Error('provider_promoted_to_truth_authority');
}
if (memoryToMedia?.preGeneration?.sceneTruthPacketRequired !== true) {
  throw new Error('scene_truth_packet_not_required');
}
if (memoryToMedia?.preGeneration?.rawNarrativeOnlyPromptingAllowed !== false) {
  throw new Error('raw_narrative_prompting_not_blocked');
}
if (memoryToMedia?.postGeneration?.validationRequired !== true) {
  throw new Error('post_generation_canon_validation_not_required');
}
if (memoryToMedia?.postGeneration?.providerSuccessIsAcceptance !== false) {
  throw new Error('provider_success_incorrectly_counts_as_acceptance');
}
for (const failureCode of ['IDENTITY_FAIL','ROLE_FAIL','EYEWEAR_FAIL','VEHICLE_FAIL','ENVIRONMENT_FAIL','GENERICIZATION_FAIL']) {
  if (!memoryToMedia.failureCodes?.includes(failureCode)) {
    throw new Error(`missing_memory_to_media_failure_code:${failureCode}`);
  }
}

if (memoryToMedia?.preGeneration?.exactDimensionsMustBeSourceLocked !== true) {
  throw new Error('exact_scene_dimensions_not_source_locked');
}
if (memoryToMedia?.preGeneration?.criticalExactDimensionMayUseReconstruction !== false) {
  throw new Error('critical_exact_dimension_allows_reconstruction');
}
if (sourceEvidence?.rules?.sourceBytesImmutable !== true) {
  throw new Error('source_originals_not_immutable');
}
if (sourceEvidence?.rules?.metadataTimestampIsNotCaptureTimeUnlessProven !== true) {
  throw new Error('metadata_time_can_silently_become_capture_time');
}
if (sourceEvidence?.rules?.generatedMediaIsNeverSourceTruth !== true) {
  throw new Error('generated_media_can_become_source_truth');
}
if (sourceEvidence?.rules?.preciseGpsPrivateByDefault !== true) {
  throw new Error('precise_gps_not_private_by_default');
}
if (sourceEvidence?.rules?.sameEventClusteringRequiresEvidence !== true) {
  throw new Error('same_event_clustering_not_evidence_bound');
}

console.log('Life Film canon guard: PASS');
