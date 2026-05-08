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
  '/terms',
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
  '/readyz',
];

assert.equal(routes.length, 25);
assert.ok(routes.includes('/systems'));
assert.ok(routes.includes('/system'));
assert.ok(routes.includes('/studio'));
assert.ok(routes.includes('/privacy'));
assert.ok(routes.includes('/terms'));
assert.ok(routes.includes('/status'));
assert.ok(routes.includes('/readyz'));
assert.ok(routes.includes('/dashboard'));

console.log('static route declaration passed', routes.length);
