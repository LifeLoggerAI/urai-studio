import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lib/studio/digital-human.ts', import.meta.url), 'utf8');
const provider = fs.readFileSync(new URL('../lib/studio/provider-adapter.ts', import.meta.url), 'utf8');
const motion = fs.readFileSync(new URL('../lib/studio/motion-direction.ts', import.meta.url), 'utf8');
const authority = fs.readFileSync(new URL('../../../docs/contracts/URAI_DIGITAL_HUMAN_VOICE_LAUNCH_AUTHORITY.md', import.meta.url), 'utf8');

for (const token of [
  "'authorized-voice-clone'",
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
  'reducedMotionEquivalentRef',
  'nonVisualEquivalentRef',
  'finalLikenessApproved: false',
  'finalVoiceApproved: false',
  'finalPerformanceCertified: false',
  'providerExecutionAuthorized: false',
  'publicReleaseAuthorized: false',
]) {
  assert.ok(source.includes(token), `digital-human contract missing ${token}`);
}

assert.ok(source.includes('digital_human_voice_clone_consent_required'));
assert.ok(source.includes('digital_human_voice_clone_rights_required'));
assert.ok(source.includes('digital_human_viseme_set_required_for_lipsync'));
assert.ok(source.includes('digital_human_gaze_required_for_eye_contact'));
assert.ok(provider.includes("'voice'"), 'Studio provider adapter must retain voice media support');
assert.ok(provider.includes('Source architecture never authorizes paid/network provider execution.'));
assert.ok(motion.includes("'lip-sync'"));
assert.ok(motion.includes("'character-face'"));
assert.ok(motion.includes("'hair-cloth'"));
assert.ok(motion.includes("'production lip sync'"));
assert.ok(authority.includes('Existing recordings alone are not authorization.'));
assert.ok(authority.includes('ARCHITECTURE / GOVERNANCE CONTRACT IMPLEMENTED'));
assert.ok(authority.includes('FINAL PROVIDER + RUNTIME + VISUAL PERFORMANCE CERTIFICATION OPEN'));

console.log('digital-human voice launch authority contract passed');
