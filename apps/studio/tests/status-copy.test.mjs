import assert from 'node:assert/strict';
import fs from 'node:fs';

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
