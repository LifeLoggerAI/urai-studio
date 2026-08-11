import assert from 'node:assert/strict';
import fs from 'node:fs';

const script = fs.readFileSync(new URL('../../../scripts/studio-video-render-artifacts.mjs', import.meta.url), 'utf8');
const panel = fs.readFileSync(
  new URL('../app/studio/video-factory/RenderArtifactPanel.tsx', import.meta.url),
  'utf8',
);

for (const forbidden of ['.mp4.placeholder', 'MP4 placeholder', 'mp4PlaceholderPath']) {
  assert.equal(script.includes(forbidden), false, `artifact writer must not contain fake binary marker: ${forbidden}`);
  assert.equal(panel.includes(forbidden), false, `user-facing render panel must not contain fake binary marker: ${forbidden}`);
}

for (const required of [
  'binary-render-receipt.json',
  "status: 'not-rendered'",
  'playable: false',
  'playableMp4Written: false',
  "requiredComposer: 'playwright-ffmpeg'",
]) {
  assert.ok(script.includes(required), `artifact writer missing truth boundary: ${required}`);
}

for (const required of [
  'non-playable binary-render receipt',
  'does not write or represent a playable MP4',
  'Playwright plus FFmpeg composition path completes successfully',
]) {
  assert.ok(panel.includes(required), `render panel missing user-facing truth boundary: ${required}`);
}

console.log('video render artifact truth coverage passed');
