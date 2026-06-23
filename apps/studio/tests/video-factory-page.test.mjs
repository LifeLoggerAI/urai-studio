import assert from 'node:assert/strict';
import fs from 'node:fs';

const pageSource = fs.readFileSync(new URL('../app/studio/video-factory/page.tsx', import.meta.url), 'utf8');
const factorySource = fs.readFileSync(new URL('../lib/studio-video-factory.ts', import.meta.url), 'utf8');

assert.ok(pageSource.includes('data-urai-studio-page="video-factory"'), 'Video Factory page must expose a stable page marker.');
assert.ok(pageSource.includes('validateVideoFactoryManifest'), 'Video Factory page must show manifest validation state.');
assert.ok(pageSource.includes('sumShotDurationsSeconds'), 'Video Factory page must show shot duration proof.');
assert.ok(pageSource.includes('buildVideoFactoryPrompt'), 'Video Factory page must expose the generated render prompt.');
assert.ok(pageSource.includes('/api/studio/video-factory'), 'Video Factory page must link to the Studio API contract.');
assert.ok(pageSource.includes('queuePayload'), 'Video Factory page must expose the queue payload.');
assert.ok(factorySource.includes("route: '/home'"), 'Canonical template must still use /home for Home World capture.');
assert.ok(!factorySource.includes("route: '/'"), 'Canonical template must not add a duplicate / route capture.');

console.log('video factory page regression passed');
