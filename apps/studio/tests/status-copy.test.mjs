import assert from 'node:assert/strict';
import fs from 'node:fs';

const statusPage = fs.readFileSync(new URL('../app/status/page.tsx', import.meta.url), 'utf8');

assert.ok(statusPage.includes('Public status separates local Studio readiness from downstream integration proof.'), 'status page must separate local readiness from downstream proof');
assert.ok(statusPage.includes('Configuration alone never counts as observed health.'), 'status page must reject configuration-only readiness');
assert.ok(statusPage.includes('Provider execution, Spatial handoff, and media production remain separately hard-off'), 'status page must describe execution gates honestly');
assert.ok(statusPage.includes('/api/system/health'), 'status page must link to health JSON');
assert.ok(statusPage.includes('/api/system/manifest'), 'status page must link to manifest JSON');
assert.ok(statusPage.includes('Gated Admin QA'), 'status page must describe admin link as gated');
assert.ok(!statusPage.includes('Firebase connected'), 'status page must not overclaim Firebase connection');
assert.ok(!statusPage.includes('<h2>Operational</h2>'), 'status page must not label all systems operational by default');
assert.ok(!statusPage.includes('Admin Diagnostics'), 'status page must not imply public admin diagnostics are open');

console.log('public status copy coverage passed');
