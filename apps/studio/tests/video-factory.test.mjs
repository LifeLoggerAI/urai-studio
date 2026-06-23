import assert from 'node:assert/strict';
import fs from 'node:fs';

const factorySource = fs.readFileSync(new URL('../lib/studio-video-factory.ts', import.meta.url), 'utf8');
const routeSource = fs.readFileSync(new URL('../app/api/studio/video-factory/route.ts', import.meta.url), 'utf8');

function unique(values) {
  return new Set(values).size === values.length;
}

function section(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `missing section start: ${startMarker}`);
  assert.notEqual(end, -1, `missing section end: ${endMarker}`);
  return source.slice(start, end);
}

const routeCaptureSection = section(factorySource, 'routeCaptures:', 'shots:');
const assetPromptSection = section(factorySource, 'assetPrompts:', 'routeCaptures:');
const shotSection = section(factorySource, 'shots:', 'voiceover:');

const routeCaptures = [...routeCaptureSection.matchAll(/route:\s*'([^']+)'/g)].map((match) => match[1]);
const routeCaptureIds = [...routeCaptureSection.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1]);
const assetPromptIds = [...assetPromptSection.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1]);
const shotIds = [...shotSection.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1]);
const shotDurations = [...shotSection.matchAll(/durationSeconds:\s*(\d+)/g)].map((match) => Number(match[1]));
const manifestDuration = Number(/durationSeconds:\s*(\d+)/.exec(factorySource)?.[1]);

assert.ok(factorySource.includes("jobKind: 'video_generation'"), 'Video Factory must queue video_generation jobs.');
assert.ok(factorySource.includes("['mp4', 'srt', 'json']"), 'Video Factory must request mp4, srt, and json outputs.');
assert.ok(routeCaptures.includes('/home'), 'Video Factory must use /home as the canonical Home World route.');
assert.ok(!routeCaptures.includes('/'), 'Video Factory must not also capture / when /home is already captured.');
assert.ok(unique(routeCaptures), 'Video Factory route capture paths must be unique.');
assert.ok(unique(routeCaptureIds), 'Video Factory route capture ids must be unique.');
assert.ok(unique(assetPromptIds), 'Video Factory asset prompt ids must be unique.');
assert.ok(unique(shotIds), 'Video Factory shot ids must be unique.');
assert.equal(shotDurations.reduce((total, duration) => total + duration, 0), manifestDuration, 'Shot durations must equal manifest duration.');
assert.ok(factorySource.includes('duplicate_home_capture:/+/home'), 'Video Factory must include a / and /home duplicate guard.');
assert.match(routeSource, /createStudioJob/, 'Video Factory API must queue through the existing Studio job store.');
assert.match(routeSource, /buildVideoFactoryJobRequest/, 'Video Factory API must use the canonical manifest job builder.');
assert.match(routeSource, /validateVideoFactoryManifest/, 'Video Factory API must validate before queueing.');

console.log('video factory regression passed');
