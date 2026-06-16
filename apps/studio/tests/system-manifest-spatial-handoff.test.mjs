import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = resolve(import.meta.dirname, '../../..');
const manifestSource = readFileSync(resolve(repoRoot, 'apps/studio/app/api/system/manifest/route.ts'), 'utf8');
const handoffSource = readFileSync(resolve(repoRoot, 'apps/studio/lib/studio-spatial-handoff.ts'), 'utf8');

test('system manifest exposes the Studio Spatial handoff contract block', () => {
  const requiredManifestFragments = [
    'STUDIO_SPATIAL_HANDOFF_VERSION',
    'spatialHandoff',
    'schemaVersion',
    'discovery',
    'exportField',
    'exportRoute',
    'staticDiscovery',
    'fallbackStatus',
    'fallbackRenderer',
  ];

  for (const fragment of requiredManifestFragments) {
    assert.match(manifestSource, new RegExp(fragment), `manifest route is missing ${fragment}`);
  }

  assert.match(handoffSource, /export const STUDIO_SPATIAL_HANDOFF_VERSION/, 'handoff version export is required');
  assert.match(manifestSource, /schemaVersion:\s*STUDIO_SPATIAL_HANDOFF_VERSION/, 'manifest must use the shared handoff version');
});
