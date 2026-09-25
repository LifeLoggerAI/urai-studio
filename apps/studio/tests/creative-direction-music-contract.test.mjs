import assert from 'node:assert/strict';
import fs from 'node:fs';

const direction = fs.readFileSync(new URL('../lib/studio/creative-direction.ts', import.meta.url), 'utf8');
const music = fs.readFileSync(new URL('../lib/studio/music-direction.ts', import.meta.url), 'utf8');

for (const token of [
  "studioRole: 'director, continuity supervisor, editorial compiler, finishing authority'",
  "roleModel: 'functional-production-authorities-not-autonomous-personas'",
  "'final film pacing'",
  "'likeness and voice synthesis'",
  "'music licensing'",
  "'final public release'",
  'creative_direction_rights_privacy_requires_human_approval',
]) assert.ok(direction.includes(token), `creative direction authority missing: ${token}`);

for (const token of [
  "purpose: 'score intent, motif continuity, emotional pacing and dialogue-safe mix planning'",
  'generationIsNotRequiredForPlanning: true',
  'providerNeutral: true',
  'generatedMusicMustRemainProvenanced: true',
  'licensedOrUserMusicRequiresRightsAuthority: true',
  'providerExecutionAuthorized: false',
  'music_direction_rights_required',
  'music_direction_provenance_unresolved',
  'music_direction_generation_must_start_off',
  'music_direction_stems_required',
  'music_direction_cue_sheet_required',
  'music_direction_loop_tail_plan_required',
  'music_direction_dialogue_ducking_plan_required',
  'music_direction_delivery_mix_required',
  "'sensory-safe alternative where required'",
]) assert.ok(music.includes(token), `music direction authority missing: ${token}`);

console.log('creative direction and music authority contracts passed');
