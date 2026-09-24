import assert from 'node:assert/strict';
import fs from 'node:fs';

const life = fs.readFileSync(new URL('../lib/studio/life-movies.ts', import.meta.url), 'utf8');
const route = fs.readFileSync(new URL('../app/api/studio/life-movies/route.ts', import.meta.url), 'utf8');
const page = fs.readFileSync(new URL('../app/studio/life-movies/page.tsx', import.meta.url), 'utf8');

for (const token of [
  "'original-source'",
  "'user-provided-fact'",
  "'verified-metadata'",
  "'user-recorded-memory'",
  "'inferred'",
  "'reconstructed'",
  "'generated'",
  "'artistic-interpretation'",
  "'unknown'",
  "spatialRequired: false",
  "privateByDefault: true",
  "publicReleaseAuthorized: false",
  "providerGenerationAuthorized: false",
  "renderEngine: 'ffmpeg-worker'",
  "requestedExports: ['mp4', 'srt', 'json']",
  'source_consent_required',
  'source_rights_required',
  'source_provenance_required',
]) assert.ok(life.includes(token), `Life Movies contract missing ${token}`);

assert.ok(route.includes('requireStudioAuth'), 'Life Movies API must use canonical Studio auth');
assert.ok(route.includes("kind: 'video_generation'"), 'Life Movies must queue through canonical Studio video jobs');
assert.ok(route.includes('createStudioJob'), 'Life Movies must use canonical Studio persistence');
assert.ok(route.includes('providerGenerationAuthorized: false'), 'provider generation must remain fail-closed');
assert.ok(page.includes('does not depend on Spatial'), 'public Studio copy must state the non-Spatial video path');
assert.ok(page.includes('MP4 · SRT · JSON'), 'Life Movies page must expose ordinary video/caption/manifest outputs');

console.log('Life Movies launch contract guard passed');
