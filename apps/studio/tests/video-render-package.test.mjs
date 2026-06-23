import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(here, '..', 'lib', 'studio-video-renderer.ts'), 'utf8');

assert.ok(source.includes('VideoFactoryRenderPackage'));
assert.ok(source.includes('routeCapturePlan'));
assert.ok(source.includes('subtitleText'));
assert.ok(source.includes('exportManifest'));
assert.ok(source.includes('commandPlan'));

console.log('video render package smoke passed');
