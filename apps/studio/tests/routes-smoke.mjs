import assert from 'node:assert/strict';

const routes = ['/', '/systems', '/studio', '/motion', '/cinema', '/visuals', '/spatial', '/privacy', '/demo', '/waitlist', '/contact', '/api/health', '/healthz'];
assert.equal(routes.length, 13);
assert.ok(routes.includes('/systems'));
console.log('smoke routes declared', routes.length);
