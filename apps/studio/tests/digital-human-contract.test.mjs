import assert from 'node:assert/strict';
import fs from 'node:fs';

const contract = fs.readFileSync(new URL('../lib/studio/digital-human.ts', import.meta.url), 'utf8');
const feature = fs.readFileSync(new URL('../lib/studio/feature-policy.ts', import.meta.url), 'utf8');
const docs = fs.readFileSync(new URL('../../../docs/DIGITAL_HUMAN_VOICE_AUTHORITY.md', import.meta.url), 'utf8');

for (const mode of [
  'original-recording',
  'authorized-synthetic',
  'authorized-voice-clone',
  'provider-neutral-tts',
]) {
  assert.ok(contract.includes(`'${mode}'`), `digital-human voice mode missing: ${mode}`);
}

for (const marker of [
  'subjectConsentRef',
  'likenessRightsRef',
  'voiceRightsRef',
  'revocationAuthorityRef',
  'guardianAuthorityRef',
  'captionsRequired: true',
  'transcriptRequired: true',
  'visemeSet',
  'lipSyncMode',
  'gazeMode',
  'eyeContactEnabled',
  'hairSimulation',
  'clothSimulation',
  'speechStart',
  'interruptionResponse',
  'lipSyncOffsetAbs',
  'gazeResponse',
  'digital_human_voice_clone_consent_required',
  'digital_human_voice_clone_rights_required',
  'digital_human_voice_clone_disclosure_required',
  'digital_human_viseme_set_required_for_lipsync',
  'digital_human_gaze_required_for_eye_contact',
  'digital_human_reduced_motion_equivalent_required',
  'digital_human_nonvisual_equivalent_required',
  'digital_human_likeness_must_start_unapproved',
  'digital_human_voice_must_start_unapproved',
  'digital_human_performance_must_start_uncertified',
  'digital_human_provider_execution_must_start_off',
  'digital_human_public_release_must_start_off',
]) {
  assert.ok(contract.includes(marker), `digital-human contract missing: ${marker}`);
}

for (const gate of ['synthetic-voice-execution', 'digital-human-performance']) {
  assert.ok(feature.includes(`| '${gate}'`), `feature type missing: ${gate}`);
  const occurrences = feature.split(`'${gate}'`).length - 1;
  assert.ok(occurrences >= 3, `feature must be typed, hard-off, and registered: ${gate}`);
}

assert.ok(docs.includes('This is not evidence that photoreal digital humans'));
assert.ok(docs.includes('must not be treated as automatic permission to clone'));
assert.ok(docs.includes('provider execution and public release remain hard-off'));

console.log('Digital Human and voice authority contract passed');
