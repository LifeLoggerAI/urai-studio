import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../lib/studio/creative-timeline.ts', import.meta.url), 'utf8');

for (const token of [
  "export const CREATIVE_TIMELINE_SCHEMA = 'urai-creative-timeline-1'",
  "'picture'",
  "'camera'",
  "'motion'",
  "'dialogue'",
  "'narration'",
  "'music'",
  "'sound'",
  "'caption'",
  "'haptic'",
  "'interaction'",
  "'truth-label'",
  "'accessibility'",
  "providerExecutionAuthorized: false",
  "publicReleaseAuthorized: false",
  'MAX_LAUNCH_DURATION_MS = 45 * 60 * 1000',
  'creative_timeline_launch_duration_exceeded',
  'creative_timeline_provider_execution_must_start_off',
  'creative_timeline_public_release_must_start_off',
  'creative_timeline_source_required',
  'shared temporal authority for cinema, motion, music, voice, sound, accessibility, truth cues and interaction',
]) {
  assert.ok(source.includes(token), `creative timeline contract missing: ${token}`);
}

assert.ok(source.includes("event.provenance !== 'generated'"));
assert.ok(source.includes("event.provenance !== 'artistic-interpretation'"));
assert.ok(source.includes('notProviderAuthorization: true'));
assert.ok(source.includes('notPublicReleaseAuthorization: true'));

console.log('creative timeline authority contract passed');
