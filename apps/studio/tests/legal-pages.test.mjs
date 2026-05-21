import assert from 'node:assert/strict';
import fs from 'node:fs';

const privacy = fs.readFileSync(new URL('../app/privacy/page.tsx', import.meta.url), 'utf8');
const terms = fs.readFileSync(new URL('../app/terms/page.tsx', import.meta.url), 'utf8');

assert.ok(privacy.includes('feature-gate unavailable integrations'), 'privacy page must mention feature gating');
assert.ok(privacy.includes('product-ready policy scaffold'), 'privacy page must identify legal review scaffold');
assert.ok(privacy.includes('finalized by counsel'), 'privacy page must require counsel review before broad launch');
assert.ok(privacy.includes('No internet service can be guaranteed completely secure'), 'privacy page must avoid absolute security claims');

assert.ok(terms.includes('Preview status'), 'terms page must include preview status');
assert.ok(terms.includes('should not be treated as a guaranteed service commitment'), 'terms page must avoid guaranteed service commitment');
assert.ok(terms.includes('must not claim completed generation unless a real backend job succeeds'), 'terms page must forbid fake generation claims');
assert.ok(terms.includes('launch-ready legal scaffold for review'), 'terms page must identify legal review scaffold');

for (const source of [privacy, terms]) {
  assert.ok(!source.includes('guaranteed completely secure.'), 'legal pages must not guarantee total security');
  assert.ok(!source.includes('guaranteed uninterrupted'), 'legal pages must not guarantee uninterrupted service');
}

console.log('legal page posture coverage passed');
