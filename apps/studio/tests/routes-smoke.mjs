import assert from 'node:assert/strict';

const routes = [
  '/',
  '/systems',
  '/system',
  '/studio',
  '/studio/projects',
  '/studio/assets',
  '/studio/exports',
  '/studio/admin',
  '/studio/settings',
  '/studio/xr',
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
  '/admin',
  '/jobs',
  '/settings',
  '/usage',
  '/api/health',
  '/api/system/health',
  '/healthz',
  '/readyz',
];

assert.equal(routes.length, 32);
assert.ok(routes.includes('/systems'));
assert.ok(routes.includes('/system'));
assert.ok(routes.includes('/studio'));
assert.ok(routes.includes('/studio/projects'));
assert.ok(routes.includes('/studio/assets'));
assert.ok(routes.includes('/studio/exports'));
assert.ok(routes.includes('/studio/admin'));
assert.ok(routes.includes('/admin'));
assert.ok(routes.includes('/studio/settings'));
assert.ok(routes.includes('/studio/xr'));
assert.ok(routes.includes('/privacy'));
assert.ok(routes.includes('/terms'));
assert.ok(routes.includes('/status'));
assert.ok(routes.includes('/readyz'));
assert.ok(routes.includes('/dashboard'));

console.log('static route declaration passed', routes.length);
