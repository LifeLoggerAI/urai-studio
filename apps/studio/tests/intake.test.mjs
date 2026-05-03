import assert from 'node:assert/strict';
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../lib/studio/schema.ts', import.meta.url), 'utf8');
assert.ok(src.includes('validateWaitlistInput'));
assert.ok(src.includes('validateContactInput'));
assert.ok(src.includes('invalid_email'));
assert.ok(src.includes('spam_detected'));
assert.ok(src.includes('invalid_message'));
console.log('intake schema checks passed');
