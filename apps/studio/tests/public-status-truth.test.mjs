import assert from 'node:assert/strict';
import fs from 'node:fs';

const systems = fs.readFileSync(new URL('../lib/studio/systems.ts', import.meta.url), 'utf8');
const map = fs.readFileSync(new URL('../lib/studio/system-of-systems.ts', import.meta.url), 'utf8');
const page = fs.readFileSync(new URL('../app/status/page.tsx', import.meta.url), 'utf8');
const manifest = fs.readFileSync(new URL('../app/api/system/manifest/route.ts', import.meta.url), 'utf8');
const integrations = fs.readFileSync(new URL('../app/api/system/integrations/route.ts', import.meta.url), 'utf8');
const shell = fs.readFileSync(new URL('../components/studio/StudioShell.tsx', import.meta.url), 'utf8');
const hero = fs.readFileSync(new URL('../components/site/CinematicHero.tsx', import.meta.url), 'utf8');
const actionPanel = fs.readFileSync(new URL('../components/studio/StudioActionPanel.tsx', import.meta.url), 'utf8');

assert.ok(!systems.includes("status: 'Live'"), 'static Studio systems may not claim Live without observed proof');
assert.ok(systems.includes("'Evidence required'"), 'system cards need an evidence-required state');
assert.ok(!map.includes("status: 'live'"), 'system-of-systems map may not claim static live state');
assert.ok(map.includes("status: 'unverified'"), 'system-of-systems map must surface unverified state');
assert.ok(!map.includes("'Firebase connected'"), 'proof points may not claim Firebase connected from configuration alone');

assert.ok(page.includes('observeAllStudioIntegrations'), 'public status page must use observed integrations');
assert.ok(page.includes("buildReadinessProfile('FULL_STUDIO_PLATFORM'"), 'public status page must report full-platform evidence separately');
assert.ok(page.includes('Evidence incomplete'), 'status page must represent unresolved observed health');
assert.ok(!page.includes('Public shell online'), 'status page must not use unconditional online claims');

assert.ok(manifest.includes('publicIntegrationDiagnostics()'), 'manifest must sanitize integration configuration');
assert.ok(!manifest.includes('integrations: studioIntegrations'), 'manifest must not emit raw integration URLs or env keys');
assert.ok(integrations.includes('configurationRequired'), 'integration route may report config requirement without env key names');
assert.ok(!integrations.includes('requiredEnv:'), 'public integration route must not expose required env key names');

console.log('Studio public status truth guard passed');


for (const [label, source] of [
  ['Studio shell', shell],
  ['Cinematic hero', hero],
  ['Studio action panel', actionPanel],
]) {
  assert.ok(!source.includes('Live studio spine'), `${label} must not claim an unconditional live spine`);
  assert.ok(!source.includes('Live system actions'), `${label} must not claim unconditional live actions`);
}
assert.ok(shell.includes('Evidence-gated studio spine'));
assert.ok(actionPanel.includes('Gated system actions'));
