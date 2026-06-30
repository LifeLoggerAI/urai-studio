import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../app/api/studio/exports/route.ts', import.meta.url), 'utf8');

assert.ok(src.includes('requireStudioAuth(req)'), 'exports route must require auth');
assert.ok(src.includes('createStudioExport'), 'exports route must use runtime export creation');
assert.ok(src.includes('createFallbackStudioSpatialManifest'), 'exports route must include spatial handoff manifest');
assert.ok(src.includes('Cache-Control'), 'exports route must set cache control');
assert.ok(src.includes('persisted: false'), 'exports route must report unpersisted fallback responses');
assert.ok(src.includes('persisted: true'), 'exports route must report persisted responses only after store success');
assert.ok(src.indexOf('requireStudioAuth(req)') < src.indexOf('createStudioExport'), 'exports route must authenticate before export creation');

console.log('studio export route smoke regression passed');
