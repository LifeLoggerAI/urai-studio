import assert from 'node:assert/strict';
import fs from 'node:fs';

const ui = fs.readFileSync(new URL('../components/studio/future/BrainMapEvidenceList.tsx', import.meta.url), 'utf8');
const model = fs.readFileSync(new URL('../lib/studio/brain-map.ts', import.meta.url), 'utf8');

for (const marker of [
  "'use client'",
  'filterBrainMapNodes',
  'type="search"',
  'System layer',
  'Health',
  'aria-live="polite"',
  'Interactive Brain Map system graph',
  '<svg',
  'role="button"',
  'Accessible evidence node list',
  'Open repository',
  'data-brain-map-activation-authorized="false"',
]) {
  assert.ok(ui.includes(marker), `Brain Map UI missing: ${marker}`);
}

for (const prohibited of [
  'rawMemoriesAllowed: true',
  'privateTextAllowed: true',
  'healthDataAllowed: true',
  'preciseLocationAllowed: true',
  'secretsAllowed: true',
  'providerCredentialsAllowed: true',
]) {
  assert.ok(!model.includes(prohibited), `Brain Map privacy boundary regressed: ${prohibited}`);
}

assert.ok(model.includes('activationAuthorized: false'));
assert.ok(model.includes('accessibleListEquivalentRequired: true'));

console.log('Brain Map hard-off interactive cockpit guard passed');
