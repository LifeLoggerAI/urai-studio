import assert from 'node:assert/strict';

const routes = [
  '/',
  '/systems',
  '/system',
  '/studio',
  '/motion',
  '/cinema',
  '/music',
  '/visuals',
  '/spatial',
  '/privacy',
  '/demo',
  '/waitlist',
  '/contact',
  '/status',
  '/dashboard',
  '/assets',
  '/integrations',
  '/jobs',
  '/settings',
  '/usage',
  '/api/health',
  '/api/system/health',
  '/healthz',
];

assert.equal(routes.length, 23);
assert.ok(routes.includes('/systems'));
assert.ok(routes.includes('/system'));
assert.ok(routes.includes('/studio'));
assert.ok(routes.includes('/status'));
assert.ok(routes.includes('/dashboard'));

console.log('smoke routes declared', routes.length);