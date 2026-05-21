import assert from 'node:assert/strict';
import fs from 'node:fs';

const modules = fs.readFileSync(new URL('../lib/studio/modules.ts', import.meta.url), 'utf8');

assert.ok(modules.includes('Gated admin surface'), 'Admin module must describe gated admin surface');
assert.ok(modules.includes('operator-only diagnostics'), 'Admin module must identify operator-only diagnostics');
assert.ok(modules.includes('Show gated public-demo state unless admin QA is explicitly enabled'), 'Admin fallback must stay gated by default');
assert.ok(modules.includes('Expose disconnected diagnostics; never fake success.'), 'Asset Factory must never fake success');
assert.ok(modules.includes('Display unconfigured state safely.'), 'Investor module must display unconfigured state safely');
assert.ok(!modules.includes("description: 'Admin and controls.'"), 'Admin module must not imply public controls are open');
assert.ok(!modules.includes("inputs: ['control actions']"), 'Admin module must not advertise public control actions');
assert.ok(!modules.includes("outputs: ['config updates']"), 'Admin module must not advertise public config updates');

console.log('module copy posture coverage passed');
