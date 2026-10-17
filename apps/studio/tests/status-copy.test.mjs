import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const statusPage = fs.readFileSync(new URL('../app/status/page.tsx', import.meta.url), 'utf8');

assert.ok(statusPage.includes('Public shell online'), 'status page must describe public shell readiness honestly');
assert.ok(statusPage.includes('Firebase readiness surfaced'), 'status page must surface readiness without claiming connection');
assert.ok(statusPage.includes('feature-gated instead of faking live status'), 'status page must describe feature-gated posture');
assert.ok(statusPage.includes('/api/system/health'), 'status page must link to health JSON');
assert.ok(statusPage.includes('/api/system/manifest'), 'status page must link to manifest JSON');
assert.ok(statusPage.includes('Gated Admin QA'), 'status page must describe admin link as gated');
assert.ok(!statusPage.includes('Firebase connected'), 'status page must not overclaim Firebase connection');
assert.ok(!statusPage.includes('<h2>Operational</h2>'), 'status page must not label all systems operational by default');
assert.ok(!statusPage.includes('Admin Diagnostics'), 'status page must not imply public admin diagnostics are open');

console.log('public status copy coverage passed');

const homeProof = fs.readFileSync(new URL('../lib/studio/system-of-systems.ts', import.meta.url), 'utf8');
const homeMap = fs.readFileSync(new URL('../components/site/SystemOfSystemsMap.tsx', import.meta.url), 'utf8');
const homeHero = fs.readFileSync(new URL('../components/site/CinematicHero.tsx', import.meta.url), 'utf8');

test('homepage proof describes readiness without claiming configured Firebase or exports', () => {
  assert.ok(!homeProof.includes("'Firebase connected'"), 'homepage must not claim Firebase connection without runtime evidence');
  assert.ok(!homeProof.includes("'Export formats ready'"), 'homepage must not imply successful private export delivery');
  assert.ok(homeProof.includes('Firebase readiness surfaced'), 'homepage must surface the actual readiness check');
  assert.ok(homeProof.includes('Export formats defined'), 'homepage must distinguish the export contract from execution');
});

test('homepage system map does not claim every integration is connected', () => {
  assert.ok(!homeMap.includes('Every URAI system connected'), 'homepage must allow disconnected and fallback integration states');
  assert.ok(homeMap.includes('One studio spine for the UrAi ecosystem.'), 'homepage must describe the system map without false connectivity');
});

test('homepage hero scopes creative actions to system readiness', () => {
  assert.ok(!homeHero.includes('production-ready creative systems'), 'homepage must not claim production acceptance');
  assert.ok(!homeHero.includes('Live studio spine'), 'homepage must not claim the full pipeline is live');
  assert.ok(homeHero.includes('Available actions depend on each system'), 'homepage must communicate conditional availability');
});
