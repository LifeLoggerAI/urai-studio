import assert from 'node:assert/strict';
import fs from 'node:fs';

const factory = fs.readFileSync(new URL('../lib/studio-video-factory.ts', import.meta.url), 'utf8');
const capture = fs.readFileSync(new URL('../../../scripts/studio-video-route-capture.mjs', import.meta.url), 'utf8');
const composer = fs.readFileSync(new URL('../../../scripts/studio-video-compose-motion.mjs', import.meta.url), 'utf8');
const workflow = fs.readFileSync(new URL('../../../.github/workflows/video-factory-verification.yml', import.meta.url), 'utf8');

for (const route of [
  "/life-map/?demo=1&manifestId=replay-recovery-thread&overview=1",
  "/focus?memoryId=quiet-reset&manifestId=replay-recovery-thread&node=quiet-reset&returnNode=quiet-reset&demo=1&from=life-map",
  "/replay?memoryId=quiet-reset&manifestId=replay-recovery-thread&node=quiet-reset&returnNode=quiet-reset&demo=1&from=life-map",
  "/passport/?demo=1",
]) {
  assert.ok(factory.includes(`route: '${route}'`), `Video Factory must preserve disclosed route identity: ${route}`);
}

assert.doesNotMatch(factory, /label: 'Focus Chamber'/);
assert.doesNotMatch(factory, /label: 'Replay Chamber'/);
assert.match(factory, /label: 'Focus Memory Star'/);
assert.match(factory, /label: 'Replay Memory Environment'/);
assert.match(factory, /One star opens into focus./);
assert.match(factory, /Focus becomes a lived replay./);

for (const token of [
  'recordVideo:',
  'semanticReadyOffsetSeconds',
  'data-testid="urai-true-3d-life-map"',
  'data-testid="urai-final-focus-chamber"',
  'data-memory-status',
  "data-memory-id') === 'demo:quiet-reset'",
  'data-testid="cinematic-replay-client"',
  'data-replay-spatial-owner="r3f-immersive-memory-field"',
  'data-route-owner="passport-ownership-vault"',
  "data-passport-source') === 'demo'",
  'data-testid="urai-final-status-control-room"',
  'video_factory_route_capture_failed',
]) {
  assert.ok(capture.includes(token), `route capture must retain semantic evidence token: ${token}`);
}

for (const token of [
  'DIAGNOSTIC_PLAYABLE_MOTION_RENDER',
  'motionSource: true',
  'aaaAccepted: false',
  'finalLifeMovieAccepted: false',
  'publicReleaseAuthorized: false',
  'privateMemoryUsed: false',
  'providerGeneratedMediaUsed: false',
  'semantic-ready live product route WebM captures',
  "spawnSync(command, args",
  "'ffmpeg'",
  "'ffprobe'",
  'outputSha256',
]) {
  assert.ok(composer.includes(token), `motion composer must retain truth/evidence token: ${token}`);
}

assert.match(workflow, /Compose and verify semantic-ready motion MP4/);
assert.match(workflow, /pnpm run video-factory:compose-motion/);

console.log('video factory semantic motion contract passed');
