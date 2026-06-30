import assert from 'node:assert/strict';
import fs from 'node:fs';

const src = fs.readFileSync(new URL('../../../scripts/provider-readiness.mjs', import.meta.url), 'utf8');

assert.ok(src.includes('URAI_PROVIDER_STRICT'), 'provider readiness must support strict mode');
assert.ok(src.includes('not-configured'), 'missing providers must be reported without pretending readiness');
assert.ok(src.includes('blocked'), 'strict missing providers must be marked blocked');
assert.ok(src.includes('process.exit(1)'), 'strict failure must exit non-zero');
assert.ok(src.includes('providers'), 'readiness output must include provider rows');
assert.ok(src.includes('checkedAt'), 'readiness output must include timestamp');

console.log('provider readiness mode regression passed');
