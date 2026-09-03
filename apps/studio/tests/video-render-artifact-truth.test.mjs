import assert from 'node:assert/strict';
import fs from 'node:fs';

const script = fs.readFileSync(new URL('../../../scripts/studio-video-render-artifacts.mjs', import.meta.url), 'utf8');
const panel = fs.readFileSync(
  new URL('../app/studio/video-factory/RenderArtifactPanel.tsx', import.meta.url),
  'utf8',
);
const route = fs.readFileSync(new URL('../app/api/studio/video-factory/render/route.ts', import.meta.url), 'utf8');
const renderer = fs.readFileSync(new URL('../lib/studio-video-renderer.ts', import.meta.url), 'utf8');
const button = fs.readFileSync(
  new URL('../app/studio/video-factory/RenderPackageButton.tsx', import.meta.url),
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

assert.ok(panel.includes('RenderPackageButton'), 'render package must use the authenticated client action');
assert.ok(button.includes("'x-urai-studio-id'"), 'authenticated render package must send selected Studio scope');
assert.ok(route.includes('studioId: auth.tenantId'), 'protected render route must pass verified Studio scope');
assert.ok(renderer.includes('studios/${slug(studioId)}/video-factory'), 'render outputs must be tenant namespaced');
assert.ok(script.includes('STUDIO_API_BEARER_TOKEN'), 'deployed artifact command must require a bearer token');
assert.ok(script.includes("'x-urai-studio-id'"), 'artifact command must support explicit Studio scope');

console.log('video render artifact truth coverage passed');
